const express = require('express');
const moment = require('moment');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Generate attendance report
router.get('/attendance', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      userId,
      format = 'json'
    } = req.query;

    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();

    if (moment(end).isBefore(moment(start))) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Build query
    let userFilter = { isActive: true };
    let attendanceFilter = {
      date: { $gte: start, $lte: end }
    };

    if (department) {
      userFilter.department = department;
    }

    if (userId) {
      userFilter._id = userId;
      attendanceFilter.user = userId;
    }

    // Get users based on filter
    const users = await User.find(userFilter).select('firstName lastName employeeId department');
    
    if (userId && users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!userId) {
      const userIds = users.map(u => u._id);
      attendanceFilter.user = { $in: userIds };
    }

    // Get attendance data
    const attendanceRecords = await Attendance.find(attendanceFilter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('shift', 'name startTime endTime')
      .sort({ date: 1, 'checkIn.time': 1 });

    // Process data for report
    const reportData = users.map(user => {
      const userAttendance = attendanceRecords.filter(
        record => record.user._id.toString() === user._id.toString()
      );

      const totalDays = userAttendance.length;
      const presentDays = userAttendance.filter(record => record.checkIn.time).length;
      const absentDays = totalDays - presentDays;
      const lateDays = userAttendance.filter(record => record.isLate).length;
      const totalWorkingHours = userAttendance.reduce((sum, record) => sum + (record.workingHours || 0), 0);
      const totalOvertimeHours = userAttendance.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);

      return {
        user: {
          employeeId: user.employeeId,
          name: `${user.firstName} ${user.lastName}`,
          department: user.department
        },
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
          totalWorkingHours: Math.round(totalWorkingHours / 60 * 100) / 100, // Convert to hours
          totalOvertimeHours: Math.round(totalOvertimeHours / 60 * 100) / 100,
          averageWorkingHours: presentDays > 0 ? Math.round((totalWorkingHours / presentDays) / 60 * 100) / 100 : 0
        },
        details: userAttendance.map(record => ({
          date: moment(record.date).format('YYYY-MM-DD'),
          shift: record.shift ? record.shift.name : 'No Shift',
          checkIn: record.checkIn.time ? moment(record.checkIn.time).format('HH:mm:ss') : null,
          checkOut: record.checkOut.time ? moment(record.checkOut.time).format('HH:mm:ss') : null,
          workingHours: record.workingHours ? Math.round(record.workingHours / 60 * 100) / 100 : 0,
          overtimeHours: record.overtimeHours ? Math.round(record.overtimeHours / 60 * 100) / 100 : 0,
          status: record.status,
          isLate: record.isLate,
          lateMinutes: record.lateMinutes || 0,
          breaks: record.breaks.map(breakItem => ({
            type: breakItem.type,
            duration: breakItem.duration || 0,
            startTime: breakItem.startTime ? moment(breakItem.startTime).format('HH:mm:ss') : null,
            endTime: breakItem.endTime ? moment(breakItem.endTime).format('HH:mm:ss') : null
          }))
        }))
      };
    });

    // Calculate overall statistics
    const overallStats = {
      totalEmployees: reportData.length,
      averageAttendanceRate: reportData.length > 0 ? 
        Math.round(reportData.reduce((sum, emp) => sum + emp.summary.attendanceRate, 0) / reportData.length) : 0,
      totalPresentDays: reportData.reduce((sum, emp) => sum + emp.summary.presentDays, 0),
      totalAbsentDays: reportData.reduce((sum, emp) => sum + emp.summary.absentDays, 0),
      totalLateDays: reportData.reduce((sum, emp) => sum + emp.summary.lateDays, 0),
      totalWorkingHours: reportData.reduce((sum, emp) => sum + emp.summary.totalWorkingHours, 0),
      totalOvertimeHours: reportData.reduce((sum, emp) => sum + emp.summary.totalOvertimeHours, 0)
    };

    const report = {
      period: {
        startDate: moment(start).format('YYYY-MM-DD'),
        endDate: moment(end).format('YYYY-MM-DD'),
        totalDays: moment(end).diff(moment(start), 'days') + 1
      },
      filters: {
        department: department || 'All',
        userId: userId || 'All'
      },
      overallStats,
      employeeData: reportData,
      generatedAt: new Date(),
      generatedBy: {
        name: req.user.fullName,
        employeeId: req.user.employeeId
      }
    };

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Generate leave report
router.get('/leaves', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      department,
      userId,
      status,
      type
    } = req.query;

    // Build query
    let userFilter = { isActive: true };
    let leaveFilter = {};

    if (startDate && endDate) {
      leaveFilter.startDate = {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      };
    }

    if (department) {
      userFilter.department = department;
    }

    if (userId) {
      userFilter._id = userId;
      leaveFilter.user = userId;
    }

    if (status) {
      leaveFilter.status = status;
    }

    if (type) {
      leaveFilter.type = type;
    }

    // Get users and their leaves
    const users = await User.find(userFilter).select('firstName lastName employeeId department');
    
    if (!userId) {
      const userIds = users.map(u => u._id);
      leaveFilter.user = { $in: userIds };
    }

    const leaves = await Leave.find(leaveFilter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('reviewedBy', 'firstName lastName')
      .populate('replacementEmployee', 'firstName lastName')
      .sort({ startDate: -1 });

    // Process data for report
    const reportData = users.map(user => {
      const userLeaves = leaves.filter(
        leave => leave.user._id.toString() === user._id.toString()
      );

      const leaveStats = userLeaves.reduce((stats, leave) => {
        stats.total++;
        stats.totalDays += leave.totalDays;
        stats[leave.status] = (stats[leave.status] || 0) + 1;
        stats.byType[leave.type] = (stats.byType[leave.type] || 0) + leave.totalDays;
        return stats;
      }, {
        total: 0,
        totalDays: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        byType: {}
      });

      return {
        user: {
          employeeId: user.employeeId,
          name: `${user.firstName} ${user.lastName}`,
          department: user.department
        },
        summary: leaveStats,
        leaves: userLeaves.map(leave => ({
          type: leave.type,
          startDate: moment(leave.startDate).format('YYYY-MM-DD'),
          endDate: moment(leave.endDate).format('YYYY-MM-DD'),
          totalDays: leave.totalDays,
          reason: leave.reason,
          status: leave.status,
          appliedDate: moment(leave.appliedDate).format('YYYY-MM-DD'),
          reviewedBy: leave.reviewedBy ? `${leave.reviewedBy.firstName} ${leave.reviewedBy.lastName}` : null,
          reviewedAt: leave.reviewedAt ? moment(leave.reviewedAt).format('YYYY-MM-DD') : null,
          reviewComments: leave.reviewComments,
          replacementEmployee: leave.replacementEmployee ? 
            `${leave.replacementEmployee.firstName} ${leave.replacementEmployee.lastName}` : null
        }))
      };
    });

    // Calculate overall statistics
    const overallStats = leaves.reduce((stats, leave) => {
      stats.total++;
      stats.totalDays += leave.totalDays;
      stats[leave.status] = (stats[leave.status] || 0) + 1;
      stats.byType[leave.type] = (stats.byType[leave.type] || 0) + leave.totalDays;
      return stats;
    }, {
      total: 0,
      totalDays: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      byType: {}
    });

    const report = {
      period: startDate && endDate ? {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
      } : null,
      filters: {
        department: department || 'All',
        userId: userId || 'All',
        status: status || 'All',
        type: type || 'All'
      },
      overallStats,
      employeeData: reportData,
      generatedAt: new Date(),
      generatedBy: {
        name: req.user.fullName,
        employeeId: req.user.employeeId
      }
    };

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Leave report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Generate monthly summary report
router.get('/monthly-summary', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { month, year, department } = req.query;
    
    const targetMonth = month || (new Date().getMonth() + 1);
    const targetYear = year || new Date().getFullYear();

    const startDate = moment(`${targetYear}-${targetMonth}`, 'YYYY-MM').startOf('month').toDate();
    const endDate = moment(`${targetYear}-${targetMonth}`, 'YYYY-MM').endOf('month').toDate();

    // Build user filter
    let userFilter = { isActive: true };
    if (department) {
      userFilter.department = department;
    }

    const users = await User.find(userFilter).populate('shift');
    const userIds = users.map(u => u._id);

    // Get attendance data
    const attendanceData = await Attendance.find({
      user: { $in: userIds },
      date: { $gte: startDate, $lte: endDate }
    }).populate('user shift');

    // Get leave data
    const leaveData = await Leave.find({
      user: { $in: userIds },
      status: 'approved',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    }).populate('user');

    // Calculate working days in the month
    const workingDays = moment(endDate).diff(moment(startDate), 'days') + 1;

    // Process data for each user
    const summary = users.map(user => {
      const userAttendance = attendanceData.filter(a => 
        a.user._id.toString() === user._id.toString()
      );
      
      const userLeaves = leaveData.filter(l => 
        l.user._id.toString() === user._id.toString()
      );

      // Calculate leave days that fall within the month
      const leaveDaysInMonth = userLeaves.reduce((total, leave) => {
        const leaveStart = moment.max(moment(leave.startDate), moment(startDate));
        const leaveEnd = moment.min(moment(leave.endDate), moment(endDate));
        const days = leaveEnd.diff(leaveStart, 'days') + 1;
        return total + Math.max(0, days);
      }, 0);

      const presentDays = userAttendance.filter(a => a.checkIn.time).length;
      const absentDays = workingDays - presentDays - leaveDaysInMonth;
      const lateDays = userAttendance.filter(a => a.isLate).length;
      const totalWorkingHours = userAttendance.reduce((sum, a) => sum + (a.workingHours || 0), 0);
      const totalOvertimeHours = userAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      return {
        user: {
          employeeId: user.employeeId,
          name: `${user.firstName} ${user.lastName}`,
          department: user.department,
          shift: user.shift ? user.shift.name : 'No Shift'
        },
        summary: {
          workingDays,
          presentDays,
          absentDays,
          leaveDays: leaveDaysInMonth,
          lateDays,
          attendanceRate: workingDays > 0 ? Math.round(((presentDays + leaveDaysInMonth) / workingDays) * 100) : 0,
          totalWorkingHours: Math.round(totalWorkingHours / 60 * 100) / 100,
          totalOvertimeHours: Math.round(totalOvertimeHours / 60 * 100) / 100,
          averageWorkingHours: presentDays > 0 ? Math.round((totalWorkingHours / presentDays) / 60 * 100) / 100 : 0
        },
        leaves: userLeaves.map(leave => ({
          type: leave.type,
          startDate: moment(leave.startDate).format('YYYY-MM-DD'),
          endDate: moment(leave.endDate).format('YYYY-MM-DD'),
          totalDays: leave.totalDays,
          daysInMonth: Math.max(0, moment.min(moment(leave.endDate), moment(endDate))
            .diff(moment.max(moment(leave.startDate), moment(startDate)), 'days') + 1)
        }))
      };
    });

    // Calculate department-wise statistics
    const departmentStats = {};
    summary.forEach(emp => {
      const dept = emp.user.department;
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          totalEmployees: 0,
          totalPresentDays: 0,
          totalAbsentDays: 0,
          totalLeaveDays: 0,
          totalLateDays: 0,
          totalWorkingHours: 0,
          totalOvertimeHours: 0
        };
      }
      
      const stats = departmentStats[dept];
      stats.totalEmployees++;
      stats.totalPresentDays += emp.summary.presentDays;
      stats.totalAbsentDays += emp.summary.absentDays;
      stats.totalLeaveDays += emp.summary.leaveDays;
      stats.totalLateDays += emp.summary.lateDays;
      stats.totalWorkingHours += emp.summary.totalWorkingHours;
      stats.totalOvertimeHours += emp.summary.totalOvertimeHours;
    });

    // Calculate average rates for departments
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      stats.averageAttendanceRate = Math.round(
        ((stats.totalPresentDays + stats.totalLeaveDays) / (stats.totalEmployees * workingDays)) * 100
      );
    });

    const report = {
      period: {
        month: parseInt(targetMonth),
        year: parseInt(targetYear),
        monthName: moment(`${targetYear}-${targetMonth}`, 'YYYY-MM').format('MMMM YYYY'),
        workingDays
      },
      filters: {
        department: department || 'All'
      },
      departmentStats,
      employeeSummary: summary,
      generatedAt: new Date(),
      generatedBy: {
        name: req.user.fullName,
        employeeId: req.user.employeeId
      }
    };

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Monthly summary report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get available departments for filtering
router.get('/departments', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const departments = await User.distinct('department', { isActive: true });
    res.json({
      success: true,
      departments: departments.sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
