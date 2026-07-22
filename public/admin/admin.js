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
let editingLeadId = null;

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
      
      // Restore active tab from localStorage
      const savedTab = localStorage.getItem('adminActiveTab') || 'dashboard';
      const navItems = document.querySelectorAll('.nav-item');
      let targetBtn = null;
      navItems.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`switchTab('${savedTab}'`)) {
          targetBtn = btn;
        }
      });
      
      if (targetBtn) {
        switchTab(savedTab, targetBtn);
      } else {
        const dashboardBtn = Array.from(navItems).find(btn => (btn.getAttribute('onclick') || '').includes("switchTab('dashboard'"));
        switchTab('dashboard', dashboardBtn || navItems[0]);
      }
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
  localStorage.setItem('adminActiveTab', tabName);
  
  // Toggle Navigation active classes
  if (buttonEl) {
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');
  }

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
    document.getElementById('kpi-pageviews').innerText = data.kpis.totalPageViews || 0;
    
    // Average Engagement Time
    const avgSec = data.kpis.totalPageViews > 0 ? Math.round(data.kpis.totalTimeSpentSec / data.kpis.totalPageViews) : 0;
    document.getElementById('kpi-engagement').innerText = `${avgSec}s`;

    // Render Chart.js analytics graphs
    renderVisitsChart(data.analytics.dailyVisits || []);
    renderDevicesChart(data.analytics.deviceTypes || []);
    renderSourcesChart(data.analytics.trafficSources || []);

    // Render Page-Level Analytics Table
    const pageAnalyticsTbody = document.getElementById('page-analytics-tbody');
    if (pageAnalyticsTbody) {
      const pageViewsList = data.analytics.pageViews || [];
      // Sort by views descending
      pageViewsList.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      const formatDuration = (s) => {
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const remSec = s % 60;
        return `${m}m ${remSec}s`;
      };
      
      pageAnalyticsTbody.innerHTML = pageViewsList.map(item => {
        const views = item.views || 0;
        const timeSpent = item.timeSpentSec || 0;
        const avgTime = views > 0 ? Math.round(timeSpent / views) : 0;
        
        return `
          <tr>
            <td style="font-weight: 600; color: var(--color-text-dark); text-align: left;">${item.page}</td>
            <td style="text-align: left;">${views.toLocaleString()}</td>
            <td style="text-align: left;">${formatDuration(timeSpent)}</td>
            <td style="text-align: left;">
              <span style="background: rgba(37,99,235,0.06); color: #2563EB; font-weight: 700; padding: 4px 8px; border-radius: 6px; font-size: 11px;">
                ${formatDuration(avgTime)}
              </span>
            </td>
          </tr>
        `;
      }).join('\n');
    }

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
    await populateBatchDropdowns();
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
  const batchFilter = document.getElementById('leads-filter-batch').value;
  const tbody = document.getElementById('leads-tbody');
  tbody.innerHTML = '';

  const filtered = allLeads.filter(l => {
    const matchesSearch = (l.parentName || '').toLowerCase().includes(query) ||
                          (l.childName || '').toLowerCase().includes(query) ||
                          (l.phone || '').includes(query);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchesBatch = batchFilter === 'All' || l.preferredBatch === batchFilter;
    return matchesSearch && matchesStatus && matchesBatch;
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
        <div class="action-row">
          <button class="action-btn edit-btn" onclick="openLeadModal('${l.id}')" title="Edit Inquiry">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteLead('${l.id}')" title="Delete Inquiry">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
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
    const res = await fetch(`/api/leads/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      allLeads = allLeads.filter(l => l.id !== id);
      filterLeads();
    } else {
      const err = await res.json();
      alert(`Failed to delete lead: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Lead deletion error:", err);
    alert("Network error: Could not complete deletion.");
  }
}

function exportLeadsCsv() {
  window.open('/api/leads?export=csv', '_blank');
}

async function populateBatchDropdowns() {
  try {
    if (allBatches.length === 0) {
      const batchesRes = await fetch('/api/batches');
      allBatches = await batchesRes.json();
    }
    
    // Populate Leads filter
    const leadsFilter = document.getElementById('leads-filter-batch');
    if (leadsFilter) {
      const currentVal = leadsFilter.value;
      leadsFilter.innerHTML = '<option value="All">All Batches</option>';
      allBatches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.name;
        opt.innerText = b.name;
        leadsFilter.appendChild(opt);
      });
      if (currentVal) leadsFilter.value = currentVal;
    }
    
    // Populate Students filter
    const studentsFilter = document.getElementById('students-filter-batch');
    if (studentsFilter) {
      const currentVal = studentsFilter.value;
      studentsFilter.innerHTML = '<option value="All">All Batches</option>';
      allBatches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.innerText = b.name;
        studentsFilter.appendChild(opt);
      });
      if (currentVal) studentsFilter.value = currentVal;
    }
  } catch (err) {
    console.error("Failed to populate batch dropdowns:", err);
  }
}

function openLeadModal(id = null) {
  editingLeadId = id;
  const modal = document.getElementById('lead-modal');
  const title = document.getElementById('lead-modal-title');
  const select = document.getElementById('lead-input-batch');

  // Populate batch select dropdown options
  select.innerHTML = '';
  allBatches.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.name;
    opt.innerText = b.name;
    select.appendChild(opt);
  });
  
  const otherOpt = document.createElement('option');
  otherOpt.value = 'Undecided';
  otherOpt.innerText = 'Undecided / Other';
  select.appendChild(otherOpt);

  if (id) {
    title.innerText = "Edit Inquiry Lead";
    const lead = allLeads.find(l => l.id === id);
    if (lead) {
      document.getElementById('lead-input-parentName').value = lead.parentName || '';
      document.getElementById('lead-input-childName').value = lead.childName || '';
      document.getElementById('lead-input-age').value = lead.age || '';
      document.getElementById('lead-input-school').value = lead.school || '';
      document.getElementById('lead-input-class').value = lead.class || '';
      document.getElementById('lead-input-phone').value = lead.phone || '';
      document.getElementById('lead-input-email').value = lead.email || '';
      document.getElementById('lead-input-batch').value = lead.preferredBatch || 'Undecided';
      document.getElementById('lead-input-status').value = lead.status || 'New';
      document.getElementById('lead-input-followUpDate').value = lead.followUpDate || '';
      document.getElementById('lead-input-notes').value = lead.notes || '';
    }
  } else {
    title.innerText = "Add Manual Inquiry Lead";
    document.getElementById('lead-form').reset();
    document.getElementById('lead-input-status').value = 'New';
    document.getElementById('lead-input-batch').value = allBatches.length > 0 ? allBatches[0].name : 'Undecided';
  }

  modal.classList.add('active');
}

function closeLeadModal() {
  document.getElementById('lead-modal').classList.remove('active');
  editingLeadId = null;
}

async function handleSaveLead(event) {
  event.preventDefault();
  const parentName = document.getElementById('lead-input-parentName').value.trim();
  const childName = document.getElementById('lead-input-childName').value.trim();
  const age = document.getElementById('lead-input-age').value;
  const school = document.getElementById('lead-input-school').value.trim();
  const childClass = document.getElementById('lead-input-class').value.trim();
  const phone = document.getElementById('lead-input-phone').value.trim();
  const email = document.getElementById('lead-input-email').value.trim();
  const preferredBatch = document.getElementById('lead-input-batch').value;
  const status = document.getElementById('lead-input-status').value;
  const followUpDate = document.getElementById('lead-input-followUpDate').value;
  const notes = document.getElementById('lead-input-notes').value.trim();

  const payload = {
    parentName,
    childName,
    age: age ? Number(age) : 0,
    school,
    class: childClass,
    phone,
    email,
    preferredBatch,
    status,
    notes,
    followUpDate
  };

  try {
    let res;
    if (editingLeadId) {
      payload.id = editingLeadId;
      res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeLeadModal();
      loadLeadsPipeline();
    } else {
      const err = await res.json();
      alert(`Error saving lead: ${err.message || err.error}`);
    }
  } catch (err) {
    console.error("Failed to save lead:", err);
    alert("Error occurred while saving lead record.");
  }
}

// ----------------------------------------
// TAB 3: STUDENT ROSTER
// ----------------------------------------
async function loadStudentsRoster() {
  try {
    await populateBatchDropdowns();
    const res = await fetch('/api/students');
    allStudents = await res.json();
    filterStudents();
  } catch (err) {
    console.error("Failed to load student roster:", err);
  }
}

function filterStudents() {
  const query = document.getElementById('students-search').value.toLowerCase();
  const batchFilter = document.getElementById('students-filter-batch').value;
  const statusFilter = document.getElementById('students-filter-status').value;
  const tbody = document.getElementById('students-tbody');
  tbody.innerHTML = '';

  const batchMap = {};
  allBatches.forEach(b => batchMap[b.id] = b.name);

  const filtered = allStudents.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes(query) ||
                          (s.parentName || '').toLowerCase().includes(query) ||
                          (s.school || '').toLowerCase().includes(query);
    const matchesBatch = batchFilter === 'All' || s.enrolledBatchId === batchFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesBatch && matchesStatus;
  });

  filtered.forEach(s => {
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
    const res = await fetch(`/api/students/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      loadStudentsRoster();
    } else {
      const err = await res.json();
      alert(`Failed to delete student: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Student deletion request error:", err);
    alert("Network error: Could not complete deletion.");
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
    const res = await fetch(`/api/batches/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      loadBatchesPlanner();
    } else {
      const err = await res.json();
      alert(`Failed to delete batch: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Batch deletion error:", err);
    alert("Network error: Could not complete deletion.");
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
    const res = await fetch(`/api/gallery/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      loadGalleryVault();
    } else {
      const err = await res.json();
      alert(`Failed to delete media item: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Gallery deletion error:", err);
    alert("Network error: Could not complete deletion.");
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
    const res = await fetch(`/api/blog/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      loadBlogArticles();
    } else {
      const err = await res.json();
      alert(`Failed to delete blog article: ${err.error || 'Server error'}`);
    }
  } catch (err) {
    console.error("Blog delete request error:", err);
    alert("Network error: Could not complete deletion.");
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
      document.getElementById('set-cohortDateJunior').value = data.cohortDateJunior || '';
      document.getElementById('set-cohortDateSenior').value = data.cohortDateSenior || '';
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
  const cohortDateJunior = document.getElementById('set-cohortDateJunior').value;
  const cohortDateSenior = document.getElementById('set-cohortDateSenior').value;
  const whatsappNotificationActive = document.getElementById('set-whatsappNotificationActive').checked;
  const emailNotificationActive = document.getElementById('set-emailNotificationActive').checked;

  const payload = {
    instituteName, tagline, phone, whatsapp, email, address, googleMapsEmbed, cohortDateJunior, cohortDateSenior, whatsappNotificationActive, emailNotificationActive
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

// ----------------------------------------
// LEAD CSV IMPORT SYSTEM
// ----------------------------------------
let csvLines = [];
let csvHeaders = [];

const crmFields = [
  { key: 'parentName', label: 'Parent Full Name (Required)', required: true, matches: ["parent name", "parent", "father name", "mother name", "parentname", "parent_name"] },
  { key: 'childName', label: 'Child Full Name (Required)', required: true, matches: ["child name", "student name", "student", "childname", "child_name", "name"] },
  { key: 'phone', label: 'Contact Mobile (Required)', required: true, matches: ["phone", "mobile", "contact", "phone number", "mobile number", "mobile_number", "phone_number"] },
  { key: 'age', label: 'Child Age', required: false, matches: ["age", "child age", "age of child"] },
  { key: 'school', label: 'School Name', required: false, matches: ["school", "school name"] },
  { key: 'class', label: 'School Class', required: false, matches: ["class", "grade", "standard", "school class"] },
  { key: 'email', label: 'Email Address', required: false, matches: ["email", "email address", "email_address"] },
  { key: 'preferredBatch', label: 'Preferred Batch', required: false, matches: ["preferred batch", "batch", "course", "preferred_batch"] },
  { key: 'status', label: 'Pipeline Status', required: false, matches: ["status", "pipeline status", "lead status"] },
  { key: 'notes', label: 'Admissions Notes', required: false, matches: ["notes", "message", "enquiry", "comments", "description"] },
  { key: 'followUpDate', label: 'Follow-Up Date', required: false, matches: ["follow up date", "followup date", "followup_date"] }
];

function parseCSV(text) {
  const lines = [];
  let row = [""];
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

function openImportModal() {
  resetImportModal();
  document.getElementById('import-leads-modal').classList.add('active');
}

function closeImportModal() {
  document.getElementById('import-leads-modal').classList.remove('active');
}

function resetImportModal() {
  document.getElementById('csv-file-input').value = '';
  document.getElementById('import-step-upload').style.display = 'block';
  document.getElementById('import-step-mapping').style.display = 'none';
  document.getElementById('import-step-status').style.display = 'none';
  document.getElementById('import-loading-spinner').style.display = 'block';
  document.getElementById('import-success-feedback').style.display = 'none';
  csvLines = [];
  csvHeaders = [];
}

function handleCsvFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      alert("Invalid CSV structure. The file must have a header row and at least one lead row.");
      resetImportModal();
      return;
    }

    csvHeaders = parsed[0].map(h => h.trim());
    csvLines = parsed.slice(1);

    // Switch to step 2 (mapping)
    document.getElementById('import-step-upload').style.display = 'none';
    document.getElementById('import-step-mapping').style.display = 'block';

    // Populate dropdowns in mapping table
    const tbody = document.getElementById('mapping-tbody');
    tbody.innerHTML = '';

    crmFields.forEach(field => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(0,0,0,0.04)';
      
      const tdLabel = document.createElement('td');
      tdLabel.style.padding = '8px 0';
      tdLabel.style.fontWeight = '600';
      tdLabel.style.fontSize = '13px';
      tdLabel.innerText = field.label;

      const tdSelect = document.createElement('td');
      tdSelect.style.padding = '8px 0';
      
      const select = document.createElement('select');
      select.id = `map-select-${field.key}`;
      select.style.width = '100%';
      select.style.padding = '6px';
      select.style.borderRadius = '6px';
      select.style.border = '1px solid rgba(0,0,0,0.15)';
      
      // Default empty option (only if field is not required)
      if (!field.required) {
        const optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.innerText = '-- Skip Column --';
        select.appendChild(optEmpty);
      } else {
        const optSelect = document.createElement('option');
        optSelect.value = '';
        optSelect.innerText = '-- Choose CSV Column --';
        select.appendChild(optSelect);
      }

      // Add all CSV columns as options
      csvHeaders.forEach((header, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.innerText = header;
        select.appendChild(opt);
      });

      // Smart pre-selection logic!
      let preSelectedIndex = -1;
      for (let i = 0; i < csvHeaders.length; i++) {
        const normalizedHeader = csvHeaders[i].toLowerCase();
        if (field.matches.some(m => normalizedHeader.includes(m) || m.includes(normalizedHeader))) {
          preSelectedIndex = i;
          break;
        }
      }
      
      if (preSelectedIndex !== -1) {
        select.value = preSelectedIndex;
      }

      tdSelect.appendChild(select);
      tr.appendChild(tdLabel);
      tr.appendChild(tdSelect);
      tbody.appendChild(tr);
    });
    
    lucide.createIcons();
  };
  reader.readAsText(file);
}

async function processImportLeads() {
  // Validate that required fields are mapped
  const mappings = {};
  let missingFields = [];

  crmFields.forEach(field => {
    const val = document.getElementById(`map-select-${field.key}`).value;
    if (val === '') {
      if (field.required) {
        missingFields.push(field.label);
      }
    } else {
      mappings[field.key] = Number(val);
    }
  });

  if (missingFields.length > 0) {
    alert(`Please map the following required CRM fields:\n${missingFields.join('\n')}`);
    return;
  }

  // Switch to status step
  document.getElementById('import-step-mapping').style.display = 'none';
  document.getElementById('import-step-status').style.display = 'block';

  // Build the list of mapped objects
  const leadsToImport = [];
  csvLines.forEach(line => {
    // Skip empty lines
    if (line.length <= 1 && line[0] === '') return;

    const lead = {};
    crmFields.forEach(field => {
      const colIdx = mappings[field.key];
      if (colIdx !== undefined) {
        lead[field.key] = line[colIdx] ? line[colIdx].trim() : '';
      }
    });
    
    if (lead.parentName || lead.childName || lead.phone) {
      leadsToImport.push(lead);
    }
  });

  const duplicateAction = document.querySelector('input[name="duplicate-action"]:checked').value;

  try {
    const res = await fetch('/api/leads/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leads: leadsToImport,
        duplicateAction
      })
    });

    if (res.ok) {
      const result = await res.json();
      
      // Update UI feedback
      document.getElementById('import-loading-spinner').style.display = 'none';
      document.getElementById('import-success-feedback').style.display = 'block';

      const summaryDiv = document.getElementById('import-stats-summary');
      summaryDiv.innerHTML = `
        <p>• <strong>${result.countAdded}</strong> new leads registered.</p>
        <p>• <strong>${result.countUpdated}</strong> existing leads updated.</p>
        <p>• <strong>${result.countSkipped}</strong> records skipped (duplicates or empty).</p>
      `;

      // Reload lead pipeline pipeline view in background
      loadLeadsPipeline();
    } else {
      const err = await res.json();
      alert(`Import failed: ${err.error || 'Server error'}`);
      resetImportModal();
    }
  } catch (err) {
    console.error("Import error:", err);
    alert("Network error: Could not complete CSV import.");
    resetImportModal();
  }
}
