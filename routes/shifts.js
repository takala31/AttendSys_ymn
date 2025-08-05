const express = require('express');
const { body, validationResult } = require('express-validator');
const Shift = require('../models/Shift');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all shifts
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const shifts = await Shift.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      shifts
    });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get shift by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Get employees assigned to this shift
    const employees = await User.find({ shift: shift._id })
      .select('firstName lastName employeeId department');

    res.json({
      success: true,
      shift: {
        ...shift.toObject(),
        employees
      }
    });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new shift (admin/hr only)
router.post('/', auth, authorize('admin', 'hr'), [
  body('name').notEmpty().withMessage('Shift name is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('workingDays').isArray().withMessage('Working days must be an array'),
  body('breakDuration').optional().isInt({ min: 0 }).withMessage('Break duration must be a positive number'),
  body('lateThreshold').optional().isInt({ min: 0 }).withMessage('Late threshold must be a positive number')
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

    const {
      name,
      description,
      startTime,
      endTime,
      workingDays,
      breakDuration,
      lateThreshold,
      overTimeThreshold,
      color
    } = req.body;

    // Check if shift name already exists
    const existingShift = await Shift.findOne({ name });
    if (existingShift) {
      return res.status(400).json({
        success: false,
        message: 'Shift with this name already exists'
      });
    }

    // Validate working days
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const invalidDays = workingDays.filter(day => !validDays.includes(day.toLowerCase()));
    
    if (invalidDays.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid working days: ${invalidDays.join(', ')}`
      });
    }

    const shift = new Shift({
      name,
      description,
      startTime,
      endTime,
      workingDays: workingDays.map(day => day.toLowerCase()),
      breakDuration: breakDuration || 60,
      lateThreshold: lateThreshold || 15,
      overTimeThreshold: overTimeThreshold || 480,
      color: color || '#3498db'
    });

    await shift.save();

    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      shift
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update shift (admin/hr only)
router.put('/:id', auth, authorize('admin', 'hr'), [
  body('name').optional().notEmpty().withMessage('Shift name cannot be empty'),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:MM format'),
  body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:MM format'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('breakDuration').optional().isInt({ min: 0 }).withMessage('Break duration must be a positive number'),
  body('lateThreshold').optional().isInt({ min: 0 }).withMessage('Late threshold must be a positive number')
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

    const updates = req.body;

    // If name is being updated, check for duplicates
    if (updates.name) {
      const existingShift = await Shift.findOne({ 
        name: updates.name, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingShift) {
        return res.status(400).json({
          success: false,
          message: 'Shift with this name already exists'
        });
      }
    }

    // Validate working days if provided
    if (updates.workingDays) {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const invalidDays = updates.workingDays.filter(day => !validDays.includes(day.toLowerCase()));
      
      if (invalidDays.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid working days: ${invalidDays.join(', ')}`
        });
      }
      
      updates.workingDays = updates.workingDays.map(day => day.toLowerCase());
    }

    const shift = await Shift.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    res.json({
      success: true,
      message: 'Shift updated successfully',
      shift
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete shift (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Check if any users are assigned to this shift
    const usersWithShift = await User.countDocuments({ shift: req.params.id });
    
    if (usersWithShift > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete shift. ${usersWithShift} user(s) are assigned to this shift. Please reassign them first.`
      });
    }

    await Shift.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Assign users to shift (admin/hr only)
router.post('/:id/assign-users', auth, authorize('admin', 'hr'), [
  body('userIds').isArray().withMessage('User IDs must be an array'),
  body('userIds.*').isMongoId().withMessage('Invalid user ID format')
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

    const { userIds } = req.body;
    const shiftId = req.params.id;

    // Verify shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Update users with the new shift
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { shift: shiftId }
    );

    // Get updated users
    const updatedUsers = await User.find({ _id: { $in: userIds } })
      .select('firstName lastName employeeId department');

    res.json({
      success: true,
      message: `${result.modifiedCount} user(s) assigned to shift successfully`,
      users: updatedUsers
    });
  } catch (error) {
    console.error('Assign users to shift error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get shift statistics
router.get('/:id/stats', auth, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const shiftId = req.params.id;
    
    // Verify shift exists
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({
        success: false,
        message: 'Shift not found'
      });
    }

    // Get total users assigned to this shift
    const totalUsers = await User.countDocuments({ shift: shiftId, isActive: true });

    // Get attendance statistics for this shift (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await User.aggregate([
      { $match: { shift: shift._id, isActive: true } },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'user',
          as: 'attendances'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          employeeId: 1,
          recentAttendances: {
            $filter: {
              input: '$attendances',
              cond: { $gte: ['$$this.date', thirtyDaysAgo] }
            }
          }
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          employeeId: 1,
          totalDays: { $size: '$recentAttendances' },
          presentDays: {
            $size: {
              $filter: {
                input: '$recentAttendances',
                cond: { $ne: ['$$this.status', 'absent'] }
              }
            }
          },
          lateDays: {
            $size: {
              $filter: {
                input: '$recentAttendances',
                cond: { $eq: ['$$this.isLate', true] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        shift,
        totalUsers,
        attendanceStats
      }
    });
  } catch (error) {
    console.error('Get shift stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
