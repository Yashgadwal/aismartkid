const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve Static Frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Database helper functions
const defaultSchema = {
  leads: [],
  students: [],
  batches: [],
  blogs: [],
  testimonials: [],
  gallery: [],
  attendance: [],
  settings: {
    instituteName: "AI Smart Kids",
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
    cohortDateSenior: "2026-08-01T18:00"
  },
  analytics: {
    dailyVisits: [],
    trafficSources: [],
    deviceTypes: [],
    pageViews: []
  }
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultSchema, null, 2), 'utf-8');
      return defaultSchema;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("DB Read Error:", error);
    return defaultSchema;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("DB Write Error:", error);
  }
}

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
  const { parentName, childName, age, school, class: childClass, phone, email, preferredBatch, message } = req.body;

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
    status: 'New',
    notes: message ? `Initial enquiry: ${message}` : '',
    followUpDate: '',
    createdAt: new Date().toISOString()
  };

  db.leads.unshift(newLead);

  // Increment Lead Analytics count
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
  const { id, status, notes, followUpDate } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing lead ID' });

  const db = readDB();
  const index = db.leads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found' });

  if (status) db.leads[index].status = status;
  if (notes !== undefined) db.leads[index].notes = notes;
  if (followUpDate !== undefined) db.leads[index].followUpDate = followUpDate;

  writeDB(db);
  return res.json({ success: true, data: db.leads[index] });
});

app.delete('/api/leads', requireAuth, (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing ID' });

  const db = readDB();
  db.leads = db.leads.filter(l => l.id !== id);
  writeDB(db);
  return res.json({ success: true });
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
  const id = req.query.id;
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
  const id = req.query.id;
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
  const id = req.query.id;
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
  const id = req.query.id;
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
  const id = req.query.id;
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
  const totalVisitors = db.analytics.dailyVisits.reduce((acc, curr) => acc + (curr.visits || 0), 0);

  return res.json({
    kpis: {
      todaysLeads: todaysLeadsCount,
      totalAdmissions: totalAdmissionsCount,
      revenue: totalRevenue,
      visitors: totalVisitors
    },
    analytics: db.analytics
  });
});

app.post('/api/analytics', (req, res) => {
  const { action, page, source, device } = req.body;
  const db = readDB();

  if (action === 'view' && page) {
    const pageView = db.analytics.pageViews.find(p => p.page === page);
    if (pageView) {
      pageView.views += 1;
    } else {
      db.analytics.pageViews.push({ page, views: 1 });
    }
    writeDB(db);
    return res.json({ success: true });
  }

  if (action === 'visit') {
    const today = new Date().toISOString().split('T')[0];
    const visitObj = db.analytics.dailyVisits.find(v => v.date === today);
    if (visitObj) {
      visitObj.visits += 1;
    } else {
      if (db.analytics.dailyVisits.length > 30) db.analytics.dailyVisits.shift();
      db.analytics.dailyVisits.push({ date: today, visits: 1, leads: 0 });
    }

    const detectedSource = source || 'Direct Traffic';
    const srcObj = db.analytics.trafficSources.find(s => s.source.toLowerCase() === detectedSource.toLowerCase());
    if (srcObj) {
      srcObj.count += 1;
    } else {
      db.analytics.trafficSources.push({ source: detectedSource, count: 1 });
    }

    const detectedDevice = device || 'Desktop';
    const devObj = db.analytics.deviceTypes.find(d => d.device.toLowerCase() === detectedDevice.toLowerCase());
    if (devObj) {
      devObj.count += 1;
    } else {
      db.analytics.deviceTypes.push({ device: detectedDevice, count: 1 });
    }

    writeDB(db);
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
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
  
  const listHtml = publishedPosts.map(post => {
    const dateStr = new Date(post.publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `
      <article class="blog-card" onclick="location.href='/blog/${post.id}'">
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
  
  html = html.replace(/{{BLOGS_GRID}}/g, listHtml);
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
  
  html = html.replace(/{{SEO_TITLE}}/g, post.seoTitle || `${post.title} | AI Smart Kids Ujjain`);
  html = html.replace(/{{SEO_DESCRIPTION}}/g, post.seoDescription || post.excerpt);
  html = html.replace(/{{BLOG_TITLE}}/g, post.title);
  html = html.replace(/{{BLOG_CATEGORY}}/g, post.category);
  html = html.replace(/{{BLOG_DATE}}/g, dateStr);
  html = html.replace(/{{BLOG_IMAGE}}/g, post.featuredImage || '/images/blog_default.jpg');
  html = html.replace(/{{BLOG_CONTENT}}/g, parsedContent);
  
  res.send(html);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Launch Server
app.listen(PORT, () => {
  console.log(`[READY] Express Server running on: http://localhost:${PORT}`);
});
