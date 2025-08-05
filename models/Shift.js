const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  breakDuration: {
    type: Number,
    default: 60, // minutes
    min: 0
  },
  lateThreshold: {
    type: Number,
    default: 15, // minutes
    min: 0
  },
  overTimeThreshold: {
    type: Number,
    default: 480, // minutes (8 hours)
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3498db'
  }
}, {
  timestamps: true
});

// Calculate total working hours
shiftSchema.virtual('totalHours').get(function() {
  const start = this.startTime.split(':');
  const end = this.endTime.split(':');
  
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  let endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const totalMinutes = endMinutes - startMinutes - this.breakDuration;
  return Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimal places
});

shiftSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Shift', shiftSchema);
