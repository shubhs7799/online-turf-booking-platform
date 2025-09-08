// Global variables
let currentUser = null;
let selectedSlot = null;

// API base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    loadAllTurfs(); // Auto-load turfs on page load
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('teamForm').addEventListener('submit', handleCreateTeam);
}

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUI();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email,
            password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        currentUser = response.data.user;
        
        updateUI();
        showAlert('Login successful!', 'success');
    } catch (error) {
        showAlert(error.response?.data?.error || 'Login failed', 'danger');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value;
    const role = document.getElementById('signupRole').value;
    
    const requestData = { name, email, password, phone, role };
    
    // If turf owner, include turf details
    if (role === 'turf_owner') {
        requestData.turfName = document.getElementById('turfName').value;
        requestData.location = document.getElementById('turfLocation').value;
        requestData.sportType = document.getElementById('turfSport').value;
        
        if (!requestData.turfName || !requestData.location || !requestData.sportType) {
            showAlert('Please fill all turf details', 'warning');
            return;
        }
    }
    
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, requestData);
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        currentUser = response.data.user;
        
        updateUI();
        showAlert('Registration successful!', 'success');
    } catch (error) {
        showAlert(error.response?.data?.error || 'Registration failed', 'danger');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateUI();
    showHome();
}

// UI functions
function updateUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (currentUser) {
        authButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');
        userName.textContent = currentUser.name;
        
        if (currentUser.role === 'player') {
            showPlayerDashboard();
        } else if (currentUser.role === 'turf_owner') {
            showOwnerDashboard();
        }
    } else {
        authButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
        showHome();
    }
}

function showPage(pageId) {
    const pages = ['homePage', 'loginPage', 'signupPage', 'playerDashboard', 'ownerDashboard'];
    pages.forEach(id => {
        document.getElementById(id).classList.add('d-none');
    });
    document.getElementById(pageId).classList.remove('d-none');
}

function showHome() {
    showPage('homePage');
}

function showLogin() {
    showPage('loginPage');
}

function showSignup() {
    showPage('signupPage');
}

function showPlayerDashboard() {
    showPage('playerDashboard');
    showSearchTurfs();
}

function showOwnerDashboard() {
    showPage('ownerDashboard');
    showMyTurfs();
}

// Player dashboard functions
function showSearchTurfs() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <h4>Search & Book Turfs</h4>
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="dashboardSearchLocation" placeholder="Location">
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control" id="dashboardSearchSport" placeholder="Sport">
                    </div>
                    <div class="col-md-4">
                        <input type="date" class="form-control" id="dashboardSearchDate">
                    </div>
                    <div class="col-12">
                        <button class="btn btn-primary w-100" onclick="searchTurfsFromDashboard()">Search Turfs</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="dashboardSearchResults"></div>
    `;
    
    // Auto-load all turfs
    loadDashboardTurfs();
}

async function loadDashboardTurfs() {
    try {
        const response = await axios.get(`${API_BASE}/turfs/search`);
        displayDashboardSearchResults(response.data);
    } catch (error) {
        console.error('Failed to load turfs');
    }
}

async function searchTurfsFromDashboard() {
    const location = document.getElementById('dashboardSearchLocation').value;
    const sport = document.getElementById('dashboardSearchSport').value;
    const date = document.getElementById('dashboardSearchDate').value;
    
    try {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        if (sport) params.append('sport', sport);
        if (date) params.append('date', date);
        
        const response = await axios.get(`${API_BASE}/turfs/search?${params}`);
        displayDashboardSearchResults(response.data);
    } catch (error) {
        showAlert('Search failed', 'danger');
    }
}

function displayDashboardSearchResults(turfs) {
    const resultsDiv = document.getElementById('dashboardSearchResults');
    
    if (turfs.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-info">No turfs found</div>';
        return;
    }
    
    let html = '<h5>Available Turfs</h5><div class="row">';
    turfs.forEach(turf => {
        const ownerContact = turf.Owner ? 
            `<small class="text-muted">Contact: ${turf.Owner.name} - ${turf.Owner.phone || 'No phone'}</small>` : '';
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card turf-card">
                    <div class="card-body">
                        <h6 class="card-title">${turf.name}</h6>
                        <p class="card-text">
                            <strong>Location:</strong> ${turf.location}<br>
                            <strong>Sport:</strong> ${turf.sport_type}<br>
                            <strong>Available Slots:</strong> ${turf.Slots?.length || 0}<br>
                            ${ownerContact}
                        </p>
                        <button class="btn btn-primary btn-sm" onclick="viewTurfSlots(${turf.id})">View & Book Slots</button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

// Search functions
async function loadAllTurfs() {
    try {
        const response = await axios.get(`${API_BASE}/turfs/search`);
        displaySearchResults(response.data);
    } catch (error) {
        console.error('Failed to load turfs');
    }
}

async function searchTurfs() {
    const location = document.getElementById('searchLocation').value;
    const sport = document.getElementById('searchSport').value;
    const date = document.getElementById('searchDate').value;
    
    try {
        const params = new URLSearchParams();
        if (location) params.append('location', location);
        if (sport) params.append('sport', sport);
        if (date) params.append('date', date);
        
        const response = await axios.get(`${API_BASE}/turfs/search?${params}`);
        displaySearchResults(response.data);
    } catch (error) {
        showAlert('Search failed', 'danger');
    }
}

function displaySearchResults(turfs) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (turfs.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-info">No turfs found</div>';
        return;
    }
    
    let html = '<div class="row">';
    turfs.forEach(turf => {
        html += `
            <div class="col-md-6 mb-3">
                <div class="card turf-card">
                    <div class="card-body">
                        <h5 class="card-title">${turf.name}</h5>
                        <p class="card-text">
                            <strong>Location:</strong> ${turf.location}<br>
                            <strong>Sport:</strong> ${turf.sport_type}<br>
                            <strong>Available Slots:</strong> ${turf.Slots?.length || 0}
                        </p>
                        <button class="btn btn-primary" onclick="viewTurfSlots(${turf.id})">View Slots</button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

// Slot booking functions
async function viewTurfSlots(turfId) {
    if (!currentUser) {
        showAlert('Please login to book slots', 'warning');
        return;
    }
    
    try {
        const response = await axios.get(`${API_BASE}/turfs/${turfId}/slots`);
        displaySlots(response.data, turfId);
    } catch (error) {
        showAlert('Failed to load slots', 'danger');
    }
}

function displaySlots(slots, turfId) {
    const resultsDiv = document.getElementById('dashboardSearchResults') || document.getElementById('searchResults');
    
    if (slots.length === 0) {
        resultsDiv.innerHTML = '<div class="alert alert-info">No available slots</div>';
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h5>Available Slots - ${slots[0]?.Turf?.name || 'Turf'}</h5>
            <button class="btn btn-secondary btn-sm" onclick="showSearchTurfs()">← Back to Search</button>
        </div>
        <div class="alert alert-info">
            <small><strong>Note:</strong> You can only book one slot per time period. Overlapping bookings are not allowed.</small>
        </div>
    `;
    
    slots.forEach(slot => {
        html += `
            <div class="slot-item">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <strong>Date:</strong> ${slot.date}<br>
                        <strong>Time:</strong> ${slot.start_time} - ${slot.end_time}
                    </div>
                    <div class="col-md-4">
                        <button class="btn btn-success btn-sm" onclick="bookSlot(${slot.id})">Book Now</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = html;
}

async function bookSlot(slotId) {
    if (currentUser.role !== 'player') {
        showAlert('Only players can book slots', 'warning');
        return;
    }
    
    try {
        const response = await axios.post(`${API_BASE}/bookings`, {
            slot_id: slotId
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        showAlert('Slot booked successfully!', 'success');
        
        // Refresh the search results or go back to search
        if (document.getElementById('dashboardSearchResults')) {
            showSearchTurfs();
        } else {
            searchTurfs();
        }
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Booking failed';
        
        // Show specific error for overlapping bookings
        if (errorMessage.includes('overlapping')) {
            showAlert(errorMessage, 'warning');
        } else {
            showAlert(errorMessage, 'danger');
        }
    }
}

// Player dashboard functions
async function showMyBookings() {
    try {
        const response = await axios.get(`${API_BASE}/bookings/my-bookings`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        displayMyBookings(response.data);
    } catch (error) {
        showAlert('Failed to load bookings', 'danger');
    }
}

function displayMyBookings(bookings) {
    const content = document.getElementById('dashboardContent');
    
    if (bookings.length === 0) {
        content.innerHTML = '<div class="alert alert-info">No bookings found</div>';
        return;
    }
    
    let html = '<h4>My Bookings</h4>';
    bookings.forEach(booking => {
        const statusClass = booking.status === 'cancelled' ? 'cancelled' : '';
        
        // Check if cancellation is allowed (30 minutes before slot time)
        const slotDateTime = new Date(`${booking.Slot.date}T${booking.Slot.start_time}`);
        const now = new Date();
        const timeDiff = slotDateTime.getTime() - now.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        const canCancel = minutesDiff > 30 && booking.status !== 'cancelled';
        
        html += `
            <div class="card booking-card ${statusClass} mb-3">
                <div class="card-body">
                    <h6>${booking.Slot.Turf.name}</h6>
                    <p>
                        <strong>Date:</strong> ${booking.Slot.date}<br>
                        <strong>Time:</strong> ${booking.Slot.start_time} - ${booking.Slot.end_time}<br>
                        <strong>Status:</strong> ${booking.status}
                    </p>
                    ${canCancel ? 
                        `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>
                         <small class="text-muted d-block mt-1">Can cancel until 30 min before slot time</small>` : 
                        booking.status !== 'cancelled' ? 
                            '<small class="text-muted">Cannot cancel (less than 30 min remaining)</small>' : ''
                    }
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

async function cancelBooking(bookingId) {
    try {
        await axios.put(`${API_BASE}/bookings/${bookingId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        showAlert('Booking cancelled successfully', 'success');
        showMyBookings();
    } catch (error) {
        showAlert('Failed to cancel booking', 'danger');
    }
}

// Team functions
async function showTeams() {
    const content = document.getElementById('dashboardContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h4>Teams</h4>
            <div>
                <button class="btn btn-info me-2" onclick="showMyTeam()">My Team</button>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#teamModal">Create Team</button>
            </div>
        </div>
        <div class="mb-3">
            <input type="text" class="form-control" id="teamSearchLocation" placeholder="Search teams by location">
            <button class="btn btn-secondary mt-2" onclick="searchTeams()">Search</button>
        </div>
        <div id="teamsContainer"></div>
    `;
}

async function showMyTeam() {
    try {
        const response = await axios.get(`${API_BASE}/teams/my-team`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        displayMyTeam(response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            document.getElementById('teamsContainer').innerHTML = 
                '<div class="alert alert-info">You haven\'t created a team yet</div>';
        } else {
            showAlert('Failed to load team', 'danger');
        }
    }
}

function displayMyTeam(team) {
    const container = document.getElementById('teamsContainer');
    
    let html = `
        <div class="card">
            <div class="card-header">
                <h5>${team.name}</h5>
                <small class="text-muted">Location: ${team.location}</small>
            </div>
            <div class="card-body">
                <h6>Team Members (${team.TeamMembers?.length || 0})</h6>
    `;
    
    if (team.TeamMembers && team.TeamMembers.length > 0) {
        team.TeamMembers.forEach(member => {
            const roleIcon = member.role === 'captain' ? '👑' : '👤';
            html += `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <strong>${roleIcon} ${member.User.name}</strong>
                                ${member.role === 'captain' ? '<span class="badge bg-warning ms-2">Captain</span>' : ''}
                                <br>
                                <small class="text-muted">
                                    📧 ${member.User.email}<br>
                                    📱 ${member.User.phone || 'No phone provided'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<div class="alert alert-info">No members yet</div>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

async function searchTeams() {
    const location = document.getElementById('teamSearchLocation').value || 'all';
    
    try {
        const response = await axios.get(`${API_BASE}/teams/${location}`);
        displayTeams(response.data);
    } catch (error) {
        showAlert('Failed to load teams', 'danger');
    }
}

function displayTeams(teams) {
    const container = document.getElementById('teamsContainer');
    
    if (teams.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No teams found</div>';
        return;
    }
    
    let html = '';
    teams.forEach(team => {
        const creatorContact = team.Creator ? 
            `<small class="text-muted">Captain: ${team.Creator.name} - ${team.Creator.phone || 'No phone'}</small><br>` : '';
        
        html += `
            <div class="team-card">
                <h6>${team.name}</h6>
                <p><strong>Location:</strong> ${team.location}</p>
                <p><strong>Members:</strong> ${team.TeamMembers?.length || 0}</p>
                ${creatorContact}
                <button class="btn btn-primary btn-sm" onclick="joinTeam(${team.id})">Join Team</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function handleCreateTeam(e) {
    e.preventDefault();
    
    const name = document.getElementById('teamName').value;
    const location = document.getElementById('teamLocation').value;
    
    try {
        await axios.post(`${API_BASE}/teams`, {
            name,
            location
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        showAlert('Team created successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('teamModal')).hide();
        document.getElementById('teamForm').reset();
    } catch (error) {
        showAlert('Failed to create team', 'danger');
    }
}

async function joinTeam(teamId) {
    try {
        await axios.post(`${API_BASE}/teams/${teamId}/join`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        showAlert('Joined team successfully!', 'success');
    } catch (error) {
        showAlert(error.response?.data?.error || 'Failed to join team', 'danger');
    }
}

// Owner dashboard functions
async function showMyTurfs() {
    try {
        const response = await axios.get(`${API_BASE}/turfs/my-turfs`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        displayMyTurf(response.data);
    } catch (error) {
        showAlert('Failed to load turf', 'danger');
    }
}

function displayMyTurf(turf) {
    const content = document.getElementById('ownerContent');
    
    if (!turf || !turf.id) {
        content.innerHTML = '<div class="alert alert-info">No turf registered</div>';
        return;
    }
    
    let html = '<h4>My Turf</h4>';
    html += `
        <div class="card mb-3">
            <div class="card-body">
                <h6>${turf.name}</h6>
                <p>
                    <strong>Location:</strong> ${turf.location}<br>
                    <strong>Sport:</strong> ${turf.sport_type}
                </p>
                <button class="btn btn-primary btn-sm" onclick="showAddSlots(${turf.id})">Add Slots</button>
                <button class="btn btn-info btn-sm" onclick="viewTurfBookings(${turf.id})">View Bookings</button>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

async function showMySlots() {
    try {
        const response = await axios.get(`${API_BASE}/turfs/my-slots`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        displayMySlots(response.data);
    } catch (error) {
        showAlert('Failed to load slots', 'danger');
    }
}

function displayMySlots(slots) {
    const content = document.getElementById('ownerContent');
    
    if (!slots || slots.length === 0) {
        content.innerHTML = '<div class="alert alert-info">No slots created yet</div>';
        return;
    }
    
    let html = '<h4>My Turf Slots</h4>';
    
    // Group slots by date
    const slotsByDate = {};
    slots.forEach(slot => {
        if (!slotsByDate[slot.date]) {
            slotsByDate[slot.date] = [];
        }
        slotsByDate[slot.date].push(slot);
    });
    
    Object.keys(slotsByDate).sort().forEach(date => {
        html += `<h6 class="mt-3">${date}</h6>`;
        slotsByDate[date].forEach(slot => {
            let statusBadge = '';
            
            if (slot.status === 'booked') {
                statusBadge = '<span class="badge bg-danger">Booked</span>';
            } else if (slot.status === 'expired') {
                statusBadge = '<span class="badge bg-secondary">Expired</span>';
            } else {
                statusBadge = '<span class="badge bg-success">Available</span>';
            }
            
            html += `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <strong>${slot.start_time} - ${slot.end_time}</strong>
                            </div>
                            <div class="col-md-6 text-end">
                                ${statusBadge}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    });
    
    content.innerHTML = html;
}

function showAddSlots(turfId) {
    const content = document.getElementById('ownerContent');
    
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    content.innerHTML = `
        <h4>Add Slots</h4>
        <div class="alert alert-info">
            <small>Note: Slots can only be created for tomorrow or future dates</small>
        </div>
        <form id="addSlotsForm">
            <div class="mb-3">
                <input type="date" class="form-control" id="slotDate" min="${minDate}" required>
            </div>
            <div class="mb-3">
                <input type="time" class="form-control" id="slotStartTime" required>
            </div>
            <div class="mb-3">
                <input type="time" class="form-control" id="slotEndTime" required>
            </div>
            <button type="submit" class="btn btn-primary">Add Slot</button>
        </form>
    `;
    
    document.getElementById('addSlotsForm').addEventListener('submit', (e) => handleAddSlots(e, turfId));
}

async function handleAddSlots(e, turfId) {
    e.preventDefault();
    
    const date = document.getElementById('slotDate').value;
    const start_time = document.getElementById('slotStartTime').value;
    const end_time = document.getElementById('slotEndTime').value;
    
    try {
        await axios.post(`${API_BASE}/turfs/${turfId}/slots`, {
            date,
            start_time,
            end_time
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        showAlert('Slot added successfully!', 'success');
        showMyTurfs();
    } catch (error) {
        showAlert('Failed to add slot', 'danger');
    }
}

async function viewTurfBookings(turfId) {
    try {
        const response = await axios.get(`${API_BASE}/turfs/${turfId}/bookings`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        displayTurfBookings(response.data);
    } catch (error) {
        showAlert('Failed to load bookings', 'danger');
    }
}

function displayTurfBookings(bookings) {
    const content = document.getElementById('ownerContent');
    
    if (bookings.length === 0) {
        content.innerHTML = '<div class="alert alert-info">No bookings found</div>';
        return;
    }
    
    let html = '<h4>Turf Bookings</h4>';
    bookings.forEach(booking => {
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>Booking #${booking.id}</h6>
                    <p>
                        <strong>Player:</strong> ${booking.User.name}<br>
                        <strong>Contact:</strong> ${booking.User.phone || 'No phone'}<br>
                        <strong>Date:</strong> ${booking.Slot.date}<br>
                        <strong>Time:</strong> ${booking.Slot.start_time} - ${booking.Slot.end_time}<br>
                        <strong>Status:</strong> ${booking.status}
                    </p>
                </div>
            </div>
        `;
    });
    
    content.innerHTML = html;
}

// Utility functions
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
    `;
    alertDiv.innerHTML = `
        <strong>${type === 'success' ? '✓' : type === 'danger' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</strong>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.add('fade');
            setTimeout(() => alertDiv.remove(), 150);
        }
    }, 4000);
}

function toggleTurfFields() {
    const role = document.getElementById('signupRole').value;
    const turfFields = document.getElementById('turfFields');
    
    if (role === 'turf_owner') {
        turfFields.classList.remove('d-none');
        document.getElementById('turfName').required = true;
        document.getElementById('turfLocation').required = true;
        document.getElementById('turfSport').required = true;
    } else {
        turfFields.classList.add('d-none');
        document.getElementById('turfName').required = false;
        document.getElementById('turfLocation').required = false;
        document.getElementById('turfSport').required = false;
    }
}
