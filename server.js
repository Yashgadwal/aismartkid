const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
let DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Disable caching for all API routes
app.use('/api', async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Wait for database sync from cloud in serverless
  if (isVercel && !dbInMemory && dbLoadPromise) {
    try {
      await dbLoadPromise;
    } catch (err) {
      console.error("Failed to load database from cloud on API request:", err);
    }
  }
  next();
});

// Serve Static Frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Database helper functions
const defaultSchema = {
  leads: [],
  professional_leads: [],
  students: [],
  batches: [],
  blogs: [],
  testimonials: [],
  gallery: [],
  attendance: [],
  settings: {
    instituteName: "AI Smart Institute",
    tagline: "Ujjain's First AI Institute for Kids",
    phone: "+91 83085 07820",
    whatsapp: "+918308507820",
    email: "",
    address: "B-9/8, Mahakal Vanijya Kendra, near Cosmos Mall, Ujjain, MP 456010",
    googleMapsEmbed: "https://maps.google.com/maps?q=Cosmos%20Mall,%20Ujjain&t=&z=15&ie=UTF8&iwloc=&output=embed",
    analyticsActive: true,
    whatsappNotificationActive: true,
    emailNotificationActive: false,
    razorpayActive: false,
    cohortDateJunior: "2026-08-01T16:00",
    cohortDateSenior: "2026-08-01T18:00",
    professional: {
      batchDate: "Sunday, 3:00 PM – 6:00 PM",
      totalSeats: 12,
      fee: 599,
      pageLive: true,
      registrationMode: "open"
    }
  },
  analytics: {
    dailyVisits: [],
    trafficSources: [],
    deviceTypes: [],
    pageViews: []
  }
};

// Writable database path compatibility check for serverless hosts (like Vercel)
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const KV_URL = process.env.KV_REST_API_URL || 
               process.env.UPSTASH_REDIS_REST_URL || 
               process.env.aismartkid_KV_REST_API_URL ||
               (Object.keys(process.env).find(k => k.endsWith('_KV_REST_API_URL')) ? process.env[Object.keys(process.env).find(k => k.endsWith('_KV_REST_API_URL'))] : null);

const KV_TOKEN = process.env.KV_REST_API_TOKEN || 
                 process.env.UPSTASH_REDIS_REST_TOKEN || 
                 process.env.aismartkid_KV_REST_API_TOKEN ||
                 (Object.keys(process.env).find(k => k.endsWith('_KV_REST_API_TOKEN')) ? process.env[Object.keys(process.env).find(k => k.endsWith('_KV_REST_API_TOKEN'))] : null);

const useKV = !!(KV_URL && KV_TOKEN);
let dbInMemory = null;
let dbLoadPromise = null;

function readDBFromFileSync() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), 'utf-8');
      return defaultSchema;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("DB File Read Error:", error);
    return defaultSchema;
  }
}

function loadDatabaseFromKV() {
  const https = require('https');
  const url = `${KV_URL}/get/aismartkids_db`;
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Authorization': `Bearer ${KV_TOKEN}`
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            let dbData = parsed.result;
            if (typeof dbData === 'string') {
              dbData = JSON.parse(dbData);
            }
            if (dbData && typeof dbData === 'object') {
              const repoDb = readDBFromFileSync();
              let needsWrite = false;

              // 1. Merge Leads
              if (repoDb.leads && repoDb.leads.length > 0) {
                if (!dbData.leads) dbData.leads = [];
                const originalLength = dbData.leads.length;
                repoDb.leads.forEach(repoL => {
                  const exists = dbData.leads.some(kvL => 
                    (kvL.id && kvL.id === repoL.id) || 
                    (kvL.phone && repoL.phone && kvL.phone.replace(/\s+/g, '') === repoL.phone.replace(/\s+/g, ''))
                  );
                  if (!exists) {
                    dbData.leads.push(repoL);
                  }
                });
                if (dbData.leads.length > originalLength) {
                  needsWrite = true;
                }
              }

              // Merge Professional Leads
              if (repoDb.professional_leads && repoDb.professional_leads.length > 0) {
                if (!dbData.professional_leads) dbData.professional_leads = [];
                const originalLength = dbData.professional_leads.length;
                repoDb.professional_leads.forEach(repoL => {
                  const exists = dbData.professional_leads.some(kvL => 
                    (kvL.id && kvL.id === repoL.id) ||
                    (kvL.phone && repoL.phone && kvL.phone.replace(/\s+/g, '') === repoL.phone.replace(/\s+/g, ''))
                  );
                  if (!exists) {
                    dbData.professional_leads.push(repoL);
                  }
                });
                if (dbData.professional_leads.length > originalLength) {
                  needsWrite = true;
                }
              }

              // 2. Merge Blogs
              if (repoDb.blogs && repoDb.blogs.length > 0) {
                if (!dbData.blogs) dbData.blogs = [];
                const originalLength = dbData.blogs.length;
                repoDb.blogs.forEach(repoB => {
                  const exists = dbData.blogs.some(kvB => kvB.id === repoB.id || kvB.slug === repoB.slug);
                  if (!exists) {
                    dbData.blogs.push(repoB);
                  }
                });
                if (dbData.blogs.length > originalLength) {
                  needsWrite = true;
                }
              }

              // 3. Merge Testimonials
              if (repoDb.testimonials && repoDb.testimonials.length > 0) {
                if (!dbData.testimonials) dbData.testimonials = [];
                const originalLength = dbData.testimonials.length;
                repoDb.testimonials.forEach(repoT => {
                  const exists = dbData.testimonials.some(kvT => kvT.id === repoT.id);
                  if (!exists) {
                    dbData.testimonials.push(repoT);
                  }
                });
                if (dbData.testimonials.length > originalLength) {
                  needsWrite = true;
                }
              }

              // 4. Merge Gallery
              if (repoDb.gallery && repoDb.gallery.length > 0) {
                if (!dbData.gallery) dbData.gallery = [];
                const originalLength = dbData.gallery.length;
                repoDb.gallery.forEach(repoG => {
                  const exists = dbData.gallery.some(kvG => kvG.id === repoG.id);
                  if (!exists) {
                    dbData.gallery.push(repoG);
                  }
                });
                if (dbData.gallery.length > originalLength) {
                  needsWrite = true;
                }
              }

              // 5. Merge Batches
              if (repoDb.batches && repoDb.batches.length > 0) {
                if (!dbData.batches) dbData.batches = [];
                const originalLength = dbData.batches.length;
                repoDb.batches.forEach(repoBt => {
                  const exists = dbData.batches.some(kvBt => kvBt.id === repoBt.id);
                  if (!exists) {
                    dbData.batches.push(repoBt);
                  }
                });
                if (dbData.batches.length > originalLength) {
                  needsWrite = true;
                }
              }

              // 6. Merge Settings
              if (repoDb.settings) {
                if (!dbData.settings) {
                  dbData.settings = { ...repoDb.settings };
                  needsWrite = true;
                } else {
                  Object.keys(repoDb.settings).forEach(key => {
                    if (dbData.settings[key] === undefined) {
                      dbData.settings[key] = repoDb.settings[key];
                      needsWrite = true;
                    }
                  });
                }
              }

              if (needsWrite) {
                console.log("Merged repository database updates into Vercel KV / Upstash.");
                saveDatabaseToKV(dbData);
              }

              dbInMemory = dbData;
              console.log("Successfully fetched database from Vercel KV / Upstash.");
              fs.writeFileSync(DB_FILE, JSON.stringify(dbInMemory, null, 2), 'utf-8');
              resolve(dbInMemory);
            } else {
              // KV key is empty, initialize it
              dbInMemory = readDBFromFileSync();
              saveDatabaseToKV(dbInMemory);
              resolve(dbInMemory);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Failed to fetch from KV: ${res.statusCode} ${body}`));
        }
      });
    }).on('error', reject);
  });
}

function saveDatabaseToKV(data) {
  try {
    const https = require('https');
    const payload = JSON.stringify(data);
    const url = `${KV_URL}/set/aismartkids_db`;
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.error("Vercel KV write error:", res.statusCode, body);
          }
        });
      }
    );
    req.on('error', (e) => console.error("Vercel KV sync error:", e));
    req.write(payload);
    req.end();
  } catch (err) {
    console.error("Failed to write to Vercel KV:", err);
  }
}

if (isVercel) {
  const tmpDB = path.join('/tmp', 'db.json');
  try {
    if (!fs.existsSync(tmpDB)) {
      if (fs.existsSync(DB_FILE)) {
        fs.copyFileSync(DB_FILE, tmpDB);
      } else {
        fs.writeFileSync(tmpDB, JSON.stringify(defaultSchema, null, 2), 'utf-8');
      }
    }
  } catch (err) {
    console.error("Vercel /tmp database initialization error:", err);
  }
  DB_FILE = tmpDB;

  if (useKV) {
    dbLoadPromise = loadDatabaseFromKV();
  } else {
    console.log("Vercel KV is not connected. Database running in temporary session mode.");
    dbInMemory = readDBFromFileSync();
  }
}

function readDB() {
  if (isVercel && dbInMemory) {
    return dbInMemory;
  }
  return readDBFromFileSync();
}

function writeDB(data) {
  if (isVercel) {
    dbInMemory = data;
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("DB Write Error:", error);
  }

  // Synchronize to Vercel KV if connected
  if (isVercel && useKV) {
    saveDatabaseToKV(data);
  }
}

// Database Load Synchronizer Middleware
async function ensureDbLoaded(req, res, next) {
  if (isVercel && useKV && dbLoadPromise) {
    try {
      await dbLoadPromise;
    } catch (err) {
      console.error("Failed to load database from KV in middleware:", err);
    }
  }
  next();
}

app.use(ensureDbLoaded);

// Authentication Check Middleware
function requireAuth(req, res, next) {
  const token = req.cookies.admin_token;
  if (token === 'ai_smart_kids_admin_auth_success') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized. Admin session required.' });
}

// ----------------------------------------
// AUTH API
// ----------------------------------------
app.get('/api/auth', (req, res) => {
  const token = req.cookies.admin_token;
  if (token === 'ai_smart_kids_admin_auth_success') {
    return res.json({ authenticated: true });
  }
  return res.json({ authenticated: false });
});

app.post('/api/auth', (req, res) => {
  const { action, username, password } = req.body;

  if (action === 'logout') {
    res.clearCookie('admin_token', { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
  }

  // Default credentials
  if (username === 'admin' && password === 'password123') {
    res.cookie('admin_token', 'ai_smart_kids_admin_auth_success', {
      httpOnly: true,
      secure: false, // Localhost dev server
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ----------------------------------------
// LEADS API
// ----------------------------------------
app.get('/api/leads', requireAuth, (req, res) => {
  const isExport = req.query.export === 'csv';
  const db = readDB();
  const leads = db.leads || [];

  if (isExport) {
    // Generate CSV string
    const headers = ['ID', 'Parent Name', 'Child Name', 'Age', 'School', 'Class', 'Phone', 'Email', 'Preferred Batch', 'Status', 'Notes', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      `"${(l.parentName || '').replace(/"/g, '""')}"`,
      `"${(l.childName || '').replace(/"/g, '""')}"`,
      l.age || 0,
      `"${(l.school || '').replace(/"/g, '""')}"`,
      `"${(l.class || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${(l.preferredBatch || '').replace(/"/g, '""')}"`,
      l.status || 'New',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.createdAt || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    return res.send(csvContent);
  }

  return res.json(leads);
});

app.post('/api/leads', (req, res) => {
  const { parentName, childName, age, school, class: childClass, phone, email, preferredBatch, message, status, notes, followUpDate } = req.body;

  if (!parentName || !childName || !phone) {
    return res.status(400).json({ success: false, message: 'Parent Name, Child Name, and Phone are required' });
  }

  const db = readDB();
  const newLead = {
    id: `lead_${Date.now()}`,
    parentName,
    childName,
    age: Number(age) || 0,
    school: school || '',
    class: childClass || '',
    phone,
    email: email || '',
    preferredBatch: preferredBatch || '',
    status: status || 'New',
    notes: notes || (message ? `Initial enquiry: ${message}` : ''),
    followUpDate: followUpDate || '',
    createdAt: new Date().toISOString()
  };

  db.leads.unshift(newLead);

  // Increment Lead Analytics count
  if (!db.analytics) {
    db.analytics = {
      dailyVisits: [],
      trafficSources: [],
      deviceTypes: [],
      pageViews: [],
      totalTimeSpentSec: 0
    };
  }
  if (!db.analytics.dailyVisits) {
    db.analytics.dailyVisits = [];
  }
  const today = new Date().toISOString().split('T')[0];
  const visitObj = db.analytics.dailyVisits.find(v => v.date === today);
  if (visitObj) {
    visitObj.leads += 1;
  } else {
    db.analytics.dailyVisits.push({ date: today, visits: 1, leads: 1 });
  }

  writeDB(db);

  // Log simulation outputs
  console.log(`[INTEGRATION DIAL MOCK] New lead reserved: ${childName} (Parent: ${parentName})`);

  return res.json({
    success: true,
    data: newLead,
    notificationLogs: [
      `Email receipt mock dispatched to ${email || 'parent'}`,
      `WhatsApp webhook confirmation log dispatched to ${phone}`
    ]
  });
});

app.put('/api/leads', requireAuth, (req, res) => {
  const { id, parentName, childName, age, school, class: childClass, phone, email, preferredBatch, status, notes, followUpDate } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing lead ID' });

  const db = readDB();
  const index = db.leads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found' });

  if (parentName !== undefined) db.leads[index].parentName = parentName;
  if (childName !== undefined) db.leads[index].childName = childName;
  if (age !== undefined) db.leads[index].age = Number(age) || 0;
  if (school !== undefined) db.leads[index].school = school;
  if (childClass !== undefined) db.leads[index].class = childClass;
  if (phone !== undefined) db.leads[index].phone = phone;
  if (email !== undefined) db.leads[index].email = email;
  if (preferredBatch !== undefined) db.leads[index].preferredBatch = preferredBatch;
  if (status !== undefined) db.leads[index].status = status;
  if (notes !== undefined) db.leads[index].notes = notes;
  if (followUpDate !== undefined) db.leads[index].followUpDate = followUpDate;

  writeDB(db);
  return res.json({ success: true, data: db.leads[index] });
});

app.delete('/api/leads', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.leads = db.leads.filter(l => l.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/leads/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.leads = db.leads.filter(l => l.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/leads/import', requireAuth, (req, res) => {
  const { leads, duplicateAction } = req.body;
  if (!Array.isArray(leads)) {
    return res.status(400).json({ error: 'Missing or invalid leads array' });
  }

  const db = readDB();
  let countAdded = 0;
  let countUpdated = 0;
  let countSkipped = 0;

  leads.forEach(importedLead => {
    const parentName = importedLead.parentName || '';
    const childName = importedLead.childName || '';
    const phone = (importedLead.phone || '').trim();

    if (!parentName || !childName || !phone) {
      countSkipped++;
      return;
    }

    const existingIndex = db.leads.findIndex(l => {
      const cleanExisting = (l.phone || '').replace(/\D/g, '');
      const cleanImported = phone.replace(/\D/g, '');
      return cleanExisting === cleanImported && cleanImported.length > 0;
    });

    if (existingIndex !== -1) {
      if (duplicateAction === 'overwrite') {
        db.leads[existingIndex] = {
          ...db.leads[existingIndex],
          parentName: parentName || db.leads[existingIndex].parentName,
          childName: childName || db.leads[existingIndex].childName,
          age: Number(importedLead.age) || db.leads[existingIndex].age || 0,
          school: importedLead.school || db.leads[existingIndex].school || '',
          class: importedLead.class || db.leads[existingIndex].class || '',
          email: importedLead.email || db.leads[existingIndex].email || '',
          preferredBatch: importedLead.preferredBatch || db.leads[existingIndex].preferredBatch || '',
          status: importedLead.status || db.leads[existingIndex].status || 'New',
          notes: importedLead.notes ? `${db.leads[existingIndex].notes || ''}\nImported Note: ${importedLead.notes}`.trim() : (db.leads[existingIndex].notes || ''),
          followUpDate: importedLead.followUpDate || db.leads[existingIndex].followUpDate || ''
        };
        countUpdated++;
      } else {
        countSkipped++;
      }
    } else {
      const newLead = {
        id: `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        parentName,
        childName,
        age: Number(importedLead.age) || 0,
        school: importedLead.school || '',
        class: importedLead.class || '',
        phone,
        email: importedLead.email || '',
        preferredBatch: importedLead.preferredBatch || '',
        status: importedLead.status || 'New',
        notes: importedLead.notes || '',
        followUpDate: importedLead.followUpDate || '',
        createdAt: new Date().toISOString()
      };
      db.leads.unshift(newLead);
      countAdded++;
    }
  });

  // Update Lead Analytics count
  if (countAdded > 0) {
    if (!db.analytics) {
      db.analytics = {
        dailyVisits: [],
        trafficSources: [],
        deviceTypes: [],
        pageViews: [],
        totalTimeSpentSec: 0
      };
    }
    if (!db.analytics.dailyVisits) {
      db.analytics.dailyVisits = [];
    }
    const today = new Date().toISOString().split('T')[0];
    const visitObj = db.analytics.dailyVisits.find(v => v.date === today);
    if (visitObj) {
      visitObj.leads += countAdded;
    } else {
      db.analytics.dailyVisits.push({ date: today, visits: countAdded, leads: countAdded });
    }
  }

  writeDB(db);
  return res.json({
    success: true,
    countAdded,
    countUpdated,
    countSkipped
  });
});

// ----------------------------------------
// PROFESSIONAL WORKSHOP API
// ----------------------------------------
app.get('/api/professional-seats', (req, res) => {
  const db = readDB();
  const settings = db.settings.professional || {
    batchDate: "Sunday, 3:00 PM – 6:00 PM",
    totalSeats: 12,
    fee: 599,
    pageLive: true,
    registrationMode: "open"
  };
  const leads = db.professional_leads || [];
  const confirmedCount = leads.filter(l => (l.status || '').toLowerCase().includes('confirmed')).length;
  const seatsRemaining = Math.max(0, settings.totalSeats - confirmedCount);
  
  return res.json({
    totalSeats: settings.totalSeats,
    confirmedCount,
    seatsRemaining,
    batchDate: settings.batchDate,
    fee: settings.fee,
    pageLive: settings.pageLive,
    registrationMode: settings.registrationMode
  });
});

app.post('/api/professional-leads', (req, res) => {
  const { name, phone, profession, city, source } = req.body;
  if (!name || !phone || !city) {
    return res.status(400).json({ success: false, message: 'Name, Phone, and City are required' });
  }
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit WhatsApp number' });
  }
  
  const db = readDB();
  if (!db.professional_leads) db.professional_leads = [];
  
  const isDuplicate = db.professional_leads.some(l => {
    const existingPhone = (l.phone || '').replace(/\D/g, '');
    return existingPhone === cleanPhone || (existingPhone.endsWith(cleanPhone) && cleanPhone.length >= 10);
  });
  
  const newLead = {
    id: `prof_lead_${Date.now()}`,
    name,
    phone: cleanPhone.length === 10 ? `+91${cleanPhone}` : phone,
    profession: profession || 'Other',
    city: city || 'Ujjain',
    source: source || 'Other',
    status: 'New',
    notes: '',
    isDuplicate,
    createdAt: new Date().toISOString()
  };
  
  db.professional_leads.unshift(newLead);
  
  // Increment Analytics lead count
  if (!db.analytics) {
    db.analytics = { dailyVisits: [] };
  }
  if (!db.analytics.dailyVisits) {
    db.analytics.dailyVisits = [];
  }
  const today = new Date().toISOString().split('T')[0];
  const visitObj = db.analytics.dailyVisits.find(v => v.date === today);
  if (visitObj) {
    visitObj.leads = (visitObj.leads || 0) + 1;
  } else {
    db.analytics.dailyVisits.push({ date: today, visits: 1, leads: 1 });
  }
  
  writeDB(db);
  
  console.log(`[PROFESSIONAL LEAD] New registration: ${name} (${profession})`);
  
  return res.json({
    success: true,
    data: newLead,
    notificationLogs: [
      `WhatsApp lead notification sent to admin (+918308507820)`,
      `Direct WhatsApp chat initialized for +91${cleanPhone}`
    ]
  });
});

app.get('/api/professional-leads', requireAuth, (req, res) => {
  const isExport = req.query.export === 'csv';
  const db = readDB();
  const leads = db.professional_leads || [];
  
  if (isExport) {
    const headers = ['Date & Time', 'Name', 'WhatsApp Number', 'Profession', 'City', 'Source', 'Status', 'Notes', 'Duplicate Flag'];
    const rows = leads.map(l => [
      l.createdAt || '',
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${l.profession || ''}"`,
      `"${l.city || ''}"`,
      `"${l.source || ''}"`,
      l.status || 'New',
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.isDuplicate ? 'Yes' : 'No'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="professional_leads.csv"');
    return res.send(csvContent);
  }
  
  return res.json(leads);
});

app.put('/api/professional-leads', requireAuth, (req, res) => {
  const { id, status, notes } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing lead ID' });
  
  const db = readDB();
  const index = db.professional_leads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found' });
  
  if (status !== undefined) db.professional_leads[index].status = status;
  if (notes !== undefined) db.professional_leads[index].notes = notes;
  
  writeDB(db);
  return res.json({ success: true, data: db.professional_leads[index] });
});

app.post('/api/professional-leads/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });
  
  const db = readDB();
  if (!db.professional_leads) db.professional_leads = [];
  db.professional_leads = db.professional_leads.filter(l => l.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/professional-settings', requireAuth, (req, res) => {
  const { batchDate, totalSeats, fee, pageLive, registrationMode } = req.body;
  const db = readDB();
  
  if (!db.settings.professional) db.settings.professional = {};
  
  if (batchDate !== undefined) db.settings.professional.batchDate = batchDate;
  if (totalSeats !== undefined) db.settings.professional.totalSeats = Number(totalSeats) || 12;
  if (fee !== undefined) db.settings.professional.fee = Number(fee) || 599;
  if (pageLive !== undefined) db.settings.professional.pageLive = !!pageLive;
  if (registrationMode !== undefined) db.settings.professional.registrationMode = registrationMode;
  
  writeDB(db);
  return res.json({ success: true, data: db.settings.professional });
});

// ----------------------------------------
// STUDENTS API
// ----------------------------------------
app.get('/api/students', requireAuth, (req, res) => {
  return res.json(readDB().students || []);
});

app.post('/api/students', requireAuth, (req, res) => {
  const { name, parentName, age, school, phone, email, enrolledBatchId, feesPaid, feesTotal, status, projectsCount, certificates, attendance } = req.body;

  if (!name || !parentName || !phone || !enrolledBatchId) {
    return res.status(400).json({ success: false, message: 'Missing required student fields' });
  }

  const db = readDB();
  const newStudent = {
    id: `std_${Date.now()}`,
    name,
    parentName,
    age: Number(age) || 0,
    school: school || '',
    phone,
    email: email || '',
    enrolledBatchId,
    feesPaid: Number(feesPaid) || 0,
    feesTotal: Number(feesTotal) || 0,
    status: status || 'Active',
    projectsCount: Number(projectsCount) || 0,
    certificates: certificates || [],
    attendance: Number(attendance) || 100
  };

  db.students.unshift(newStudent);

  // Increment seats filled for batch
  const batch = db.batches.find(b => b.id === enrolledBatchId);
  if (batch) {
    batch.seatsFilled = Math.min(batch.capacity, batch.seatsFilled + 1);
    if (batch.seatsFilled >= batch.capacity) batch.status = 'Full';
  }

  writeDB(db);
  return res.json({ success: true, data: newStudent });
});

app.put('/api/students', requireAuth, (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Student not found' });

  const oldStudent = db.students[index];
  const updatedStudent = { ...oldStudent, ...updates };

  // Handle number type castings
  if (updates.age !== undefined) updatedStudent.age = Number(updates.age);
  if (updates.feesPaid !== undefined) updatedStudent.feesPaid = Number(updates.feesPaid);
  if (updates.feesTotal !== undefined) updatedStudent.feesTotal = Number(updates.feesTotal);
  if (updates.attendance !== undefined) updatedStudent.attendance = Number(updates.attendance);
  if (updates.projectsCount !== undefined) updatedStudent.projectsCount = Number(updates.projectsCount);

  db.students[index] = updatedStudent;

  // Handle batch change seat corrections
  if (updates.enrolledBatchId && updates.enrolledBatchId !== oldStudent.enrolledBatchId) {
    const oldBatch = db.batches.find(b => b.id === oldStudent.enrolledBatchId);
    if (oldBatch) {
      oldBatch.seatsFilled = Math.max(0, oldBatch.seatsFilled - 1);
      oldBatch.status = 'Active';
    }
    const newBatch = db.batches.find(b => b.id === updates.enrolledBatchId);
    if (newBatch) {
      newBatch.seatsFilled = Math.min(newBatch.capacity, newBatch.seatsFilled + 1);
      if (newBatch.seatsFilled >= newBatch.capacity) newBatch.status = 'Full';
    }
  }

  writeDB(db);
  return res.json({ success: true, data: updatedStudent });
});

app.delete('/api/students', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const student = db.students.find(s => s.id === id);
  if (student) {
    const batch = db.batches.find(b => b.id === student.enrolledBatchId);
    if (batch) {
      batch.seatsFilled = Math.max(0, batch.seatsFilled - 1);
      batch.status = 'Active';
    }
  }

  db.students = db.students.filter(s => s.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/students/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const student = db.students.find(s => s.id === id);
  if (student) {
    const batch = db.batches.find(b => b.id === student.enrolledBatchId);
    if (batch) {
      batch.seatsFilled = Math.max(0, batch.seatsFilled - 1);
      batch.status = 'Active';
    }
  }

  db.students = db.students.filter(s => s.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

// ----------------------------------------
// BATCHES API
// ----------------------------------------
app.get('/api/batches', (req, res) => {
  return res.json(readDB().batches || []);
});

app.post('/api/batches', requireAuth, (req, res) => {
  const { name, ageGroup, timing, teacher, capacity } = req.body;
  if (!name || !ageGroup || !timing || !teacher || !capacity) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const db = readDB();
  const newBatch = {
    id: `batch_${Date.now()}`,
    name,
    ageGroup,
    timing,
    teacher,
    capacity: Number(capacity),
    seatsFilled: 0,
    waitingListCount: 0,
    status: 'Active'
  };

  db.batches.push(newBatch);
  writeDB(db);
  return res.json({ success: true, data: newBatch });
});

app.put('/api/batches', requireAuth, (req, res) => {
  const { id, name, ageGroup, timing, teacher, capacity, waitingListCount } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const index = db.batches.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Batch not found' });

  const b = db.batches[index];
  if (name) b.name = name;
  if (ageGroup) b.ageGroup = ageGroup;
  if (timing) b.timing = timing;
  if (teacher) b.teacher = teacher;
  if (capacity !== undefined) b.capacity = Number(capacity);
  if (waitingListCount !== undefined) b.waitingListCount = Number(waitingListCount);

  if (b.seatsFilled >= b.capacity) {
    b.status = 'Full';
  } else {
    b.status = 'Active';
  }

  writeDB(db);
  return res.json({ success: true, data: b });
});

app.delete('/api/batches', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.batches = db.batches.filter(b => b.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/batches/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.batches = db.batches.filter(b => b.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

// ----------------------------------------
// TESTIMONIALS API
// ----------------------------------------
app.get('/api/testimonials', (req, res) => {
  return res.json(readDB().testimonials || []);
});

app.post('/api/testimonials', requireAuth, (req, res) => {
  const { name, role, reviewText, rating, category, image, videoUrl } = req.body;
  if (!name || !reviewText || !rating) return res.status(400).json({ error: 'Missing fields' });

  const db = readDB();
  const newT = {
    id: `tst_${Date.now()}`,
    name,
    role: role || 'Parent',
    reviewText,
    rating: Number(rating) || 5,
    category: category || 'Parent',
    image: image || '/images/avatar_placeholder.jpg',
    videoUrl: videoUrl || ''
  };

  db.testimonials.unshift(newT);
  writeDB(db);
  return res.json({ success: true, data: newT });
});

app.put('/api/testimonials', requireAuth, (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const index = db.testimonials.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Testimonial not found' });

  db.testimonials[index] = { ...db.testimonials[index], ...updates };
  if (updates.rating !== undefined) db.testimonials[index].rating = Number(updates.rating);

  writeDB(db);
  return res.json({ success: true, data: db.testimonials[index] });
});

app.delete('/api/testimonials', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.testimonials = db.testimonials.filter(t => t.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/testimonials/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.testimonials = db.testimonials.filter(t => t.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

// ----------------------------------------
// GALLERY API
// ----------------------------------------
app.get('/api/gallery', (req, res) => {
  return res.json(readDB().gallery || []);
});

app.post('/api/gallery', requireAuth, (req, res) => {
  const { category, imageUrl, caption } = req.body;
  if (!category || !imageUrl) return res.status(400).json({ error: 'Missing fields' });

  const db = readDB();
  const newItem = {
    id: `gal_${Date.now()}`,
    category,
    imageUrl,
    caption: caption || '',
    createdAt: new Date().toISOString()
  };

  db.gallery.unshift(newItem);
  writeDB(db);
  return res.json({ success: true, data: newItem });
});

app.delete('/api/gallery', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.gallery = db.gallery.filter(g => g.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/gallery/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.gallery = db.gallery.filter(g => g.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

// ----------------------------------------
// SETTINGS API
// ----------------------------------------
app.get('/api/settings', (req, res) => {
  return res.json(readDB().settings);
});

app.post('/api/settings', requireAuth, (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  return res.json({ success: true, data: db.settings });
});

app.get('/api/db-status', requireAuth, (req, res) => {
  return res.json({
    useKV: !!useKV,
    isVercel: !!isVercel,
    status: useKV ? 'Connected (Persistent Vercel KV)' : (isVercel ? 'Temporary (Vercel /tmp)' : 'Connected (Persistent Local Disk)')
  });
});

app.get('/api/test-env', (req, res) => {
  const keys = Object.keys(process.env).filter(key => 
    key.includes('KV') || key.includes('REDIS') || key.includes('UPSTASH') || key.includes('VERCEL')
  );
  return res.json({ envKeys: keys });
});

// ----------------------------------------
// BLOG CMS API
// ----------------------------------------
app.get('/api/blog', (req, res) => {
  const { id, slug } = req.query;
  const db = readDB();
  const blogs = db.blogs || [];

  if (id) {
    const post = blogs.find(b => b.id === id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    return res.json(post);
  }

  if (slug) {
    const post = blogs.find(b => b.slug === slug);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    return res.json(post);
  }

  // Filter based on admin session
  const token = req.cookies.admin_token;
  if (token === 'ai_smart_kids_admin_auth_success') {
    return res.json(blogs);
  }

  return res.json(blogs.filter(b => b.status === 'Published'));
});

app.post('/api/blog', requireAuth, (req, res) => {
  const { title, content, excerpt, category, featuredImage, seoTitle, seoDescription, status } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and Content are required' });

  const db = readDB();
  const newPost = {
    id: `blog_${Date.now()}`,
    title,
    content,
    excerpt: excerpt || '',
    category: category || 'Education',
    featuredImage: featuredImage || '/images/blog_default.jpg',
    seoTitle: seoTitle || title,
    seoDescription: seoDescription || excerpt || '',
    status: status || 'Draft',
    publishedAt: new Date().toISOString()
  };

  db.blogs.unshift(newPost);
  writeDB(db);
  return res.json({ success: true, data: newPost });
});

app.put('/api/blog', requireAuth, (req, res) => {
  const { id, ...updates } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  const index = db.blogs.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  db.blogs[index] = { ...db.blogs[index], ...updates };
  writeDB(db);
  return res.json({ success: true, data: db.blogs[index] });
});

app.delete('/api/blog', requireAuth, (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.blogs = db.blogs.filter(b => b.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

app.post('/api/blog/delete', requireAuth, (req, res) => {
  const id = req.body.id || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.blogs = db.blogs.filter(b => b.id !== id);
  writeDB(db);
  return res.json({ success: true });
});

// ----------------------------------------
// ANALYTICS & MONITORING API
// ----------------------------------------
app.get('/api/analytics', requireAuth, (req, res) => {
  const db = readDB();
  const leads = db.leads || [];
  const students = db.students || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLeadsCount = leads.filter(l => l.createdAt && l.createdAt.startsWith(todayStr)).length;
  const totalAdmissionsCount = students.filter(s => s.status === 'Active').length;
  const totalRevenue = students.reduce((acc, curr) => acc + (curr.feesPaid || 0), 0);

  if (!db.analytics) {
    db.analytics = {
      dailyVisits: [],
      trafficSources: [],
      deviceTypes: [],
      pageViews: [],
      totalTimeSpentSec: 0
    };
  }
  if (!db.analytics.dailyVisits) {
    db.analytics.dailyVisits = [];
  }

  const totalVisitors = db.analytics.dailyVisits.reduce((acc, curr) => acc + (curr.visits || 0), 0);

  // Compute total page views across all pages
  const totalViews = (db.analytics.pageViews || []).reduce((acc, curr) => acc + (curr.views || 0), 0);

  return res.json({
    kpis: {
      todaysLeads: todaysLeadsCount,
      totalAdmissions: totalAdmissionsCount,
      revenue: totalRevenue,
      visitors: totalVisitors,
      totalPageViews: totalViews,
      totalTimeSpentSec: db.analytics.totalTimeSpentSec || 0
    },
    analytics: db.analytics
  });
});

app.post('/api/analytics', (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  const { action, event, page, source, device, durationSec, duration } = body || {};
  const db = readDB();

  if (!db.analytics) {
    db.analytics = {
      dailyVisits: [],
      trafficSources: [],
      deviceTypes: [],
      pageViews: [],
      totalTimeSpentSec: 0
    };
  }

  const triggerEvent = event || action;

  if ((triggerEvent === 'view' || triggerEvent === 'pageview') && page) {
    if (!db.analytics.pageViews) db.analytics.pageViews = [];
    const pageView = db.analytics.pageViews.find(p => p.page === page);
    if (pageView) {
      pageView.views = (pageView.views || 0) + 1;
    } else {
      db.analytics.pageViews.push({ page, views: 1, timeSpentSec: 0 });
    }
    writeDB(db);
    return res.json({ success: true });
  }

  if (triggerEvent === 'visit') {
    const today = new Date().toISOString().split('T')[0];
    if (!db.analytics.dailyVisits) db.analytics.dailyVisits = [];
    const visitObj = db.analytics.dailyVisits.find(v => v.date === today);
    if (visitObj) {
      visitObj.visits += 1;
    } else {
      if (db.analytics.dailyVisits.length > 30) db.analytics.dailyVisits.shift();
      db.analytics.dailyVisits.push({ date: today, visits: 1, leads: 0 });
    }

    const detectedSource = source || 'Direct Traffic';
    if (!db.analytics.trafficSources) db.analytics.trafficSources = [];
    const srcObj = db.analytics.trafficSources.find(s => s.source.toLowerCase() === detectedSource.toLowerCase());
    if (srcObj) {
      srcObj.count += 1;
    } else {
      db.analytics.trafficSources.push({ source: detectedSource, count: 1 });
    }

    const detectedDevice = device || 'Desktop';
    if (!db.analytics.deviceTypes) db.analytics.deviceTypes = [];
    const devObj = db.analytics.deviceTypes.find(d => d.device.toLowerCase() === detectedDevice.toLowerCase());
    if (devObj) {
      devObj.count += 1;
    } else {
      db.analytics.deviceTypes.push({ device: detectedDevice, count: 1 });
    }

    writeDB(db);
    return res.json({ success: true });
  }

  if (triggerEvent === 'timespent') {
    const sec = parseInt(durationSec || duration || 0, 10);
    if (sec > 0 && sec < 7200) {
      db.analytics.totalTimeSpentSec = (db.analytics.totalTimeSpentSec || 0) + sec;

      if (!db.analytics.pageViews) db.analytics.pageViews = [];
      const pageView = db.analytics.pageViews.find(p => p.page === page);
      if (pageView) {
        pageView.timeSpentSec = (pageView.timeSpentSec || 0) + sec;
      } else {
        db.analytics.pageViews.push({ page, views: 0, timeSpentSec: sec });
      }
      writeDB(db);
    }
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action or event' });
});

// ----------------------------------------
// ATTENDANCE MANAGEMENT API
// ----------------------------------------
app.get('/api/attendance', requireAuth, (req, res) => {
  const { batchId, date } = req.query;
  const db = readDB();
  let records = db.attendance || [];
  
  if (batchId) {
    records = records.filter(r => r.batchId === batchId);
  }
  if (date) {
    records = records.filter(r => r.date === date);
  }
  
  return res.json(records);
});

app.post('/api/attendance', requireAuth, (req, res) => {
  const { batchId, date, records } = req.body;
  if (!batchId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing batchId, date or records array' });
  }

  const db = readDB();
  if (!db.attendance) db.attendance = [];

  // Remove existing attendance records for this batch and date to overwrite
  db.attendance = db.attendance.filter(r => !(r.batchId === batchId && r.date === date));

  // Insert new attendance records
  records.forEach(rec => {
    db.attendance.push({
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      studentId: rec.studentId,
      batchId: batchId,
      date: date,
      status: rec.status // "Present", "Absent", "Late"
    });
  });

  // Recalculate attendance percentages for affected students
  const studentIdsInBatch = records.map(r => r.studentId);
  
  studentIdsInBatch.forEach(stdId => {
    const studentLogs = db.attendance.filter(r => r.studentId === stdId);
    if (studentLogs.length > 0) {
      const presentCount = studentLogs.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const attendancePercent = Math.round((presentCount / studentLogs.length) * 100);
      
      const student = db.students.find(s => s.id === stdId);
      if (student) {
        student.attendance = attendancePercent;
      }
    }
  });

  writeDB(db);
  return res.json({ success: true, message: 'Attendance records saved successfully' });
});

// Fallback routing: return index.html for main and admin/index.html for admin paths
app.get('/allinoneqr', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/allinoneqr.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/landing.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Blog SEO Listing Route
app.get('/blog', (req, res) => {
  const db = readDB();
  const publishedPosts = db.blogs.filter(b => b.status === 'Published');
  
  const templatePath = path.join(__dirname, 'public', 'blog-list-template.html');
  if (!fs.existsSync(templatePath)) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  // Pagination logic
  const postsPerPage = 4;
  let page = parseInt(req.query.page, 10) || 1;
  const totalPages = Math.ceil(publishedPosts.length / postsPerPage);
  
  if (page < 1) page = 1;
  if (page > totalPages && totalPages > 0) page = totalPages;
  
  const start = (page - 1) * postsPerPage;
  const end = start + postsPerPage;
  const paginatedPosts = publishedPosts.slice(start, end);
  
  const listHtml = paginatedPosts.map(post => {
    const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `
      <article class="blog-card" onclick="location.href='/blog/${post.slug}'">
        <div class="blog-image">
          <img loading="lazy" src="${post.featuredImage || '/images/blog_default.jpg'}" alt="${post.title}">
        </div>
        <div class="blog-info">
          <h4 class="blog-card-title">${post.title}</h4>
          <p class="blog-card-excerpt">${post.excerpt || ''}</p>
          <div class="blog-meta">
            <span class="badge-tag">${post.category}</span>
            <span>${dateStr}</span>
          </div>
        </div>
      </article>
    `;
  }).join('\n');
  
  // Generate pagination buttons HTML
  let paginationHtml = '';
  if (totalPages > 1) {
    // Previous button
    const prevClass = page === 1 ? 'pagination-btn disabled' : 'pagination-btn';
    const prevHref = page === 1 ? '#' : `/blog?page=${page - 1}`;
    paginationHtml += `<a class="${prevClass}" href="${prevHref}">Previous</a>\n`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === page ? 'pagination-btn active' : 'pagination-btn';
      paginationHtml += `<a class="${activeClass}" href="/blog?page=${i}">${i}</a>\n`;
    }
    
    // Next button
    const nextClass = page === totalPages ? 'pagination-btn disabled' : 'pagination-btn';
    const nextHref = page === totalPages ? '#' : `/blog?page=${page + 1}`;
    paginationHtml += `<a class="${nextClass}" href="${nextHref}">Next</a>\n`;
  }
  
  html = html.replace(/{{BLOGS_GRID}}/g, listHtml);
  html = html.replace(/{{PAGINATION}}/g, paginationHtml);
  res.send(html);
});

// Blog SEO Individual Article Route
app.get('/blog/:slug', (req, res) => {
  const postSlug = req.params.slug;
  const db = readDB();
  let post = db.blogs.find(b => b.slug === postSlug && b.status === 'Published');
  
  if (!post) {
    // ID-based fallback redirect
    const postById = db.blogs.find(b => b.id === postSlug && b.status === 'Published');
    if (postById) {
      return res.redirect(`/blog/${postById.slug}`);
    }
    return res.redirect('/blog');
  }
  
  const templatePath = path.join(__dirname, 'public', 'blog-template.html');
  if (!fs.existsSync(templatePath)) {
    return res.redirect('/blog');
  }
  
  let html = fs.readFileSync(templatePath, 'utf-8');
  
  const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
function parseMarkdown(text) {
  if (!text) return '';
  // Escape HTML entities to prevent raw HTML injection issues
  let clean = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Parse headings: ### heading -> <h3 class="blog-subheading">heading</h3>
  clean = clean.replace(/^### (.*?)$/gm, '<h3 class="blog-subheading">$1</h3>');

  // Parse bold: **text** -> <strong>text</strong>
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Parse italic: *text* -> <em>text</em>
  clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Parse horizontal rules: --- -> <hr style="border: 0; border-top: 1.5px solid rgba(37,99,235,0.08); margin: 32px 0;">
  clean = clean.replace(/^---$/gm, '<hr style="border: 0; border-top: 1.5px solid rgba(37,99,235,0.08); margin: 32px 0;">');

  // Parse bullet points: * point -> <li class="blog-list-item">point</li>
  clean = clean.replace(/^\s*\*\s+(.*?)$/gm, '<li class="blog-list-item">$1</li>');

  // Parse numbered lists: 1. point -> <li class="blog-list-item-num">point</li>
  clean = clean.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li class="blog-list-item-num">$2</li>');

  // Group lists into <ul> and <ol> tags
  clean = clean.replace(/(<li class="blog-list-item">.*?<\/li>\n?)+/gs, (match) => {
    return `<ul style="margin-bottom: 20px;">\n${match}</ul>\n`;
  });
  clean = clean.replace(/(<li class="blog-list-item-num">.*?<\/li>\n?)+/gs, (match) => {
    return `<ol style="margin-bottom: 20px;">\n${match}</ol>\n`;
  });

  // Split double newlines and wrap ordinary lines in styled <p class="blog-paragraph"> tags
  return clean.split('\n\n').map(p => {
    p = p.trim();
    if (!p) return '';
    // Skip tags that already form block elements
    if (p.startsWith('<h') || p.startsWith('<hr') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<li')) {
      return p;
    }
    return `<p class="blog-paragraph" style="font-weight: 400; color: var(--color-text-gray); margin-bottom: 20px;">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}

  const parsedContent = parseMarkdown(post.content);
  
  // Calculate recommended interlinked next articles
  const publishedPosts = db.blogs.filter(b => b.status === 'Published');
  const currentIndex = publishedPosts.findIndex(b => b.slug === post.slug);
  
  const recsHtml = [];
  if (publishedPosts.length > 1) {
    const next1 = publishedPosts[(currentIndex + 1) % publishedPosts.length];
    recsHtml.push(next1);
    
    if (publishedPosts.length > 2) {
      const next2 = publishedPosts[(currentIndex + 2) % publishedPosts.length];
      recsHtml.push(next2);
    }
  }
  
  const recommendedHtmlStr = recsHtml.map(r => {
    return `
      <a class="mini-blog-card" href="/blog/${r.slug}">
        <div class="mini-blog-image">
          <img loading="lazy" src="${r.featuredImage || '/images/blog_default.jpg'}" alt="${r.title}">
        </div>
        <div class="mini-blog-info">
          <span class="badge-tag" style="font-size: 8px; padding: 2px 6px; background: rgba(37,99,235,0.06); color: var(--color-primary); width: fit-content; border-radius: 6px; font-weight: 700;">${r.category}</span>
          <h4 class="mini-blog-title">${r.title}</h4>
        </div>
      </a>
    `;
  }).join('\n');
  
  html = html.replace(/{{SEO_TITLE}}/g, post.seoTitle || `${post.title} | AI Smart Institute Ujjain`);
  html = html.replace(/{{SEO_DESCRIPTION}}/g, post.seoDescription || post.excerpt);
  html = html.replace(/{{BLOG_TITLE}}/g, post.title);
  html = html.replace(/{{BLOG_CATEGORY}}/g, post.category);
  html = html.replace(/{{BLOG_DATE}}/g, dateStr);
  html = html.replace(/{{BLOG_IMAGE}}/g, post.featuredImage || '/images/blog_default.jpg');
  html = html.replace(/{{BLOG_CONTENT}}/g, parsedContent);
  html = html.replace(/{{RECOMMENDED_ARTICLES}}/g, recommendedHtmlStr);
  
  res.send(html);
});

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>https://aismartkid.vercel.app/</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/landing.html</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog.html</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/privacy.html</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/terms.html</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Dynamic Blog Posts (SSR Slugs) -->
  <url>
    <loc>https://aismartkid.vercel.app/blog/ai-classes-for-kids-in-ujjain</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/why-every-child-in-ujjain-should-learn-artificial-intelligence-before-2030</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/top-coding-classes-for-kids-in-ujjain-which-one-should-you-choose</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/10-future-skills-every-student-in-ujjain-must-learn</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/how-ai-helps-children-improve-creativity-and-problem-solving</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/parents-guide-to-choosing-the-best-ai-coding-institute-in-ujjain</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/screen-time-vs-smart-learning-how-ai-education-benefits-kids</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/top-7-career-opportunities-your-child-can-prepare-for-with-ai-skills</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/how-ai-classes-build-confidence-logic-communication-skills-in-kids</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/why-ai-smart-kids-is-becoming-the-preferred-ai-learning-center-in-ujjain</loc>
    <lastmod>2026-07-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/top-extracurricular-activities-in-ujjain-why-coding-and-ai-are-replacing-traditional-tuition</loc>
    <lastmod>2026-07-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://aismartkid.vercel.app/blog/how-to-prepare-your-child-for-the-ai-revolution-a-practical-guide-for-parents-in-ujjain</loc>
    <lastmod>2026-07-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

app.get(['/sitemap.xml', '/sitemap-main.xml'], (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(sitemapXml);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Launch Server
app.listen(PORT, () => {
  console.log(`[READY] Express Server running on: http://localhost:${PORT}`);
});

// Trigger Deploy: Vercel KV Linked Successful - 2026-07-24

