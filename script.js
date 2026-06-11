const API_BASE = '/api';

// --- DATA FETCHING ---
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// --- UI UPDATES ---
async function loadDashboardStats() {
    const stats = await fetchData('/dashboard/stats');
    if (stats) {
        document.getElementById('stat-total-orders').textContent = stats.totalOrders || 0;
        document.getElementById('stat-pending').textContent = stats.pendingOrders || 0;
        const total = stats.totalOrders || 0;
        const pending = stats.pendingOrders || 0;
        document.getElementById('stat-delivered').textContent = Math.max(0, total - pending);
        document.getElementById('stat-revenue').textContent = '₹' + (stats.totalRevenue || 0).toLocaleString();
    } else {
        document.getElementById('stat-total-orders').textContent = '0';
        document.getElementById('stat-pending').textContent = '0';
        document.getElementById('stat-delivered').textContent = '0';
        document.getElementById('stat-revenue').textContent = '₹0';
    }
}

async function loadRecentOrders() {
    const orders = await fetchData('/orders');
    const tableBody = document.querySelector('#recent-orders-table tbody');
    
    if (orders && orders.length > 0) {
        tableBody.innerHTML = '';
        // Only show last 5 orders
        orders.slice(-5).reverse().forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>${order.client ? order.client.name : 'Unknown'}</td>
                <td>${new Date(order.dueDate).toLocaleDateString()}</td>
                <td><span class="status-badge ${getStatusClass(order.status)}">${order.status}</span></td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No orders found</td></tr>';
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'in production':
        case 'processing':
            return 'status-production';
        case 'delivered':
        case 'completed':
            return 'status-complete';
        case 'on hold':
            return 'status-hold';
        default:
            return 'status-production';
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Set current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', options);

    // Initial data load
    loadDashboardStats();
    loadRecentOrders();

    // Refresh data every 30 seconds
    setInterval(() => {
        loadDashboardStats();
        loadRecentOrders();
    }, 30000);
});

