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
    },
    matchedSkills: [{
      skill: String,
      confidence: Number
    }],
    matchedKeywords: [{
      keyword: String,
      context: String
    }],
    matchedPhrases: [{
      phrase: String,
      source: String
    }]
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
      enum: ['phone', 'video', 'in-person', 'technical', 'hr', 'ai_video']
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
    },
    // AI Interview specific fields
    aiInterview: {
      scheduledDate: {
        type: Date,
        // Scheduled date and time for the interview
      },
      duration: {
        type: Number, // Duration in minutes
        min: 15,
        max: 120
      },
      questions: [{
        question: String,
        category: {
          type: String,
          enum: ['technical', 'behavioral', 'situational', 'experience', 'cultural']
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard']
        },
        timeLimit: Number // Time limit in seconds for this question
      }],
      uniqueLink: {
        type: String,
        unique: true,
        sparse: true
      },
      candidateEmail: {
        type: String // Store candidate email for authentication verification
      },
      transcript: {
        type: mongoose.Schema.Types.Mixed,
        default: []
      },
      aiFeedback: {
        overallScore: Number,
        communicationScore: Number,
        technicalScore: Number,
        confidenceScore: Number,
        analysis: String
      },
      // Recording status tracking
      recordingStartedAt: Date,
      recordingLastHeartbeatAt: Date,
      recordingActive: {
        type: Boolean,
        default: false
      },
      // Recording URLs
      localVideoRecordingUrl: String, // URL of the local video recording uploaded to Cloudinary
      completedAt: Date,
      expiresAt: Date // Link expiration date
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

// Pre-save hook to fix transcript data type issues
ApplicationSchema.pre('save', function(next) {
  this.interviews.forEach(interview => {
    if (interview.aiInterview && typeof interview.aiInterview.transcript === 'string') {
      if (interview.aiInterview.transcript.trim() === '') {
        interview.aiInterview.transcript = [];
      } else {
        interview.aiInterview.transcript = [{
          id: 1,
          speaker: 'Candidate',
          timestamp: new Date(),
          message: interview.aiInterview.transcript
        }];
      }
    }
  });
  next();
});

// Virtual field to populate interview recordings
ApplicationSchema.virtual('interviewRecordings', {
  ref: 'InterviewRecording',
  localField: '_id',
  foreignField: 'application',
  justOne: false
});

// Enable virtuals in JSON and Object output
ApplicationSchema.set('toJSON', { virtuals: true });
ApplicationSchema.set('toObject', { virtuals: true });

// Compound index for efficient queries
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
ApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', ApplicationSchema);
