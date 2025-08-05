const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Demo users for testing
const demoUsers = [
  {
    id: '1',
    employeeId: 'EMP001',
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    email: 'admin@hotmail.com',
    password: 'abc',
    role: 'admin',
    department: 'IT',
    position: 'System Administrator',
    isActive: true
  },
  {
    id: '2',
    employeeId: 'EMP002',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'employee@company.com',
    password: 'password123',
    role: 'employee',
    department: 'Development',
    position: 'Software Developer',
    isActive: true
  }
];

// Demo login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user
  const user = demoUsers.find(u => u.email === email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  // Create a demo token (just the user ID for simplicity)
  const token = `demo_token_${user.id}`;
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: userWithoutPassword
  });
});

// Demo auth verification endpoint
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('demo_token_', '');
  const user = demoUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    success: true,
    user: userWithoutPassword
  });
});

// Demo dashboard endpoint
app.get('/api/dashboard/overview', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('demo_token_', '');
  const user = demoUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Mock dashboard data
  const dashboardData = {
    dashboard: user.role === 'employee' ? {
      todayStatus: {
        hasCheckedIn: false,
        hasCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        workingHours: '0h 0m'
      },
      monthlyStats: {
        presentDays: 20,
        lateDays: 2,
        totalWorkingHours: 9600
      },
      leaveInfo: {
        pendingRequests: 1,
        approvedThisMonth: 2
      }
    } : {
      totalEmployees: 150,
      todayAttendance: {
        present: 142,
        late: 5,
        absent: 3
      },
      leaveRequests: {
        pending: 8,
        approved: 25
      }
    }
  };
  
  res.json(dashboardData);
});

// Demo attendance endpoints
app.post('/api/attendance/checkin', (req, res) => {
  res.json({
    success: true,
    message: 'Checked in successfully at ' + new Date().toLocaleTimeString()
  });
});

app.post('/api/attendance/checkout', (req, res) => {
  res.json({
    success: true,
    message: 'Checked out successfully at ' + new Date().toLocaleTimeString()
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AttendSys Demo Server running on port ${PORT}`);
  console.log(`📝 Demo credentials:`);
  console.log(`   Admin: admin@hotmail.com / abc`);
  console.log(`   Employee: employee@company.com / password123`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});
