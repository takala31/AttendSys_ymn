// AttendSys Authentication Utility
function initAttendSys() {
    // Authentication check
    function checkAuth() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!isAuthenticated) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Update user info
        const userNameEl = document.querySelector('.user-info div');
        const userRoleEl = document.querySelector('.user-info small');
        const userImgEl = document.getElementById('userProfileImg');
        
        if (currentUser.name && userNameEl) {
            userNameEl.textContent = currentUser.name;
        }
        if (currentUser.role && userRoleEl) {
            userRoleEl.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        }
        if (currentUser.avatar && userImgEl) {
            userImgEl.src = currentUser.avatar;
        }
        
        return true;
    }

    // Logout function
    window.logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    };

    // Update current date
    function updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    // Initialize
    if (checkAuth()) {
        updateCurrentDate();
        setInterval(updateCurrentDate, 60000);
        return true;
    }
    return false;
}
