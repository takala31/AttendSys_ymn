const express = require('express');
const moment = require('moment');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Shift = require('../models/Shift');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().add(1, 'day').startOf('day').toDate();
    const thisMonth = moment().startOf('month').toDate();
    const nextMonth = moment().add(1, 'month').startOf('month').toDate();

    let dashboardData = {};

    if (['admin', 'hr'].includes(userRole)) {
      // Admin/HR Dashboard
      dashboardData = {
        // User Statistics
        totalEmployees: await User.countDocuments({ isActive: true }),
        newEmployeesThisMonth: await User.countDocuments({
          isActive: true,
          createdAt: { $gte: thisMonth, $lt: nextMonth }
        }),

        // Today's Attendance
        todayAttendance: {
          present: await Attendance.countDocuments({
            date: today,
            'checkIn.time': { $exists: true }
          }),
          absent: await User.countDocuments({ isActive: true }) - 
                 await Attendance.countDocuments({
                   date: today,
                   'checkIn.time': { $exists: true }
                 }),
          late: await Attendance.countDocuments({
            date: today,
            isLate: true
          }),
          onBreak: await Attendance.countDocuments({
            date: today,
            'breaks': {
              $elemMatch: {
                startTime: { $exists: true },
                endTime: { $exists: false }
              }
            }
          })
        },

        // Leave Statistics
        leaveRequests: {
          pending: await Leave.countDocuments({ status: 'pending' }),
          approvedThisMonth: await Leave.countDocuments({
            status: 'approved',
            startDate: { $gte: thisMonth, $lt: nextMonth }
          }),
          totalThisMonth: await Leave.countDocuments({
            startDate: { $gte: thisMonth, $lt: nextMonth }
          })
        },

        // Recent Activities
        recentCheckIns: await Attendance.find({
          date: today,
          'checkIn.time': { $exists: true }
        })
        .populate('user', 'firstName lastName employeeId')
        .sort({ 'checkIn.time': -1 })
        .limit(5),

        pendingLeaves: await Leave.find({ status: 'pending' })
        .populate('user', 'firstName lastName employeeId department')
        .sort({ appliedDate: 1 })
        .limit(5)
      };

    } else {
      // Employee Dashboard
      const userAttendanceToday = await Attendance.findOne({
        user: userId,
        date: today
      }).populate('shift');

      const thisMonthAttendance = await Attendance.find({
        user: userId,
        date: { $gte: thisMonth, $lt: nextMonth }
      });

      const userLeaves = await Leave.find({
        user: userId,
        startDate: { $gte: thisMonth, $lt: nextMonth }
      });

      dashboardData = {
        // Today's Status
        todayStatus: {
          hasCheckedIn: userAttendanceToday && userAttendanceToday.checkIn.time,
          hasCheckedOut: userAttendanceToday && userAttendanceToday.checkOut.time,
          checkInTime: userAttendanceToday?.checkIn.time,
          checkOutTime: userAttendanceToday?.checkOut.time,
          isLate: userAttendanceToday?.isLate || false,
          lateMinutes: userAttendanceToday?.lateMinutes || 0,
          workingHours: userAttendanceToday?.formattedWorkingHours || '0h 0m',
          activeBreak: userAttendanceToday?.breaks.find(b => !b.endTime),
          shift: userAttendanceToday?.shift
        },

        // Monthly Statistics
        monthlyStats: {
          totalWorkingDays: thisMonthAttendance.length,
          presentDays: thisMonthAttendance.filter(a => a.checkIn.time).length,
          lateDays: thisMonthAttendance.filter(a => a.isLate).length,
          totalWorkingHours: thisMonthAttendance.reduce((total, a) => total + (a.workingHours || 0), 0),
          averageWorkingHours: thisMonthAttendance.length > 0 ? 
            Math.round(thisMonthAttendance.reduce((total, a) => total + (a.workingHours || 0), 0) / thisMonthAttendance.length) : 0
        },

        // Leave Information
        leaveInfo: {
          totalThisMonth: userLeaves.length,
          pendingRequests: userLeaves.filter(l => l.status === 'pending').length,
          approvedDays: userLeaves
            .filter(l => l.status === 'approved')
            .reduce((total, l) => total + l.totalDays, 0),
          upcomingLeaves: await Leave.find({
            user: userId,
            status: 'approved',
            startDate: { $gte: tomorrow }
          }).sort({ startDate: 1 }).limit(3)
        },

        // Recent Attendance
        recentAttendance: await Attendance.find({
          user: userId
        })
        .populate('shift', 'name')
        .sort({ date: -1 })
        .limit(7)
      };
    }

    res.json({
      success: true,
      dashboard: dashboardData,
      user: {
        name: req.user.fullName,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get attendance analytics (admin/hr/manager only)
router.get('/analytics/attendance', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = moment().subtract(days, 'days').startOf('day').toDate();
    const endDate = moment().endOf('day').toDate();

    // Daily attendance trends
    const dailyAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          present: {
            $sum: { $cond: [{ $exists: '$checkIn.time' }, 1, 0] }
          },
          late: {
            $sum: { $cond: ['$isLate', 1, 0] }
          },
          totalHours: { $sum: '$workingHours' },
          averageHours: { $avg: '$workingHours' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Department-wise attendance
    const departmentAttendance = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'attendances',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                date: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'attendances'
        }
      },
      {
        $group: {
          _id: '$department',
          totalEmployees: { $sum: 1 },
          totalAttendance: { $sum: { $size: '$attendances' } },
          presentDays: {
            $sum: {
              $size: {
                $filter: {
                  input: '$attendances',
                  cond: { $exists: '$$this.checkIn.time' }
                }
              }
            }
          },
          lateDays: {
            $sum: {
              $size: {
                $filter: {
                  input: '$attendances',
                  cond: { $eq: ['$$this.isLate', true] }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          totalEmployees: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$presentDays', { $multiply: ['$totalEmployees', days] }] },
              100
            ]
          },
          lateRate: {
            $multiply: [
              { $divide: ['$lateDays', '$presentDays'] },
              100
            ]
          }
        }
      }
    ]);

    // Top performers (by attendance rate)
    const topPerformers = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'attendances',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                date: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'attendances'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          employeeId: 1,
          department: 1,
          totalDays: { $size: '$attendances' },
          presentDays: {
            $size: {
              $filter: {
                input: '$attendances',
                cond: { $exists: '$$this.checkIn.time' }
              }
            }
          },
          attendanceRate: {
            $multiply: [
              { 
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: '$attendances',
                        cond: { $exists: '$$this.checkIn.time' }
                      }
                    }
                  },
                  { $max: [{ $size: '$attendances' }, 1] }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { attendanceRate: -1, presentDays: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      analytics: {
        period: {
          startDate,
          endDate,
          days
        },
        dailyTrends: dailyAttendance,
        departmentWise: departmentAttendance,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Attendance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get leave analytics (admin/hr/manager only)
router.get('/analytics/leaves', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Monthly leave trends
    const monthlyLeaves = await Leave.aggregate([
      {
        $match: {
          startDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$startDate' },
            status: '$status'
          },
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Leave types distribution
    const leaveTypes = await Leave.aggregate([
      {
        $match: {
          startDate: { $gte: startDate, $lte: endDate },
          status: { $in: ['approved', 'pending'] }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalDays: -1 } }
    ]);

    // Department-wise leave usage
    const departmentLeaves = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'leaves',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                startDate: { $gte: startDate, $lte: endDate },
                status: 'approved'
              }
            }
          ],
          as: 'leaves'
        }
      },
      {
        $group: {
          _id: '$department',
          totalEmployees: { $sum: 1 },
          totalLeaves: { $sum: { $size: '$leaves' } },
          totalDays: {
            $sum: {
              $reduce: {
                input: '$leaves',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.totalDays'] }
              }
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          totalEmployees: 1,
          averageLeaveDays: {
            $divide: ['$totalDays', { $max: ['$totalEmployees', 1] }]
          },
          totalLeaves: 1,
          totalDays: 1
        }
      },
      { $sort: { averageLeaveDays: -1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        year,
        monthlyTrends: monthlyLeaves,
        leaveTypes,
        departmentWise: departmentLeaves
      }
    });
  } catch (error) {
    console.error('Leave analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get real-time statistics (admin/hr only)
router.get('/realtime', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const now = new Date();

    // Current status
    const currentStats = {
      // Currently present employees
      currentlyPresent: await Attendance.countDocuments({
        date: today,
        'checkIn.time': { $exists: true },
        'checkOut.time': { $exists: false }
      }),

      // On break
      onBreak: await Attendance.countDocuments({
        date: today,
        'breaks': {
          $elemMatch: {
            startTime: { $exists: true },
            endTime: { $exists: false }
          }
        }
      }),

      // Late arrivals today
      lateToday: await Attendance.countDocuments({
        date: today,
        isLate: true
      }),

      // Pending leave requests
      pendingLeaves: await Leave.countDocuments({ status: 'pending' })
    };

    // Recent activities (last 10)
    const recentActivities = await Attendance.find({
      date: today,
      $or: [
        { 'checkIn.time': { $gte: moment().subtract(2, 'hours').toDate() } },
        { 'checkOut.time': { $gte: moment().subtract(2, 'hours').toDate() } }
      ]
    })
    .populate('user', 'firstName lastName employeeId')
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('user checkIn checkOut isLate');

    // Employees currently on leave
    const onLeaveToday = await Leave.find({
      status: 'approved',
      startDate: { $lte: now },
      endDate: { $gte: today }
    })
    .populate('user', 'firstName lastName employeeId department')
    .select('user type startDate endDate');

    res.json({
      success: true,
      realtime: {
        currentStats,
        recentActivities: recentActivities.map(activity => ({
          user: activity.user,
          action: activity.checkOut.time ? 'checkout' : 'checkin',
          time: activity.checkOut.time || activity.checkIn.time,
          isLate: activity.isLate
        })),
        onLeaveToday,
        lastUpdated: now
      }
    });
  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
