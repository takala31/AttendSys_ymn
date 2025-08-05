# AttendSys - Attendance Management System

A comprehensive attendance management system built with Node.js, Express, MongoDB, and a responsive web interface.

## Features

### 🔐 Authentication & User Management
- Secure user authentication with JWT tokens
- Role-based access control (Admin, HR, Manager, Employee)
- User profile management with image upload
- Password encryption with bcrypt

### 📊 Attendance Management
- **Check-in/Check-out System**
  - Web-based check-in with timestamp
  - Optional image capture for verification
  - GPS location tracking (optional)
  - IP address and device tracking
  
- **Break Management**
  - Start/end break tracking
  - Multiple break types (lunch, coffee, personal, etc.)
  - Automatic break duration calculation

- **Smart Features**
  - Automatic late detection based on shift timings
  - Working hours calculation
  - Overtime tracking
  - Real-time attendance status

### 🏢 Shift Management
- **Flexible Shift Configuration**
  - Custom shift timings
  - Working days selection
  - Break duration settings
  - Late threshold configuration
  - Overtime calculation rules

- **Shift Assignment**
  - Assign users to specific shifts
  - Bulk user assignment
  - Shift-based attendance validation

### 📅 Leave Management
- **Leave Application System**
  - Multiple leave types (sick, vacation, personal, etc.)
  - Date range selection
  - Half-day leave support
  - File attachment support
  - Handover notes and replacement employee assignment

- **Approval Workflow**
  - Manager/HR approval system
  - Review comments
  - Status tracking (pending, approved, rejected, cancelled)
  - Email notifications (configurable)

### 📈 Dashboard & Analytics
- **Employee Dashboard**
  - Today's attendance status
  - Monthly statistics
  - Quick check-in/out actions
  - Recent attendance history
  - Upcoming leaves

- **Admin/HR Dashboard**
  - Company-wide attendance overview
  - Real-time statistics
  - Recent activities
  - Pending leave requests
  - Employee performance metrics

### 📊 Reporting System
- **Attendance Reports**
  - Individual and department-wise reports
  - Date range filtering
  - Working hours analysis
  - Late arrival tracking

- **Leave Reports**
  - Leave utilization reports
  - Department-wise leave analysis
  - Leave type distribution
  - Approval statistics

- **Monthly Summary Reports**
  - Complete monthly overview
  - Department performance
  - Attendance rates
  - Working hours summary

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Security**: Helmet, bcryptjs, express-rate-limit
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Icons**: Font Awesome
- **Date Handling**: Moment.js

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AttendSys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Edit .env file with your configuration
   ```

4. **Environment Variables**
   Update the `.env` file with your settings:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/attendance_system
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # File Upload
   MAX_FILE_SIZE=5000000
   UPLOAD_PATH=./uploads
   
   # Security
   BCRYPT_SALT_ROUNDS=12
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

5. **Database Setup**
   ```bash
   # Start MongoDB service
   # Windows: net start MongoDB
   # macOS: brew services start mongodb-community
   # Linux: sudo systemctl start mongod
   
   # Seed the database with sample data
   npm run seed
   ```

6. **Start the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

After running the seed script, you can use these credentials:

- **Admin**: admin@company.com / password123
- **HR**: hr@company.com / password123
- **Manager**: manager@company.com / password123
- **Employee**: employee@company.com / password123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (admin/hr)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (admin/hr)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user (admin)

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `POST /api/attendance/break/start` - Start break
- `POST /api/attendance/break/end` - End break
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/user/:userId` - Get user attendance

### Leaves
- `POST /api/leaves` - Apply for leave
- `GET /api/leaves/user/:userId` - Get user leaves
- `GET /api/leaves` - Get all leaves (admin/hr)
- `PUT /api/leaves/:id/review` - Approve/reject leave
- `PUT /api/leaves/:id/cancel` - Cancel leave

### Shifts
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create shift (admin/hr)
- `PUT /api/shifts/:id` - Update shift (admin/hr)
- `DELETE /api/shifts/:id` - Delete shift (admin)

### Dashboard
- `GET /api/dashboard/overview` - Dashboard data
- `GET /api/dashboard/analytics/attendance` - Attendance analytics
- `GET /api/dashboard/analytics/leaves` - Leave analytics

### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/leaves` - Leave report
- `GET /api/reports/monthly-summary` - Monthly summary

## Project Structure

```
AttendSys/
├── models/           # Database models
│   ├── User.js
│   ├── Attendance.js
│   ├── Leave.js
│   └── Shift.js
├── routes/           # API route handlers
│   ├── auth.js
│   ├── users.js
│   ├── attendance.js
│   ├── leaves.js
│   ├── shifts.js
│   ├── dashboard.js
│   └── reports.js
├── middleware/       # Custom middleware
│   ├── auth.js
│   └── upload.js
├── scripts/          # Utility scripts
│   └── seed.js
├── public/           # Static files
│   └── index.html
├── uploads/          # File uploads directory
├── server.js         # Main server file
├── package.json
└── README.md
```

## Features in Detail

### Role-Based Access Control
- **Admin**: Full system access, user management, reports
- **HR**: User management, leave approval, reports
- **Manager**: Team attendance monitoring, leave approval
- **Employee**: Personal attendance, leave application

### Security Features
- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting for API endpoints
- Input validation and sanitization
- File upload restrictions
- CORS protection

### File Upload Support
- Profile image upload
- Check-in image capture
- Leave attachment support
- Automatic file organization
- Size and type restrictions

### Real-time Features
- Live attendance tracking
- Real-time dashboard updates
- Instant status updates
- Break time tracking

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests (when implemented)

### Adding New Features
1. Create database models in `/models`
2. Add API routes in `/routes`
3. Implement middleware if needed
4. Update frontend in `/public`
5. Add tests if applicable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Email: support@attendsys.com
- Documentation: Available in the `/docs` folder

## Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced reporting with charts
- [ ] Email notifications
- [ ] Biometric integration
- [ ] Geofencing for location-based attendance
- [ ] Calendar integration
- [ ] Payroll integration
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced analytics and insights
