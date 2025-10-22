const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.ObjectId,
    ref: 'Job',
    required: [true, 'Application must be for a job']
  },
  applicant: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Application must have an applicant']
  },
  resume: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resume',
    required: [true, 'Please attach a resume']
  },
  coverLetter: {
    type: String,
    maxlength: [2000, 'Cover letter cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'offer_extended',
      'accepted',
      'rejected',
      'withdrawn'
    ],
    default: 'submitted'
  },
  aiScore: {
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    experienceMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    qualificationMatch: {
      type: Number,
      min: 0,
      max: 100
    },
    analysis: {
      type: String
    }
  },
  timeline: [{
    status: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  interviews: [{
    scheduledDate: Date,
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical', 'hr']
    },
    interviewer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
    }
  }],
  notes: [{
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient queries
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
ApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
