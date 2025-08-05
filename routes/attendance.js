const express = require('express');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Check in
router.post('/checkin', auth, 
  upload.single('checkInImage'), 
  handleUploadError,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const today = moment().startOf('day').toDate();
      const now = new Date();

      // Check if user already checked in today
      const existingAttendance = await Attendance.findOne({
        user: userId,
        date: today
      });

      if (existingAttendance && existingAttendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: 'You have already checked in today'
        });
      }

      // Get user's shift
      const user = await User.findById(userId).populate('shift');
      if (!user.shift) {
        return res.status(400).json({
          success: false,
          message: 'No shift assigned to user'
        });
      }

      const shift = user.shift;
      
      // Calculate if user is late
      const shiftStartTime = moment(today).add(moment.duration(shift.startTime));
      const isLate = moment(now).isAfter(shiftStartTime.add(shift.lateThreshold, 'minutes'));
      const lateMinutes = isLate ? moment(now).diff(shiftStartTime, 'minutes') : 0;

      const checkInData = {
        time: now,
        ipAddress: req.ip,
        device: req.headers['user-agent']
      };

      // Add location if provided
      if (req.body.latitude && req.body.longitude) {
        checkInData.location = {
          latitude: parseFloat(req.body.latitude),
          longitude: parseFloat(req.body.longitude),
          address: req.body.address
        };
      }

      // Add image if uploaded
      if (req.file) {
        checkInData.image = req.file.path;
      }

      let attendance;
      if (existingAttendance) {
        // Update existing attendance record
        existingAttendance.checkIn = checkInData;
        existingAttendance.isLate = isLate;
        existingAttendance.lateMinutes = lateMinutes;
        existingAttendance.status = isLate ? 'late' : 'present';
        attendance = await existingAttendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          user: userId,
          date: today,
          shift: shift._id,
          checkIn: checkInData,
          isLate,
          lateMinutes,
          status: isLate ? 'late' : 'present'
        });
        await attendance.save();
      }

      await attendance.populate('user', 'firstName lastName employeeId');
      await attendance.populate('shift', 'name startTime endTime');

      res.json({
        success: true,
        message: `Checked in successfully${isLate ? ' (Late)' : ''}`,
        attendance
      });
    } catch (error) {
      console.error('Check in error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Check out
router.post('/checkout', auth, 
  upload.single('checkOutImage'), 
  handleUploadError,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const today = moment().startOf('day').toDate();
      const now = new Date();

      // Find today's attendance record
      const attendance = await Attendance.findOne({
        user: userId,
        date: today
      }).populate('shift');

      if (!attendance || !attendance.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: 'You must check in first'
        });
      }

      if (attendance.checkOut.time) {
        return res.status(400).json({
          success: false,
          message: 'You have already checked out today'
        });
      }

      const checkOutData = {
        time: now,
        ipAddress: req.ip,
        device: req.headers['user-agent']
      };

      // Add location if provided
      if (req.body.latitude && req.body.longitude) {
        checkOutData.location = {
          latitude: parseFloat(req.body.latitude),
          longitude: parseFloat(req.body.longitude),
          address: req.body.address
        };
      }

      // Add image if uploaded
      if (req.file) {
        checkOutData.image = req.file.path;
      }

      attendance.checkOut = checkOutData;
      
      // The working hours will be calculated automatically in the pre-save middleware
      await attendance.save();

      await attendance.populate('user', 'firstName lastName employeeId');

      res.json({
        success: true,
        message: 'Checked out successfully',
        attendance
      });
    } catch (error) {
      console.error('Check out error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Add break
router.post('/break/start', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day').toDate();
    const now = new Date();

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        message: 'You must check in first'
      });
    }

    // Check if there's an active break
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active break'
      });
    }

    attendance.breaks.push({
      startTime: now,
      type: req.body.type || 'other',
      notes: req.body.notes
    });

    await attendance.save();

    res.json({
      success: true,
      message: 'Break started successfully',
      break: attendance.breaks[attendance.breaks.length - 1]
    });
  } catch (error) {
    console.error('Start break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// End break
router.post('/break/end', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day').toDate();
    const now = new Date();

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }

    // Find active break
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) {
      return res.status(400).json({
        success: false,
        message: 'No active break found'
      });
    }

    activeBreak.endTime = now;
    activeBreak.duration = Math.floor((now - activeBreak.startTime) / (1000 * 60)); // duration in minutes

    await attendance.save();

    res.json({
      success: true,
      message: 'Break ended successfully',
      break: activeBreak
    });
  } catch (error) {
    console.error('End break error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's attendance records
router.get('/user/:userId', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    
    // Date filtering
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: moment(req.query.startDate).startOf('day').toDate(),
        $lte: moment(req.query.endDate).endOf('day').toDate()
      };
    } else if (req.query.month && req.query.year) {
      const startOfMonth = moment(`${req.query.year}-${req.query.month}`, 'YYYY-MM').startOf('month');
      const endOfMonth = moment(`${req.query.year}-${req.query.month}`, 'YYYY-MM').endOf('month');
      filter.date = {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate()
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('shift', 'name startTime endTime')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      attendance,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get today's attendance status
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day').toDate();

    const attendance = await Attendance.findOne({
      user: userId,
      date: today
    }).populate('shift', 'name startTime endTime');

    // Get user's shift info
    const user = await User.findById(userId).populate('shift');

    res.json({
      success: true,
      attendance,
      shift: user.shift,
      hasCheckedIn: attendance && attendance.checkIn.time,
      hasCheckedOut: attendance && attendance.checkOut.time,
      activeBreak: attendance ? attendance.breaks.find(b => !b.endTime) : null
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all attendance records (admin/hr only)
router.get('/', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Date filtering
    if (req.query.date) {
      const queryDate = moment(req.query.date);
      filter.date = {
        $gte: queryDate.startOf('day').toDate(),
        $lte: queryDate.endOf('day').toDate()
      };
    }

    if (req.query.department) {
      const departmentUsers = await User.find({ department: req.query.department }).select('_id');
      filter.user = { $in: departmentUsers.map(u => u._id) };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const attendance = await Attendance.find(filter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('shift', 'name startTime endTime')
      .sort({ date: -1, 'checkIn.time': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      attendance,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update attendance record (admin/hr only)
router.put('/:id', auth, authorize('admin', 'hr'), [
  body('status').optional().isIn(['present', 'absent', 'late', 'half-day', 'overtime']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.notes) updates.notes = req.body.notes;
    if (req.body.approvedBy) updates.approvedBy = req.user._id;
    if (req.body.approvedBy) updates.approvedAt = new Date();

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('user', 'firstName lastName employeeId')
     .populate('shift', 'name startTime endTime');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
