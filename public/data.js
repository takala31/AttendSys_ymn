// AttendSys Data Management System
class AttendSysData {
    constructor() {
        this.initializeData();
    }

    // Initialize default data if not exists
    initializeData() {
        // Check if users exist, if not or if empty, initialize with defaults
        const existingUsers = JSON.parse(localStorage.getItem('attendsys_users') || '[]');
        if (existingUsers.length === 0) {
            const defaultUsers = [
                {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@hotmail.com',
                    employeeId: 'ADM001',
                    department: 'Admin',
                    position: 'System Administrator',
                    role: 'admin',
                    status: 'Active',
                    joinDate: '2023-01-01',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 2,
                    name: 'John Doe',
                    email: 'john.doe@company.com',
                    employeeId: 'EMP001',
                    department: 'IT',
                    position: 'Software Developer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-01-15',
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 3,
                    name: 'Jane Smith',
                    email: 'jane.smith@company.com',
                    employeeId: 'EMP002',
                    department: 'HR',
                    position: 'HR Manager',
                    role: 'manager',
                    status: 'Active',
                    joinDate: '2023-03-20',
                    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b55c?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 4,
                    name: 'Mike Johnson',
                    email: 'mike.johnson@company.com',
                    employeeId: 'EMP003',
                    department: 'Finance',
                    position: 'Accountant',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-05-10',
                    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 5,
                    name: 'Sarah Wilson',
                    email: 'sarah.wilson@company.com',
                    employeeId: 'EMP004',
                    department: 'Marketing',
                    position: 'Marketing Specialist',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-02-28',
                    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 6,
                    name: 'David Brown',
                    email: 'david.brown@company.com',
                    employeeId: 'EMP005',
                    department: 'IT',
                    position: 'Backend Developer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-04-12',
                    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 7,
                    name: 'Emily Davis',
                    email: 'emily.davis@company.com',
                    employeeId: 'EMP006',
                    department: 'Design',
                    position: 'UI/UX Designer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-06-05',
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 8,
                    name: 'Robert Miller',
                    email: 'robert.miller@company.com',
                    employeeId: 'EMP007',
                    department: 'Sales',
                    position: 'Sales Manager',
                    role: 'manager',
                    status: 'Active',
                    joinDate: '2023-01-30',
                    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 9,
                    name: 'Lisa Garcia',
                    email: 'lisa.garcia@company.com',
                    employeeId: 'EMP008',
                    department: 'HR',
                    position: 'HR Specialist',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-07-18',
                    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 10,
                    name: 'James Rodriguez',
                    email: 'james.rodriguez@company.com',
                    employeeId: 'EMP009',
                    department: 'Finance',
                    position: 'Financial Analyst',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-08-22',
                    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 11,
                    name: 'Amanda Taylor',
                    email: 'amanda.taylor@company.com',
                    employeeId: 'EMP010',
                    department: 'Marketing',
                    position: 'Content Manager',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-09-15',
                    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 12,
                    name: 'Kevin Wilson',
                    email: 'kevin.wilson@company.com',
                    employeeId: 'EMP011',
                    department: 'IT',
                    position: 'DevOps Engineer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-10-03',
                    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 13,
                    name: 'Nicole Anderson',
                    email: 'nicole.anderson@company.com',
                    employeeId: 'EMP012',
                    department: 'Design',
                    position: 'Graphic Designer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-11-12',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 14,
                    name: 'Daniel Lee',
                    email: 'daniel.lee@company.com',
                    employeeId: 'EMP013',
                    department: 'Sales',
                    position: 'Sales Representative',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2023-12-01',
                    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 15,
                    name: 'Rachel Martinez',
                    email: 'rachel.martinez@company.com',
                    employeeId: 'EMP014',
                    department: 'Finance',
                    position: 'Budget Analyst',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2024-01-15',
                    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 16,
                    name: 'Christopher Clark',
                    email: 'christopher.clark@company.com',
                    employeeId: 'EMP015',
                    department: 'IT',
                    position: 'Frontend Developer',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2024-02-20',
                    avatar: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 17,
                    name: 'Stephanie Lewis',
                    email: 'stephanie.lewis@company.com',
                    employeeId: 'EMP016',
                    department: 'Marketing',
                    position: 'Social Media Manager',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2024-03-10',
                    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 18,
                    name: 'Andrew Walker',
                    email: 'andrew.walker@company.com',
                    employeeId: 'EMP017',
                    department: 'Operations',
                    position: 'Operations Manager',
                    role: 'manager',
                    status: 'Active',
                    joinDate: '2024-04-05',
                    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 19,
                    name: 'Jennifer Hall',
                    email: 'jennifer.hall@company.com',
                    employeeId: 'EMP018',
                    department: 'HR',
                    position: 'Recruiter',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2024-05-18',
                    avatar: 'https://images.unsplash.com/photo-1488508872907-592763824245?w=150&h=150&fit=crop&crop=face'
                },
                {
                    id: 20,
                    name: 'Matthew Young',
                    email: 'matthew.young@company.com',
                    employeeId: 'EMP019',
                    department: 'IT',
                    position: 'System Analyst',
                    role: 'employee',
                    status: 'Active',
                    joinDate: '2024-06-25',
                    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face'
                }
            ];
            localStorage.setItem('attendsys_users', JSON.stringify(defaultUsers));
        }

        if (!localStorage.getItem('attendsys_leaves')) {
            const defaultLeaves = [
                {
                    id: 1,
                    employeeId: 1,
                    employeeName: 'John Doe',
                    type: 'Annual',
                    startDate: '2025-08-10',
                    endDate: '2025-08-12',
                    days: 3,
                    reason: 'Family vacation',
                    status: 'Pending',
                    requestDate: '2025-08-03',
                    avatar: '/api/placeholder/32/32'
                },
                {
                    id: 2,
                    employeeId: 2,
                    employeeName: 'Jane Smith',
                    type: 'Sick',
                    startDate: '2025-08-08',
                    endDate: '2025-08-09',
                    days: 2,
                    reason: 'Medical appointment',
                    status: 'Pending',
                    requestDate: '2025-08-02',
                    avatar: '/api/placeholder/32/32'
                },
                {
                    id: 3,
                    employeeId: 3,
                    employeeName: 'Mike Johnson',
                    type: 'Annual',
                    startDate: '2025-07-15',
                    endDate: '2025-07-16',
                    days: 2,
                    reason: 'Personal matters',
                    status: 'Approved',
                    requestDate: '2025-07-10',
                    avatar: '/api/placeholder/32/32'
                },
                {
                    id: 4,
                    employeeId: 4,
                    employeeName: 'Sarah Wilson',
                    type: 'Personal',
                    startDate: '2025-07-10',
                    endDate: '2025-07-10',
                    days: 1,
                    reason: 'Emergency',
                    status: 'Rejected',
                    requestDate: '2025-07-09',
                    avatar: '/api/placeholder/32/32'
                }
            ];
            localStorage.setItem('attendsys_leaves', JSON.stringify(defaultLeaves));
        }

        if (!localStorage.getItem('attendsys_attendance')) {
            const defaultAttendance = [
                {
                    id: 1,
                    employeeId: 1,
                    date: '2025-08-03',
                    checkIn: '09:15 AM',
                    checkOut: '05:30 PM',
                    breakTime: '1h 00m',
                    workingHours: '7h 15m',
                    status: 'Present'
                },
                {
                    id: 2,
                    employeeId: 1,
                    date: '2025-08-02',
                    checkIn: '09:05 AM',
                    checkOut: '05:00 PM',
                    breakTime: '1h 00m',
                    workingHours: '7h 55m',
                    status: 'Present'
                },
                {
                    id: 3,
                    employeeId: 1,
                    date: '2025-08-01',
                    checkIn: '09:25 AM',
                    checkOut: '05:15 PM',
                    breakTime: '1h 00m',
                    workingHours: '6h 50m',
                    status: 'Late'
                },
                {
                    id: 4,
                    employeeId: 1,
                    date: '2025-07-31',
                    checkIn: '--:--',
                    checkOut: '--:--',
                    breakTime: '--',
                    workingHours: '0h 00m',
                    status: 'Absent'
                }
            ];
            localStorage.setItem('attendsys_attendance', JSON.stringify(defaultAttendance));
        }
    }

    // Users Management
    getUsers() {
        return JSON.parse(localStorage.getItem('attendsys_users') || '[]');
    }

    addUser(user) {
        const users = this.getUsers();
        const newId = Math.max(...users.map(u => u.id), 0) + 1;
        const newUser = {
            id: newId,
            employeeId: user.employeeId || `EMP${String(newId).padStart(3, '0')}`,
            avatar: '/api/placeholder/48/48',
            ...user,
            joinDate: user.joinDate || new Date().toISOString().split('T')[0]
        };
        users.push(newUser);
        localStorage.setItem('attendsys_users', JSON.stringify(users));
        return newUser;
    }

    updateUser(id, updates) {
        const users = this.getUsers();
        // Convert id to number for comparison since IDs are stored as numbers
        const numericId = typeof id === 'string' ? parseInt(id) : id;
        const index = users.findIndex(u => u.id === numericId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('attendsys_users', JSON.stringify(users));
            return users[index];
        }
        console.warn('User not found with ID:', id, 'Numeric ID:', numericId);
        return null;
    }

    deleteUser(id) {
        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.id !== id);
        localStorage.setItem('attendsys_users', JSON.stringify(filteredUsers));
    }

    // Leave Requests Management
    getLeaveRequests() {
        return JSON.parse(localStorage.getItem('attendsys_leaves') || '[]');
    }

    addLeaveRequest(leave) {
        const leaves = this.getLeaveRequests();
        const newId = Math.max(...leaves.map(l => l.id), 0) + 1;
        
        // Get current user info
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const users = this.getUsers();
        const user = users.find(u => u.email === currentUser.email) || currentUser;
        
        const newLeave = {
            id: newId,
            employeeId: user.id || newId,
            employeeName: user.name || 'Unknown User',
            avatar: '/api/placeholder/32/32',
            status: 'Pending',
            requestDate: new Date().toISOString().split('T')[0],
            ...leave
        };
        
        leaves.push(newLeave);
        localStorage.setItem('attendsys_leaves', JSON.stringify(leaves));
        return newLeave;
    }

    updateLeaveRequest(id, updates) {
        const leaves = this.getLeaveRequests();
        const index = leaves.findIndex(l => l.id === id);
        if (index !== -1) {
            leaves[index] = { ...leaves[index], ...updates };
            localStorage.setItem('attendsys_leaves', JSON.stringify(leaves));
            return leaves[index];
        }
        return null;
    }

    approveLeaveRequest(id) {
        return this.updateLeaveRequest(id, { status: 'Approved' });
    }

    rejectLeaveRequest(id) {
        return this.updateLeaveRequest(id, { status: 'Rejected' });
    }

    // Attendance Management
    getAttendanceRecords() {
        return JSON.parse(localStorage.getItem('attendsys_attendance') || '[]');
    }

    addAttendanceRecord(record) {
        const attendance = this.getAttendanceRecords();
        const newId = Math.max(...attendance.map(a => a.id), 0) + 1;
        const newRecord = {
            id: newId,
            ...record
        };
        attendance.push(newRecord);
        localStorage.setItem('attendsys_attendance', JSON.stringify(attendance));
        return newRecord;
    }

    // Utility methods
    getUserStats() {
        const users = this.getUsers();
        return {
            total: users.length,
            active: users.filter(u => u.status === 'Active').length,
            admins: users.filter(u => u.role === 'admin').length,
            newThisMonth: users.filter(u => {
                const joinDate = new Date(u.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
            }).length
        };
    }

    getLeaveStats() {
        const leaves = this.getLeaveRequests();
        return {
            total: leaves.length,
            pending: leaves.filter(l => l.status === 'Pending').length,
            approved: leaves.filter(l => l.status === 'Approved').length,
            rejected: leaves.filter(l => l.status === 'Rejected').length
        };
    }

    // Format date for display
    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Calculate days between dates
    calculateDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    // Shifts Management
    getShifts() {
        return JSON.parse(localStorage.getItem('attendsys_shifts') || '[]');
    }

    addShift(shift) {
        const shifts = this.getShifts();
        const newId = Math.max(...shifts.map(s => s.id), 0) + 1;
        const newShift = {
            id: newId,
            ...shift,
            createdAt: new Date().toISOString()
        };
        shifts.push(newShift);
        localStorage.setItem('attendsys_shifts', JSON.stringify(shifts));
        return newShift;
    }

    removeShift(userId) {
        const shifts = this.getShifts();
        const updatedShifts = shifts.filter(shift => shift.employeeId !== userId);
        localStorage.setItem('attendsys_shifts', JSON.stringify(updatedShifts));
    }
}

// Create global instance
window.attendSysData = new AttendSysData();
