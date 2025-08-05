const express = require('express');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, authorize, authorizeOwnerOrAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// Apply for leave
router.post('/', auth,
  upload.array('leaveAttachment', 3),
  handleUploadError,
  [
    body('type').isIn(['sick', 'vacation', 'personal', 'maternity', 'paternity', 'emergency', 'bereavement', 'other']),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('reason').notEmpty().withMessage('Reason is required').isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        type,
        startDate,
        endDate,
        reason,
        isHalfDay,
        halfDayPeriod,
        contactDuringLeave,
        handoverNotes,
        replacementEmployee
      } = req.body;

      // Validate dates
      const start = moment(startDate);
      const end = moment(endDate);

      if (end.isBefore(start)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }

      // Check for overlapping leave requests
      const overlapping = await Leave.findOne({
        user: req.user._id,
        status: { $in: ['pending', 'approved'] },
        $or: [
          {
            startDate: { $lte: end.toDate() },
            endDate: { $gte: start.toDate() }
          }
        ]
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: 'You already have a leave request for this period'
        });
      }

      // Prepare attachments
      const attachments = req.files ? req.files.map(file => ({
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size
      })) : [];

      const leave = new Leave({
        user: req.user._id,
        type,
        startDate: start.toDate(),
        endDate: end.toDate(),
        reason,
        isHalfDay: isHalfDay === 'true',
        halfDayPeriod,
        contactDuringLeave: contactDuringLeave ? JSON.parse(contactDuringLeave) : undefined,
        handoverNotes,
        replacementEmployee,
        attachments
      });

      await leave.save();
      await leave.populate('user', 'firstName lastName employeeId');
      await leave.populate('replacementEmployee', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        leave
      });
    } catch (error) {
      console.error('Apply leave error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
);

// Get user's leave requests
router.get('/user/:userId', auth, authorizeOwnerOrAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.year) {
      const year = parseInt(req.query.year);
      filter.startDate = {
        $gte: moment().year(year).startOf('year').toDate(),
        $lte: moment().year(year).endOf('year').toDate()
      };
    }

    const leaves = await Leave.find(filter)
      .populate('reviewedBy', 'firstName lastName')
      .populate('replacementEmployee', 'firstName lastName')
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(filter);

    // Calculate leave statistics
    const stats = await Leave.aggregate([
      { $match: { user: userId, status: 'approved' } },
      {
        $group: {
          _id: '$type',
          totalDays: { $sum: '$totalDays' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      leaves,
      stats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get user leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all leave requests (admin/hr/manager only)
router.get('/', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.department) {
      const departmentUsers = await User.find({ department: req.query.department }).select('_id');
      filter.user = { $in: departmentUsers.map(u => u._id) };
    }

    if (req.query.startDate && req.query.endDate) {
      filter.startDate = {
        $gte: moment(req.query.startDate).toDate(),
        $lte: moment(req.query.endDate).toDate()
      };
    }

    const leaves = await Leave.find(filter)
      .populate('user', 'firstName lastName employeeId department')
      .populate('reviewedBy', 'firstName lastName')
      .populate('replacementEmployee', 'firstName lastName')
      .sort({ appliedDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      leaves,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get pending leave requests for approval
router.get('/pending', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const filter = { status: 'pending' };

    // If manager, only show leaves from their team
    if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user._id }).select('_id');
      filter.user = { $in: teamMembers.map(u => u._id) };
    }

    const leaves = await Leave.find(filter)
      .populate('user', 'firstName lastName employeeId department position')
      .populate('replacementEmployee', 'firstName lastName')
      .sort({ appliedDate: 1 });

    res.json({
      success: true,
      leaves
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Approve/Reject leave request
router.put('/:id/review', auth, authorize('admin', 'hr', 'manager'), [
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewComments').optional().isLength({ max: 500 })
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

    const { status, reviewComments } = req.body;

    const leave = await Leave.findById(req.params.id).populate('user');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been reviewed'
      });
    }

    // Check if manager is trying to approve their own leave
    if (req.user._id.toString() === leave.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot review your own leave request'
      });
    }

    // If manager, check if they can approve this leave
    if (req.user.role === 'manager') {
      const canApprove = await User.findOne({
        _id: leave.user._id,
        manager: req.user._id
      });

      if (!canApprove) {
        return res.status(403).json({
          success: false,
          message: 'You can only review leaves from your team members'
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.reviewComments = reviewComments;

    await leave.save();
    await leave.populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error('Review leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel leave request
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user owns this leave request or is admin/hr
    if (leave.user.toString() !== req.user._id.toString() && 
        !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    if (leave.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already cancelled'
      });
    }

    // Check if leave has already started
    const today = moment().startOf('day');
    const leaveStart = moment(leave.startDate).startOf('day');
    
    if (today.isAfter(leaveStart)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel leave that has already started'
      });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      leave
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get leave statistics
router.get('/stats/overview', auth, authorize('admin', 'hr'), async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const stats = await Leave.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            type: '$type'
          },
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    const monthlyStats = await Leave.aggregate([
      {
        $match: {
          startDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
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
      }
    ]);

    res.json({
      success: true,
      stats: {
        overall: stats,
        monthly: monthlyStats,
        year: currentYear
      }
    });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
