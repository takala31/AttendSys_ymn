const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['sick', 'vacation', 'personal', 'maternity', 'paternity', 'emergency', 'bereavement', 'other'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalDays: {
    type: Number,
    required: true,
    min: 0.5
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: 500
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayPeriod: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: function() {
      return this.isHalfDay;
    }
  },
  contactDuringLeave: {
    phone: String,
    email: String,
    address: String
  },
  handoverNotes: {
    type: String,
    trim: true
  },
  replacementEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
leaveSchema.index({ user: 1, startDate: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ type: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });

// Validate that end date is after start date
leaveSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  // Calculate total days
  const timeDiff = this.endDate.getTime() - this.startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
  
  if (this.isHalfDay && daysDiff === 1) {
    this.totalDays = 0.5;
  } else {
    this.totalDays = daysDiff;
  }
  
  next();
});

// Virtual for leave duration in readable format
leaveSchema.virtual('duration').get(function() {
  if (this.totalDays === 0.5) {
    return `Half day (${this.halfDayPeriod})`;
  } else if (this.totalDays === 1) {
    return '1 day';
  } else {
    return `${this.totalDays} days`;
  }
});

// Virtual for status color
leaveSchema.virtual('statusColor').get(function() {
  const colors = {
    pending: '#f39c12',
    approved: '#27ae60',
    rejected: '#e74c3c',
    cancelled: '#95a5a6'
  };
  return colors[this.status] || '#95a5a6';
});

leaveSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Leave', leaveSchema);
