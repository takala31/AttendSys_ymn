const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  shift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    required: true
  },
  checkIn: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    image: {
      type: String
    },
    ipAddress: {
      type: String
    },
    device: {
      type: String
    }
  },
  checkOut: {
    time: {
      type: Date
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    image: {
      type: String
    },
    ipAddress: {
      type: String
    },
    device: {
      type: String
    }
  },
  breaks: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // in minutes
    },
    type: {
      type: String,
      enum: ['lunch', 'coffee', 'personal', 'other'],
      default: 'other'
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'overtime'],
    default: 'present'
  },
  workingHours: {
    type: Number,
    default: 0 // in minutes
  },
  overtimeHours: {
    type: Number,
    default: 0 // in minutes
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index for better query performance
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ user: 1 });
attendanceSchema.index({ shift: 1 });

// Calculate working hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.checkIn.time && this.checkOut.time) {
    const checkInTime = new Date(this.checkIn.time);
    const checkOutTime = new Date(this.checkOut.time);
    
    // Calculate total time in minutes
    let totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);
    
    // Subtract break time
    const totalBreakTime = this.breaks.reduce((total, breakItem) => {
      if (breakItem.endTime) {
        const breakDuration = (breakItem.endTime - breakItem.startTime) / (1000 * 60);
        return total + breakDuration;
      }
      return total;
    }, 0);
    
    this.workingHours = Math.max(0, totalMinutes - totalBreakTime);
    
    // Calculate overtime (assuming 8 hours = 480 minutes as standard)
    const standardHours = 480; // 8 hours in minutes
    this.overtimeHours = Math.max(0, this.workingHours - standardHours);
  }
  
  next();
});

// Virtual for formatted working hours
attendanceSchema.virtual('formattedWorkingHours').get(function() {
  const hours = Math.floor(this.workingHours / 60);
  const minutes = this.workingHours % 60;
  return `${hours}h ${minutes}m`;
});

attendanceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
