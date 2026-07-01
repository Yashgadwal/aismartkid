// AI Smart Kids - Admin Dashboard JS Logic

let activeTab = 'dashboard';
let charts = {}; // Keeps references to Chart.js instances to avoid canvas recycle errors
let allLeads = [];
let allBatches = [];
let allStudents = [];
let allBlogs = [];
let editingStudentId = null;
let editingBatchId = null;
let editingBlogId = null;

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
  if (overlay) {
    overlay.classList.toggle('active');
  }
}

// On Load Authentication check
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
});

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth');
    const data = await res.json();
    if (data.authenticated) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('admin-workspace').style.display = 'flex';
      lucide.createIcons();
      // Initialize active dashboard panel
      loadPanelData('dashboard');
    } else {
      document.getElementById('login-screen').style.display = 'flex';
      document.getElementById('admin-workspace').style.display = 'none';
      lucide.createIcons();
    }
  } catch (err) {
    console.error("Auth status query failed:", err);
  }
}

// ----------------------------------------
// AUTHENTICATION LOGIC
// ----------------------------------------
async function handleAdminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('login-error-msg');
  const btn = document.getElementById('login-submit-btn');

  btn.innerText = 'Verifying...';
  errorMsg.style.display = 'none';

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username, password })
    });

    if (res.ok) {
      checkAuthStatus();
    } else {
      errorMsg.style.display = 'block';
    }
  } catch (err) {
    console.error("Login request error:", err);
    errorMsg.style.display = 'block';
  } finally {
    btn.innerText = 'Log In to Workspace';
  }
}

async function handleAdminLogout() {
  if (!confirm("Are you sure you want to log out of the admin panel?")) return;
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
    window.location.reload();
  } catch (err) {
    console.error("Logout request error:", err);
  }
}

// ----------------------------------------
// PANEL TABS ROUTING
// ----------------------------------------
function switchTab(tabName, buttonEl) {
  activeTab = tabName;
  
  // Toggle Navigation active classes
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
  buttonEl.classList.add('active');

  // Toggle visible panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`panel-${tabName}`).classList.add('active');

  // Close sidebar on mobile
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && sidebar.classList.contains('active')) {
    sidebar.classList.remove('active');
  }
  if (overlay && overlay.classList.contains('active')) {
    overlay.classList.remove('active');
  }

  // Set default date for attendance tab if empty
  if (tabName === 'attendance') {
    const dateInput = document.getElementById('att-select-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  loadPanelData(tabName);
}

function loadPanelData(tabName) {
  switch (tabName) {
    case 'dashboard':
      loadDashboardKPIs();
      break;
    case 'leads':
      loadLeadsPipeline();
      break;
    case 'students':
      loadStudentsRoster();
      break;
    case 'batches':
      loadBatchesPlanner();
      break;
    case 'attendance':
      loadAttendanceDropdowns();
      break;
    case 'gallery':
      loadGalleryVault();
      break;
    case 'blog':
      loadBlogArticles();
      break;
    case 'settings':
      loadGlobalSettings();
      break;
  }
}

// ----------------------------------------
// TAB 1: DASHBOARD ANALYTICS & CHARTS
// ----------------------------------------
async function loadDashboardKPIs() {
  try {
    const res = await fetch('/api/analytics');
    if (!res.ok) return;
    const data = await res.json();

    // Populate KPIs
    document.getElementById('kpi-leads').innerText = data.kpis.todaysLeads || 0;
    document.getElementById('kpi-admissions').innerText = data.kpis.totalAdmissions || 0;
    document.getElementById('kpi-revenue').innerText = `₹${data.kpis.revenue.toLocaleString('en-IN')}`;
    document.getElementById('kpi-visitors').innerText = data.kpis.visitors || 0;

    // Render Chart.js analytics graphs
    renderVisitsChart(data.analytics.dailyVisits || []);
    renderDevicesChart(data.analytics.deviceTypes || []);
    renderSourcesChart(data.analytics.trafficSources || []);

    // Load recent inquiries logs
    loadRecentInquiriesTable();
  } catch (err) {
    console.error("Dashboard KPI fetch failed:", err);
  }
}

function destroyChart(name) {
  if (charts[name]) {
    charts[name].destroy();
    delete charts[name];
  }
}

function renderVisitsChart(visitsData) {
  destroyChart('visits');
  const ctx = document.getElementById('chart-visits').getContext('2d');
  
  const labels = visitsData.map(v => v.date);
  const visits = visitsData.map(v => v.visits);
  const leads = visitsData.map(v => v.leads);

  charts.visits = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Unique Visits',
          data: visits,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          fill: true,
          tension: 0.35,
          borderWidth: 2
        },
        {
          label: 'Admissions Leads',
          data: leads,
          borderColor: '#7C3AED',
          backgroundColor: 'transparent',
          tension: 0.35,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: 'Inter', size: 10 } } }
      },
      scales: {
        y: { grid: { color: 'rgba(0, 0, 0, 0.03)' }, ticks: { font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { font: { size: 9 } } }
      }
    }
  });
}

function renderDevicesChart(deviceData) {
  destroyChart('devices');
  const ctx = document.getElementById('chart-devices').getContext('2d');

  const labels = deviceData.map(d => d.device);
  const counts = deviceData.map(d => d.count);

  charts.devices = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#2563EB', '#7C3AED', '#FF8A00'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 9 } } }
      }
    }
  });
}

function renderSourcesChart(sourcesData) {
  destroyChart('sources');
  const ctx = document.getElementById('chart-sources').getContext('2d');

  const labels = sourcesData.map(s => s.source);
  const counts = sourcesData.map(s => s.count);

  charts.sources = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Clicks Count',
        data: counts,
        backgroundColor: '#7C3AED',
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { color: 'rgba(0, 0, 0, 0.03)' }, ticks: { font: { size: 9 } } },
        y: { grid: { display: false }, ticks: { font: { size: 9 } } }
      }
    }
  });
}

async function loadRecentInquiriesTable() {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return;
    const leads = await res.json();
    const tbody = document.getElementById('recent-leads-tbody');
    tbody.innerHTML = '';

    leads.slice(0, 5).forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-bold-dark">${l.childName || ''}</td>
        <td>${l.phone || ''}</td>
        <td>${(l.preferredBatch || '').split(' ')[0]}</td>
        <td><span class="badge-status status-${(l.status || 'New').split(' ')[0].toLowerCase()}">${l.status || 'New'}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Recent inquiries table load failed:", err);
  }
}

// ----------------------------------------
// TAB 2: INQUIRIES & LEADS PIPELINE
// ----------------------------------------
async function loadLeadsPipeline() {
  try {
    const res = await fetch('/api/leads');
    if (res.ok) {
      allLeads = await res.json();
      filterLeads();
    }
  } catch (err) {
    console.error("Failed to load leads:", err);
  }
}

function filterLeads() {
  const query = document.getElementById('leads-search').value.toLowerCase();
  const statusFilter = document.getElementById('leads-filter-status').value;
  const tbody = document.getElementById('leads-tbody');
  tbody.innerHTML = '';

  const filtered = allLeads.filter(l => {
    const matchesSearch = (l.parentName || '').toLowerCase().includes(query) ||
                          (l.childName || '').toLowerCase().includes(query) ||
                          (l.phone || '').includes(query);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filtered.forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span class="text-bold-dark">${l.childName || ''}</span>
        <span class="sub-label">Parent: ${l.parentName || ''}</span>
      </td>
      <td>Age ${l.age || ''} (${l.class || ''})</td>
      <td>
        <span>${l.phone || ''}</span>
        <span class="sub-label">${l.email || ''}</span>
      </td>
      <td>${l.preferredBatch || ''}</td>
      <td>
        <input type="date" value="${l.followUpDate || ''}" onchange="updateLeadField('${l.id}', 'followUpDate', this.value)" style="padding:4px; font-size:10px; border-radius:4px; border:1px solid rgba(0,0,0,0.1);">
      </td>
      <td class="leads-table-note">
        <textarea rows="1" onblur="updateLeadField('${l.id}', 'notes', this.value)" placeholder="Enter advice logs...">${l.notes || ''}</textarea>
      </td>
      <td>
        <select onchange="updateLeadField('${l.id}', 'status', this.value)" class="badge-status status-${(l.status || 'New').split(' ')[0].toLowerCase()}" style="border:none; cursor:pointer;">
          <option value="New" ${l.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Interested" ${l.status === 'Interested' ? 'selected' : ''}>Interested</option>
          <option value="Demo Scheduled" ${l.status === 'Demo Scheduled' ? 'selected' : ''}>Demo Scheduled</option>
          <option value="Joined" ${l.status === 'Joined' ? 'selected' : ''}>Joined</option>
          <option value="Rejected" ${l.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>
        <button class="action-btn delete-btn" onclick="deleteLead('${l.id}')" title="Delete Inquiry">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

async function updateLeadField(id, field, value) {
  try {
    const res = await fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value })
    });
    if (res.ok) {
      // Quietly update local pipeline array item
      const lead = allLeads.find(l => l.id === id);
      if (lead) lead[field] = value;
      // If status changed, refresh styling
      if (field === 'status') filterLeads();
    }
  } catch (err) {
    console.error("Lead updates save error:", err);
  }
}

async function deleteLead(id) {
  if (!confirm("Are you sure you want to delete this lead?")) return;
  try {
    const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      allLeads = allLeads.filter(l => l.id !== id);
      filterLeads();
    }
  } catch (err) {
    console.error("Lead deletion error:", err);
  }
}

function exportLeadsCsv() {
  window.open('/api/leads?export=csv', '_blank');
}

// ----------------------------------------
// TAB 3: STUDENT ROSTER
// ----------------------------------------
async function loadStudentsRoster() {
  try {
    // Load batches list first for dropdown options and naming
    const batchesRes = await fetch('/api/batches');
    allBatches = await batchesRes.json();

    const res = await fetch('/api/students');
    allStudents = await res.json();

    // Map batch names
    const batchMap = {};
    allBatches.forEach(b => batchMap[b.id] = b.name);

    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = '';

    allStudents.forEach(s => {
      const initials = s.name.split(' ').map(n => n[0]).join('').toUpperCase();
      const feePercent = s.feesTotal ? Math.min(100, Math.round((s.feesPaid / s.feesTotal) * 100)) : 0;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="user-initials" style="width:30px; height:30px; font-size:10px;">${initials}</div>
            <div>
              <span class="text-bold-dark">${s.name}</span>
              <span class="sub-label">Parent: ${s.parentName || ''}</span>
            </div>
          </div>
        </td>
        <td>
          <span>${s.phone || ''}</span>
          <span class="sub-label">${s.email || ''}</span>
        </td>
        <td>${batchMap[s.enrolledBatchId] || 'Unassigned'}</td>
        <td class="fee-progress-cell">
          <span>₹${s.feesPaid.toLocaleString('en-IN')} / ₹${s.feesTotal.toLocaleString('en-IN')}</span>
          <div class="fee-bar-track">
            <div class="fee-bar-fill" style="width: ${feePercent}%;"></div>
          </div>
        </td>
        <td>
          <span class="text-bold-dark" style="color:${s.attendance >= 90 ? 'var(--color-success-green)' : 'var(--color-accent-orange)'}">${s.attendance}%</span>
        </td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${(s.certificates || []).map(c => `<span class="badge-tag" style="padding:2px 8px; font-size:8px;">${c}</span>`).join('')}
            <button class="action-btn" onclick="addCertificateBadge('${s.id}')" title="Grant Badge" style="padding:2px;"><i data-lucide="plus-circle" style="width:14px; height:14px;"></i></button>
          </div>
        </td>
        <td>
          <span class="badge-status status-${(s.status || 'Active').toLowerCase()}">${s.status || 'Active'}</span>
        </td>
        <td>
          <div class="action-row">
            <button class="action-btn edit-btn" onclick="openStudentModal('${s.id}')"><i data-lucide="edit-3"></i></button>
            <button class="action-btn delete-btn" onclick="deleteStudent('${s.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  } catch (err) {
    console.error("Failed to load student roster:", err);
  }
}

function openStudentModal(id = null) {
  editingStudentId = id;
  const modal = document.getElementById('student-modal');
  const title = document.getElementById('student-modal-title');
  const select = document.getElementById('std-input-batch');

  // Populate batch select dropdown options
  select.innerHTML = '';
  allBatches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.innerText = b.name;
    select.appendChild(opt);
  });

  if (id) {
    title.innerText = 'Edit Student Details';
    const student = allStudents.find(s => s.id === id);
    if (student) {
      document.getElementById('std-input-name').value = student.name;
      document.getElementById('std-input-parent').value = student.parentName;
      document.getElementById('std-input-age').value = student.age || '';
      document.getElementById('std-input-school').value = student.school || '';
      document.getElementById('std-input-phone').value = student.phone;
      document.getElementById('std-input-email').value = student.email || '';
      document.getElementById('std-input-batch').value = student.enrolledBatchId;
      document.getElementById('std-input-status').value = student.status || 'Active';
      document.getElementById('std-input-feesPaid').value = student.feesPaid || '';
      document.getElementById('std-input-feesTotal').value = student.feesTotal || '';
      document.getElementById('std-input-attendance').value = student.attendance || '';
    }
  } else {
    title.innerText = 'Register New Student';
    document.getElementById('student-form').reset();
  }

  modal.classList.add('active');
}

function closeStudentModal() {
  document.getElementById('student-modal').classList.remove('active');
}

async function handleSaveStudent(event) {
  event.preventDefault();
  const name = document.getElementById('std-input-name').value.trim();
  const parentName = document.getElementById('std-input-parent').value.trim();
  const age = document.getElementById('std-input-age').value.trim();
  const school = document.getElementById('std-input-school').value.trim();
  const phone = document.getElementById('std-input-phone').value.trim();
  const email = document.getElementById('std-input-email').value.trim();
  const enrolledBatchId = document.getElementById('std-input-batch').value;
  const status = document.getElementById('std-input-status').value;
  const feesPaid = document.getElementById('std-input-feesPaid').value;
  const feesTotal = document.getElementById('std-input-feesTotal').value;
  const attendance = document.getElementById('std-input-attendance').value;

  const payload = {
    name, parentName, age, school, phone, email, enrolledBatchId, status, feesPaid, feesTotal, attendance
  };

  try {
    let res;
    if (editingStudentId) {
      res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingStudentId, ...payload })
      });
    } else {
      res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeStudentModal();
      loadStudentsRoster();
    } else {
      alert("Failed to save student profile details.");
    }
  } catch (err) {
    console.error("Student save request error:", err);
  }
}

async function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student profile?")) return;
  try {
    const res = await fetch(`/api/students?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadStudentsRoster();
    }
  } catch (err) {
    console.error("Student deletion request error:", err);
  }
}

async function addCertificateBadge(id) {
  const badgeName = prompt("Enter Course Badge / Certificate Name to award:");
  if (!badgeName) return;

  const student = allStudents.find(s => s.id === id);
  if (!student) return;

  const certs = [...(student.certificates || [])];
  certs.push(badgeName);

  try {
    const res = await fetch('/api/students', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, certificates: certs })
    });
    if (res.ok) {
      loadStudentsRoster();
    }
  } catch (err) {
    console.error("Failed to add badge:", err);
  }
}

// ----------------------------------------
// TAB 4: BATCHES PLANNER
// ----------------------------------------
async function loadBatchesPlanner() {
  try {
    const res = await fetch('/api/batches');
    allBatches = await res.json();

    const container = document.getElementById('batches-grid-container');
    container.innerHTML = '';

    allBatches.forEach(b => {
      const seatsLeft = b.capacity - b.seatsFilled;
      const fillPercentage = Math.min(100, Math.round((b.seatsFilled / b.capacity) * 100));
      
      const card = document.createElement('div');
      card.className = 'batch-card-body';
      card.innerHTML = `
        <div class="batch-header-info">
          <div>
            <h4>${b.name}</h4>
            <span class="sub-label">Cohort Ages: ${b.ageGroup} Years</span>
          </div>
          <span class="badge-status ${b.seatsFilled >= b.capacity ? 'status-rejected' : 'status-active'}">${b.seatsFilled >= b.capacity ? 'Full' : b.status}</span>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar-label">
            <span>Fill capacity</span>
            <span>${b.seatsFilled} / ${b.capacity} Seats filled</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${b.seatsFilled >= b.capacity ? 'full' : ''}" style="width: ${fillPercentage}%;"></div>
          </div>
        </div>

        <div class="batch-details-stats">
          <div class="batch-detail-item">
            <i data-lucide="clock"></i>
            <div>Timing: <span>${b.timing}</span></div>
          </div>
          <div class="batch-detail-item">
            <i data-lucide="award"></i>
            <div>Mentor: <span>${b.teacher}</span></div>
          </div>
        </div>

        ${b.waitingListCount > 0 ? `<div class="alert-tag"><i data-lucide="alert-circle" style="width:12px; height:12px;"></i> ${b.waitingListCount} in Waiting list</div>` : ''}

        <div class="action-row" style="justify-content: flex-end; margin-top: 10px;">
          <button class="action-btn edit-btn" onclick="openBatchModal('${b.id}')"><i data-lucide="edit-3"></i></button>
          <button class="action-btn delete-btn" onclick="deleteBatch('${b.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      `;
      container.appendChild(card);
    });
    lucide.createIcons();
  } catch (err) {
    console.error("Batches load error:", err);
  }
}

function openBatchModal(id = null) {
  editingBatchId = id;
  const modal = document.getElementById('batch-modal');
  const title = document.getElementById('batch-modal-title');

  if (id) {
    title.innerText = 'Edit Batch Planner';
    const batch = allBatches.find(b => b.id === id);
    if (batch) {
      document.getElementById('bat-input-name').value = batch.name;
      document.getElementById('bat-input-ageGroup').value = batch.ageGroup;
      document.getElementById('bat-input-capacity').value = batch.capacity;
      document.getElementById('bat-input-timing').value = batch.timing;
      document.getElementById('bat-input-teacher').value = batch.teacher;
    }
  } else {
    title.innerText = 'Create Batch';
    document.getElementById('batch-form').reset();
  }
  modal.classList.add('active');
}

function closeBatchModal() {
  document.getElementById('batch-modal').classList.remove('active');
}

async function handleSaveBatch(event) {
  event.preventDefault();
  const name = document.getElementById('bat-input-name').value.trim();
  const ageGroup = document.getElementById('bat-input-ageGroup').value;
  const capacity = document.getElementById('bat-input-capacity').value.trim();
  const timing = document.getElementById('bat-input-timing').value.trim();
  const teacher = document.getElementById('bat-input-teacher').value.trim();

  const payload = { name, ageGroup, capacity, timing, teacher };

  try {
    let res;
    if (editingBatchId) {
      res = await fetch('/api/batches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingBatchId, ...payload })
      });
    } else {
      res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeBatchModal();
      loadBatchesPlanner();
    } else {
      alert("Failed to save cohort batch planner details.");
    }
  } catch (err) {
    console.error("Batch save request error:", err);
  }
}

async function deleteBatch(id) {
  if (!confirm("Are you sure you want to delete this cohort batch? Allocated student records will stay but unlinked.")) return;
  try {
    const res = await fetch(`/api/batches?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadBatchesPlanner();
    }
  } catch (err) {
    console.error("Batch deletion error:", err);
  }
}

// ----------------------------------------
// TAB 5: GALLERY VAULT
// ----------------------------------------
async function loadGalleryVault() {
  try {
    const res = await fetch('/api/gallery');
    if (!res.ok) return;
    const items = await res.json();
    
    const container = document.getElementById('gallery-items-list');
    container.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gal-item-card';
      card.innerHTML = `
        <div class="gal-img-wrap">
          <span class="gal-tag">${item.category}</span>
          <img src="${item.imageUrl}" alt="${item.category}">
        </div>
        <div class="gal-desc">
          <p>${item.caption || 'No caption'}</p>
          <button class="action-btn delete-btn" onclick="deleteGalleryItem('${item.id}')" title="Delete Photo">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
    lucide.createIcons();
  } catch (err) {
    console.error("Gallery vault load fail:", err);
  }
}

async function handleSaveGallery(event) {
  event.preventDefault();
  const category = document.getElementById('gal-input-category').value;
  const imageUrl = document.getElementById('gal-input-url').value.trim();
  const caption = document.getElementById('gal-input-caption').value.trim();

  try {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, imageUrl, caption })
    });
    if (res.ok) {
      document.getElementById('gallery-form').reset();
      loadGalleryVault();
    }
  } catch (err) {
    console.error("Save gallery request error:", err);
  }
}

async function deleteGalleryItem(id) {
  if (!confirm("Are you sure you want to delete this media image link?")) return;
  try {
    const res = await fetch(`/api/gallery?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadGalleryVault();
    }
  } catch (err) {
    console.error("Gallery deletion error:", err);
  }
}

// ----------------------------------------
// TAB 6: BLOG CMS
// ----------------------------------------
async function loadBlogArticles() {
  try {
    const res = await fetch('/api/blog');
    allBlogs = await res.json();
    const tbody = document.getElementById('blogs-tbody');
    tbody.innerHTML = '';

    allBlogs.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="max-width:240px;">
          <span class="text-bold-dark">${b.title}</span>
          <span class="sub-label" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${b.excerpt || 'No description excerpt summary.'}</span>
        </td>
        <td>
          <span class="badge-status status-interested" style="font-size:8px;">${b.category}</span>
        </td>
        <td>
          <select onchange="updateBlogField('${b.id}', 'status', this.value)" class="badge-status status-${b.status.toLowerCase()}" style="border:none; cursor:pointer;">
            <option value="Draft" ${b.status === 'Draft' ? 'selected' : ''}>Draft</option>
            <option value="Published" ${b.status === 'Published' ? 'selected' : ''}>Published</option>
          </select>
        </td>
        <td style="max-width:200px;">
          <span class="text-bold-dark" style="font-size:10px; font-weight:600;">Meta Title: ${b.seoTitle || ''}</span>
          <span class="sub-label" style="text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Desc: ${b.seoDescription || ''}</span>
        </td>
        <td>
          <div class="action-row">
            <button class="action-btn edit-btn" onclick="openBlogModal('${b.id}')"><i data-lucide="edit-3"></i></button>
            <button class="action-btn delete-btn" onclick="deleteBlog('${b.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
    lucide.createIcons();
  } catch (err) {
    console.error("Failed to load blog CMS:", err);
  }
}

function openBlogModal(id = null) {
  editingBlogId = id;
  const modal = document.getElementById('blog-modal');
  const title = document.getElementById('blog-modal-title');

  if (id) {
    title.innerText = 'Edit CMS Article';
    const blog = allBlogs.find(b => b.id === id);
    if (blog) {
      document.getElementById('blog-input-title').value = blog.title;
      document.getElementById('blog-input-category').value = blog.category;
      document.getElementById('blog-input-img').value = blog.featuredImage;
      document.getElementById('blog-input-excerpt').value = blog.excerpt;
      document.getElementById('blog-input-content').value = blog.content;
      document.getElementById('blog-input-seoTitle').value = blog.seoTitle || '';
      document.getElementById('blog-input-seoDescription').value = blog.seoDescription || '';
      document.getElementById('blog-input-status').value = blog.status || 'Draft';
    }
  } else {
    title.innerText = 'Compose Article';
    document.getElementById('blog-form').reset();
  }
  modal.classList.add('active');
}

function closeBlogModal() {
  document.getElementById('blog-modal').classList.remove('active');
}

async function handleSaveBlog(event) {
  event.preventDefault();
  const title = document.getElementById('blog-input-title').value.trim();
  const category = document.getElementById('blog-input-category').value.trim();
  const featuredImage = document.getElementById('blog-input-img').value.trim();
  const excerpt = document.getElementById('blog-input-excerpt').value.trim();
  const content = document.getElementById('blog-input-content').value.trim();
  const seoTitle = document.getElementById('blog-input-seoTitle').value.trim();
  const seoDescription = document.getElementById('blog-input-seoDescription').value.trim();
  const status = document.getElementById('blog-input-status').value;

  const payload = {
    title, category, featuredImage, excerpt, content, seoTitle, seoDescription, status
  };

  try {
    let res;
    if (editingBlogId) {
      res = await fetch('/api/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingBlogId, ...payload })
      });
    } else {
      res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeBlogModal();
      loadBlogArticles();
    } else {
      alert("Failed to save blog article.");
    }
  } catch (err) {
    console.error("Blog save request error:", err);
  }
}

async function updateBlogField(id, field, value) {
  try {
    const res = await fetch('/api/blog', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: value })
    });
    if (res.ok) {
      loadBlogArticles();
    }
  } catch (err) {
    console.error("Blog toggling save failed:", err);
  }
}

async function deleteBlog(id) {
  if (!confirm("Are you sure you want to delete this blog article?")) return;
  try {
    const res = await fetch(`/api/blog?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadBlogArticles();
    }
  } catch (err) {
    console.error("Blog delete request error:", err);
  }
}

// ----------------------------------------
// TAB 7: GLOBAL SETTINGS
// ----------------------------------------
async function loadGlobalSettings() {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('set-instituteName').value = data.instituteName || '';
      document.getElementById('set-tagline').value = data.tagline || '';
      document.getElementById('set-phone').value = data.phone || '';
      document.getElementById('set-whatsapp').value = data.whatsapp || '';
      document.getElementById('set-email').value = data.email || '';
      document.getElementById('set-address').value = data.address || '';
      document.getElementById('set-googleMapsEmbed').value = data.googleMapsEmbed || '';
      document.getElementById('set-whatsappNotificationActive').checked = !!data.whatsappNotificationActive;
      document.getElementById('set-emailNotificationActive').checked = !!data.emailNotificationActive;
    }
  } catch (err) {
    console.error("Failed to load settings form configs:", err);
  }
}

async function handleSaveSettings(event) {
  event.preventDefault();
  const instituteName = document.getElementById('set-instituteName').value.trim();
  const tagline = document.getElementById('set-tagline').value.trim();
  const phone = document.getElementById('set-phone').value.trim();
  const whatsapp = document.getElementById('set-whatsapp').value.trim();
  const email = document.getElementById('set-email').value.trim();
  const address = document.getElementById('set-address').value.trim();
  const googleMapsEmbed = document.getElementById('set-googleMapsEmbed').value.trim();
  const whatsappNotificationActive = document.getElementById('set-whatsappNotificationActive').checked;
  const emailNotificationActive = document.getElementById('set-emailNotificationActive').checked;

  const payload = {
    instituteName, tagline, phone, whatsapp, email, address, googleMapsEmbed, whatsappNotificationActive, emailNotificationActive
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("Settings saved successfully!");
      loadGlobalSettings();
    } else {
      alert("Failed to save global configurations.");
    }
  } catch (err) {
    console.error("Save settings error:", err);
  }
}

// ----------------------------------------
// ATTENDANCE MANAGEMENT MODULE
// ----------------------------------------
async function loadAttendanceDropdowns() {
  try {
    const res = await fetch('/api/batches');
    if (!res.ok) return;
    const batches = await res.json();
    allBatches = batches;

    const select = document.getElementById('att-select-batch');
    if (!select) return;
    
    // Save current selection
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Choose Batch --</option>';

    batches.forEach(b => {
      if (b.status === 'Active') {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.innerText = `${b.name} (${b.timing})`;
        select.appendChild(opt);
      }
    });

    if (currentVal) select.value = currentVal;
    
    // Auto-load if parameters are set
    loadAttendanceRoster();
  } catch (err) {
    console.error("Attendance dropdown setup failed:", err);
  }
}

async function loadAttendanceRoster() {
  const batchSelect = document.getElementById('att-select-batch');
  const dateInput = document.getElementById('att-select-date');
  
  const emptyState = document.getElementById('att-empty-state');
  const kpiGrid = document.getElementById('att-kpis-grid');
  const analyticsLayout = document.getElementById('att-analytics-layout');
  
  const tbodyRoster = document.getElementById('att-roster-tbody');
  const tbodyHistory = document.getElementById('att-history-tbody');

  if (!batchSelect || !dateInput || !emptyState || !kpiGrid || !analyticsLayout || !tbodyRoster || !tbodyHistory) return;

  const batchId = batchSelect.value;
  const date = dateInput.value;

  if (!batchId || !date) {
    emptyState.style.display = 'block';
    kpiGrid.style.display = 'none';
    analyticsLayout.style.display = 'none';
    return;
  }

  try {
    // 1. Fetch all students
    const resStudents = await fetch('/api/students');
    if (!resStudents.ok) return;
    const students = await resStudents.json();
    allStudents = students;

    const batchStudents = students.filter(s => s.enrolledBatchId === batchId && s.status === 'Active');

    if (batchStudents.length === 0) {
      tbodyRoster.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:30px; font-size:12px; color:var(--color-text-gray);">No active students enrolled in this batch yet. Register some students under Student Roster tab first!</td></tr>`;
      emptyState.style.display = 'none';
      kpiGrid.style.display = 'none';
      analyticsLayout.style.display = 'block';
      return;
    }

    // 2. Fetch all marked attendance for this batch (to calculate history and charts)
    const resAtt = await fetch(`/api/attendance?batchId=${batchId}`);
    let batchLogs = [];
    if (resAtt.ok) {
      batchLogs = await resAtt.json();
    }

    // Existing marked logs for the SPECIFIC selected date
    const dayLogs = batchLogs.filter(r => r.date === date);

    // Render Roster table
    emptyState.style.display = 'none';
    kpiGrid.style.display = 'grid';
    analyticsLayout.style.display = 'grid';
    tbodyRoster.innerHTML = '';

    batchStudents.forEach(std => {
      const record = dayLogs.find(r => r.studentId === std.id);
      const status = record ? record.status : 'Present';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: 700; color: var(--color-text-dark); font-size: 13px;">${std.name}</td>
        <td>
          <span class="badge-tag" style="background: rgba(37,99,235,0.06); color: var(--color-primary); font-size: 10px; font-weight:700;">
            ${std.attendance || 0}% avg
          </span>
        </td>
        <td style="text-align: center;">
          <div class="status-btn-group" data-student-id="${std.id}">
            <button type="button" class="status-btn present ${status === 'Present' ? 'active' : ''}" onclick="toggleRosterStatus(this, 'Present')">Present</button>
            <button type="button" class="status-btn absent ${status === 'Absent' ? 'active' : ''}" onclick="toggleRosterStatus(this, 'Absent')">Absent</button>
            <button type="button" class="status-btn late ${status === 'Late' ? 'active' : ''}" onclick="toggleRosterStatus(this, 'Late')">Late</button>
          </div>
        </td>
      `;
      tbodyRoster.appendChild(row);
    });

    // 3. Calculate KPIs
    const batchAvg = batchStudents.length > 0
      ? Math.round(batchStudents.reduce((acc, curr) => acc + (curr.attendance || 0), 0) / batchStudents.length)
      : 0;
    
    // Unique dates marked for this batch
    const uniqueDates = [...new Set(batchLogs.map(l => l.date))].sort();
    const totalClasses = uniqueDates.length;
    const lowAttAlerts = batchStudents.filter(s => (s.attendance || 0) < 75).length;

    document.getElementById('att-kpi-avg').innerText = `${batchAvg}%`;
    document.getElementById('att-kpi-total').innerText = totalClasses;
    document.getElementById('att-kpi-low').innerText = `${lowAttAlerts} Kids`;

    // 4. Render Recent Session logs
    tbodyHistory.innerHTML = '';
    
    // Reverse sort dates to show most recent first
    const recentDates = [...uniqueDates].reverse().slice(0, 10);

    if (recentDates.length === 0) {
      tbodyHistory.innerHTML = `<tr><td colspan="2" style="text-align:center; color:var(--color-text-gray); padding:20px;">No sessions recorded yet.</td></tr>`;
    } else {
      recentDates.forEach(d => {
        const logsOnDate = batchLogs.filter(l => l.date === d);
        const present = logsOnDate.filter(l => l.status === 'Present').length;
        const absent = logsOnDate.filter(l => l.status === 'Absent').length;
        const late = logsOnDate.filter(l => l.status === 'Late').length;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight:600; color:var(--color-text-dark);">${d}</td>
          <td style="text-align:center; font-weight:700;">
            <span style="color:var(--color-success-green);">${present}P</span> / 
            <span style="color:#EF4444">${absent}A</span> / 
            <span style="color:var(--color-accent-orange)">${late}L</span>
          </td>
        `;
        tbodyHistory.appendChild(row);
      });
    }

    // 5. Draw Trend Chart.js
    renderAttendanceTrendChart(uniqueDates, batchLogs, batchStudents.length);

  } catch (err) {
    console.error("Roster query failed:", err);
  }
}

function renderAttendanceTrendChart(uniqueDates, batchLogs, studentCount) {
  const ctx = document.getElementById('attTrendChart');
  if (!ctx) return;

  // Clear previous instance to avoid canvas overlay
  if (charts['attTrend']) {
    charts['attTrend'].destroy();
  }

  // Last 7 sessions
  const chartDates = uniqueDates.slice(-7);
  const chartData = chartDates.map(d => {
    const logs = batchLogs.filter(l => l.date === d);
    const presentOrLate = logs.filter(l => l.status === 'Present' || l.status === 'Late').length;
    return logs.length > 0 ? Math.round((presentOrLate / logs.length) * 100) : 0;
  });

  // If no classes, draw dummy flatline
  const labels = chartDates.length > 0 ? chartDates : ['No Data'];
  const data = chartData.length > 0 ? chartData : [0];

  charts['attTrend'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Attendance Rate %',
        data: data,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.04)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            font: { size: 9, family: 'Inter' }
          },
          grid: { color: 'rgba(0,0,0,0.03)' }
        },
        x: {
          ticks: {
            font: { size: 9, family: 'Inter' }
          },
          grid: { display: false }
        }
      }
    }
  });
}

function toggleRosterStatus(btnEl, status) {
  const group = btnEl.closest('.status-btn-group');
  if (group) {
    group.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');
  }
}

function markAllPresent() {
  document.querySelectorAll('.status-btn-group').forEach(group => {
    group.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));
    const presentBtn = group.querySelector('.status-btn.present');
    if (presentBtn) presentBtn.classList.add('active');
  });
}

async function saveAttendanceRoster() {
  const batchSelect = document.getElementById('att-select-batch');
  const dateInput = document.getElementById('att-select-date');
  if (!batchSelect || !dateInput) return;

  const batchId = batchSelect.value;
  const date = dateInput.value;

  if (!batchId || !date) {
    alert("Please select a batch and date first.");
    return;
  }

  const records = [];
  document.querySelectorAll('.status-btn-group').forEach(group => {
    const studentId = group.getAttribute('data-student-id');
    const activeBtn = group.querySelector('.status-btn.active');
    
    let status = 'Present';
    if (activeBtn) {
      if (activeBtn.classList.contains('absent')) status = 'Absent';
      else if (activeBtn.classList.contains('late')) status = 'Late';
    }

    if (studentId) {
      records.push({ studentId, status });
    }
  });

  if (records.length === 0) {
    alert("No student records found to save.");
    return;
  }

  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batchId, date, records })
    });

    if (res.ok) {
      alert("Attendance logs saved and student metrics updated successfully!");
      loadAttendanceRoster();
    } else {
      const data = await res.json();
      alert("Failed to save: " + (data.error || "unknown error"));
    }
  } catch (err) {
    console.error("Save attendance API failed:", err);
  }
}
