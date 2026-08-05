const BASE = () => (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'http://localhost:5000';
const getToken = () => localStorage.getItem('vazraa_token');
const getRole = () => localStorage.getItem('vazraa_role');

document.addEventListener('DOMContentLoaded', () => {
  // Guard clause: Only admin can view this page
  if (getRole() !== 'admin' || !getToken()) {
    window.location.href = 'index.html';
    return;
  }

  // Show the main layout if authorized
  const mainLayout = document.getElementById('adminMain');
  if (mainLayout) mainLayout.style.display = 'flex';

  // Load initial data
  loadDashboardData();
  loadBookings();
  loadUsers();
  loadDrivers();
});

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Tab Switching
window.switchTab = function(tabId) {
  // Update buttons
  document.querySelectorAll('.admin-sidebar__nav button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('nav-' + tabId).classList.add('active');

  // Update content
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.style.display = 'none';
  });
  document.getElementById('tab-' + tabId).style.display = 'block';
}

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

// ================= API CALLS ================= //

async function apiFetch(endpoint, options = {}) {
  const url = `${BASE()}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    return await res.json();
  } catch (err) {
    console.error(`Error calling ${endpoint}:`, err);
    return { success: false, message: 'Network error' };
  }
}

async function loadDashboardData() {
  const data = await apiFetch('/api/admin/dashboard');
  if (data.success && data.data) {
    document.getElementById('stat-bookings').textContent = data.data.totalBookings || 0;
    document.getElementById('stat-users').textContent = data.data.totalUsers || 0;
    document.getElementById('stat-revenue').textContent = '₹' + (data.data.estimatedRevenue || 0);
  } else {
    showToast('Failed to load dashboard data');
  }
}

async function loadBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
  
  const data = await apiFetch('/api/admin/bookings');
  if (data.success && data.data) {
    const bookings = data.data.bookings || [];
    if (bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No bookings found.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const isSelectable = ['pending', 'confirmed', 'in progress'].includes((b.bookingStatus || '').toLowerCase());
      const statuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
      
      let statusHtml = `<span>${b.bookingStatus}</span>`;
      if (isSelectable) {
        statusHtml = `
          <select class="status-select" onchange="updateBookingStatus('${b._id}', this.value)">
            ${statuses.map(s => `<option value="${s.toLowerCase()}" ${s.toLowerCase() === (b.bookingStatus || '').toLowerCase() ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        `;
      }

      return `
      <tr>
        <td>${b.bookingNumber || '—'}</td>
        <td>${b.customer ? b.customer.name : 'Unknown'}<br><small style="color:#888;">${b.customer ? b.customer.phone : ''}</small></td>
        <td><strong>${b.pickup}</strong> <i class="fa fa-arrow-right" style="font-size:10px; color:#aaa; margin:0 4px;"></i> <strong>${b.drop}</strong></td>
        <td>${formatDate(b.scheduledDate)}<br><small style="color:#888;">${b.scheduledTime}</small></td>
        <td>${statusHtml}</td>
        <td>
          <button class="table-action-btn" onclick="alert('View details for ${b.bookingNumber}')">View</button>
        </td>
      </tr>
    `}).join('');
  } else {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;">Error loading bookings</td></tr>';
  }
}

window.updateBookingStatus = async function(bookingId, newStatus) {
  const data = await apiFetch(`/api/admin/bookings/${bookingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus })
  });
  if (data.success) {
    showToast(`Booking updated to ${newStatus}`);
    loadDashboardData();
  } else {
    showToast('Failed to update booking');
    loadBookings(); // refresh to old status
  }
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
  
  const data = await apiFetch('/api/admin/users');
  if (data.success && data.data) {
    const users = data.data.users || [];
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users found.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${formatDate(u.createdAt)}</td>
        <td><span style="color:${u.isActive ? '#16a34a' : '#ef4444'}">${u.isActive ? 'Active' : 'Suspended'}</span></td>
      </tr>
    `).join('');
  }
}

async function loadDrivers() {
  const tbody = document.getElementById('driversTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
  
  const data = await apiFetch('/api/admin/drivers');
  if (data.success && data.data) {
    const drivers = data.data.drivers || [];
    if (drivers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No drivers found.</td></tr>';
      return;
    }

    tbody.innerHTML = drivers.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.email}</td>
        <td>${d.phone}</td>
        <td>${formatDate(d.createdAt)}</td>
        <td><span style="color:${d.isActive ? '#16a34a' : '#ef4444'}">${d.isActive ? 'Active' : 'Suspended'}</span></td>
      </tr>
    `).join('');
  }
}
