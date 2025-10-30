const mongoose = require('mongoose');

const InterviewRecordingSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: [true, 'Application reference is required']
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant reference is required']
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job reference is required']
  },
  interviewType: {
    type: String,
    enum: ['ai_voice', 'video', 'phone', 'in_person'],
    default: 'ai_voice'
  },
  // Cloudinary storage
  recordingUrl: {
    type: String,
    required: [true, 'Recording URL is required']
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required']
  },
  cloudinaryResourceType: {
    type: String,
    default: 'video'
  },
  // Recording metadata
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number // in bytes
  },
  duration: {
    type: Number // in seconds
  },
  format: {
    type: String // mp4, webm, mp3, etc.
  },
  // Interview details
  interviewDate: {
    type: Date,
    default: Date.now
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // AI Interview specific (from Vapi)
  vapiCallId: {
    type: String
  },
  transcript: {
    type: String
  },
  transcriptUrl: {
    type: String
  },
  // Status and notes
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ready', 'failed', 'archived'],
    default: 'uploaded'
  },
  notes: {
    type: String
  },
  feedback: {
    type: String
  },
  // AI Analysis (optional)
  aiAnalysis: {
    sentiment: String,
    keyPoints: [String],
    score: Number,
    confidence: Number
  },
  // Metadata
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date // Optional expiration for recording
  }
}, {
  timestamps: true
});

// Indexes
InterviewRecordingSchema.index({ application: 1 });
InterviewRecordingSchema.index({ applicant: 1 });
InterviewRecordingSchema.index({ job: 1 });
InterviewRecordingSchema.index({ vapiCallId: 1 });
InterviewRecordingSchema.index({ createdAt: -1 });

// Virtual for checking if recording is expired
InterviewRecordingSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < Date.now();
});

// Pre-save middleware
InterviewRecordingSchema.pre('save', function(next) {
  // Update status based on expiration
  if (this.isExpired && this.status !== 'archived') {
    this.status = 'archived';
  }
  next();
});

// Method to get secure URL with transformations
InterviewRecordingSchema.methods.getSecureUrl = function(transformations = {}) {
  return this.recordingUrl;
};

// Static method to get recordings by applicant
InterviewRecordingSchema.statics.getByApplicant = function(applicantId) {
  return this.find({ applicant: applicantId })
    .populate('application')
    .populate('job', 'title department')
    .populate('interviewer', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get recordings by application
InterviewRecordingSchema.statics.getByApplication = function(applicationId) {
  return this.find({ application: applicationId })
    .populate('applicant', 'firstName lastName email')
    .populate('interviewer', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('InterviewRecording', InterviewRecordingSchema);
