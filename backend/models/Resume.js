const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: [true, 'Please add a file name']
  },
  fileUrl: {
    type: String,
    required: [true, 'Please add a file URL']
  },
  cloudinaryId: {
    type: String
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx'],
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  isParsed: {
    type: Boolean,
    default: false
  },
  parsedData: {
    personalInfo: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedIn: String,
      github: String,
      portfolio: String
    },
    summary: {
      type: String
    },
    skills: [{
      name: String,
      category: String,
      proficiency: String
    }],
    experience: [{
      company: String,
      position: String,
      location: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      description: String,
      responsibilities: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: String,
      endDate: String,
      gpa: String,
      description: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String,
      expiryDate: String,
      credentialId: String
    }],
    projects: [{
      name: String,
      description: String,
      technologies: [String],
      url: String,
      startDate: String,
      endDate: String
    }],
    languages: [{
      name: String,
      proficiency: String
    }],
    awards: [{
      title: String,
      issuer: String,
      date: String,
      description: String
    }]
  },
  aiAnalysis: {
    keywords: [String],
    skillsExtracted: [String],
    experienceYears: Number,
    educationLevel: String,
    industryFocus: [String],
    strengths: [String],
    suggestions: [String],
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for searching
ResumeSchema.index({ user: 1, isActive: 1 });
ResumeSchema.index({ 'parsedData.skills.name': 'text', 'parsedData.experience.company': 'text' });

module.exports = mongoose.model('Resume', ResumeSchema);
