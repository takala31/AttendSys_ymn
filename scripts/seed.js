const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Shift = require('../models/Shift');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Shift.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});

    // Create default shifts
    console.log('Creating shifts...');
    const shifts = await Shift.create([
      {
        name: 'Morning Shift',
        description: 'Standard morning working hours',
        startTime: '09:00',
        endTime: '17:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        breakDuration: 60,
        lateThreshold: 15,
        overTimeThreshold: 480,
        color: '#3498db'
      },
      {
        name: 'Evening Shift',
        description: 'Evening working hours',
        startTime: '14:00',
        endTime: '22:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        breakDuration: 60,
        lateThreshold: 15,
        overTimeThreshold: 480,
        color: '#e74c3c'
      },
      {
        name: 'Night Shift',
        description: 'Night working hours',
        startTime: '22:00',
        endTime: '06:00',
        workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        breakDuration: 60,
        lateThreshold: 15,
        overTimeThreshold: 480,
        color: '#9b59b6'
      },
      {
        name: 'Flexible Hours',
        description: 'Flexible working arrangement',
        startTime: '08:00',
        endTime: '16:00',
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        breakDuration: 45,
        lateThreshold: 30,
        overTimeThreshold: 480,
        color: '#f39c12'
      }
    ]);

    console.log('Shifts created:', shifts.length);

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      // Admin user
      {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Admin',
        email: 'admin@company.com',
        password: 'password123',
        role: 'admin',
        department: 'Administration',
        position: 'System Administrator',
        phone: '+1234567890',
        address: {
          street: '123 Admin Street',
          city: 'Tech City',
          state: 'TC',
          zipCode: '12345',
          country: 'USA'
        },
        dateOfBirth: new Date('1985-01-15'),
        hireDate: new Date('2020-01-01'),
        salary: 75000,
        shift: shifts[0]._id,
        isActive: true
      },

      // HR user
      {
        employeeId: 'EMP002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'hr@company.com',
        password: 'password123',
        role: 'hr',
        department: 'Human Resources',
        position: 'HR Manager',
        phone: '+1234567891',
        address: {
          street: '456 HR Avenue',
          city: 'Business City',
          state: 'BC',
          zipCode: '12346',
          country: 'USA'
        },
        dateOfBirth: new Date('1988-03-22'),
        hireDate: new Date('2020-02-15'),
        salary: 65000,
        shift: shifts[0]._id,
        isActive: true
      },

      // Manager user
      {
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'manager@company.com',
        password: 'password123',
        role: 'manager',
        department: 'Engineering',
        position: 'Engineering Manager',
        phone: '+1234567892',
        address: {
          street: '789 Tech Boulevard',
          city: 'Innovation City',
          state: 'IC',
          zipCode: '12347',
          country: 'USA'
        },
        dateOfBirth: new Date('1982-07-10'),
        hireDate: new Date('2019-06-01'),
        salary: 85000,
        shift: shifts[0]._id,
        isActive: true
      },

      // Employee users
      {
        employeeId: 'EMP004',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'employee@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        position: 'Software Developer',
        phone: '+1234567893',
        address: {
          street: '321 Developer Lane',
          city: 'Code City',
          state: 'CC',
          zipCode: '12348',
          country: 'USA'
        },
        dateOfBirth: new Date('1990-11-05'),
        hireDate: new Date('2021-03-15'),
        salary: 70000,
        shift: shifts[0]._id,
        manager: null, // Will be set after manager is created
        isActive: true
      },

      {
        employeeId: 'EMP005',
        firstName: 'Bob',
        lastName: 'Brown',
        email: 'bob.brown@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        position: 'Frontend Developer',
        phone: '+1234567894',
        address: {
          street: '654 Frontend Street',
          city: 'UI City',
          state: 'UC',
          zipCode: '12349',
          country: 'USA'
        },
        dateOfBirth: new Date('1992-04-18'),
        hireDate: new Date('2021-08-01'),
        salary: 65000,
        shift: shifts[0]._id,
        isActive: true
      },

      {
        employeeId: 'EMP006',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Marketing',
        position: 'Marketing Specialist',
        phone: '+1234567895',
        address: {
          street: '987 Marketing Avenue',
          city: 'Brand City',
          state: 'BC',
          zipCode: '12350',
          country: 'USA'
        },
        dateOfBirth: new Date('1989-09-12'),
        hireDate: new Date('2020-11-01'),
        salary: 55000,
        shift: shifts[0]._id,
        isActive: true
      },

      {
        employeeId: 'EMP007',
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Sales',
        position: 'Sales Representative',
        phone: '+1234567896',
        address: {
          street: '147 Sales Street',
          city: 'Revenue City',
          state: 'RC',
          zipCode: '12351',
          country: 'USA'
        },
        dateOfBirth: new Date('1987-12-25'),
        hireDate: new Date('2020-05-15'),
        salary: 50000,
        shift: shifts[1]._id, // Evening shift
        isActive: true
      },

      {
        employeeId: 'EMP008',
        firstName: 'Eva',
        lastName: 'Garcia',
        email: 'eva.garcia@company.com',
        password: 'password123',
        role: 'employee',
        department: 'Finance',
        position: 'Financial Analyst',
        phone: '+1234567897',
        address: {
          street: '258 Finance Plaza',
          city: 'Money City',
          state: 'MC',
          zipCode: '12352',
          country: 'USA'
        },
        dateOfBirth: new Date('1991-06-08'),
        hireDate: new Date('2021-01-10'),
        salary: 60000,
        shift: shifts[0]._id,
        isActive: true
      }
    ]);

    console.log('Users created:', users.length);

    // Update manager relationships
    const manager = users.find(u => u.role === 'manager');
    const employees = users.filter(u => u.role === 'employee' && u.department === 'Engineering');
    
    for (const employee of employees) {
      employee.manager = manager._id;
      await employee.save();
    }

    console.log('Manager relationships updated');

    // Create some sample attendance records for the last 30 days
    console.log('Creating sample attendance records...');
    const today = new Date();
    const attendanceRecords = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends for most shifts
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const user of users.filter(u => u.role === 'employee')) {
        const shift = shifts.find(s => s._id.toString() === user.shift.toString());
        
        // 90% attendance rate
        if (Math.random() > 0.1) {
          const checkInTime = new Date(date);
          const [startHour, startMinute] = shift.startTime.split(':');
          checkInTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
          
          // Add some randomness to check-in time (-10 to +30 minutes)
          const variance = Math.floor(Math.random() * 40) - 10;
          checkInTime.setMinutes(checkInTime.getMinutes() + variance);
          
          const checkOutTime = new Date(checkInTime);
          checkOutTime.setHours(checkOutTime.getHours() + 8); // 8 hour work day
          
          // Add some randomness to checkout time (-15 to +60 minutes)
          const checkoutVariance = Math.floor(Math.random() * 75) - 15;
          checkOutTime.setMinutes(checkOutTime.getMinutes() + checkoutVariance);

          const isLate = variance > shift.lateThreshold;
          
          attendanceRecords.push({
            user: user._id,
            date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            shift: shift._id,
            checkIn: {
              time: checkInTime,
              ipAddress: '192.168.1.100'
            },
            checkOut: {
              time: checkOutTime,
              ipAddress: '192.168.1.100'
            },
            isLate,
            lateMinutes: isLate ? variance - shift.lateThreshold : 0,
            status: isLate ? 'late' : 'present'
          });
        }
      }
    }

    await Attendance.create(attendanceRecords);
    console.log('Attendance records created:', attendanceRecords.length);

    // Create some sample leave requests
    console.log('Creating sample leave requests...');
    const leaveRecords = [];
    const leaveTypes = ['sick', 'vacation', 'personal', 'emergency'];
    
    for (const user of users.filter(u => u.role === 'employee')) {
      // Create 2-3 leave requests per employee
      const leaveCount = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < leaveCount; i++) {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) - 30); // ±30 days
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days
        
        // Calculate total days
        const timeDiff = endDate.getTime() - startDate.getTime();
        const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date
        
        const type = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        const statuses = ['pending', 'approved', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        const leave = {
          user: user._id,
          type,
          startDate,
          endDate,
          totalDays,
          reason: `Sample ${type} leave request`,
          status,
          appliedDate: new Date(startDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Applied up to 7 days before
        };

        if (status !== 'pending') {
          leave.reviewedBy = users.find(u => ['admin', 'hr', 'manager'].includes(u.role))._id;
          leave.reviewedAt = new Date(leave.appliedDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000); // Reviewed within 3 days
          leave.reviewComments = status === 'approved' ? 'Approved' : 'Rejected due to business requirements';
        }

        leaveRecords.push(leave);
      }
    }

    await Leave.create(leaveRecords);
    console.log('Leave records created:', leaveRecords.length);

    console.log('\n=== Seed Data Summary ===');
    console.log(`Shifts: ${shifts.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Attendance Records: ${attendanceRecords.length}`);
    console.log(`Leave Records: ${leaveRecords.length}`);
    
    console.log('\n=== Test Login Credentials ===');
    console.log('Admin: admin@company.com / password123');
    console.log('HR: hr@company.com / password123');
    console.log('Manager: manager@company.com / password123');
    console.log('Employee: employee@company.com / password123');
    console.log('Employee: bob.brown@company.com / password123');
    
    console.log('\nSeed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
