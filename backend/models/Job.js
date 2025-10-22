const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Job title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a job description'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  department: {
    type: String,
    required: [true, 'Please add a department'],
    enum: ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  employmentType: {
    type: String,
    required: [true, 'Please specify employment type'],
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary']
  },
  experienceLevel: {
    type: String,
    required: [true, 'Please specify experience level'],
    enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager']
  },
  salary: {
    min: {
      type: Number,
      required: [true, 'Please add minimum salary']
    },
    max: {
      type: Number,
      required: [true, 'Please add maximum salary']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  skills: [{
    type: String
  }],
  qualifications: [{
    type: String
  }],
  responsibilities: [{
    type: String
  }],
  benefits: [{
    type: String
  }],
  openings: {
    type: Number,
    required: [true, 'Please specify number of openings'],
    default: 1
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'on-hold', 'filled'],
    default: 'open'
  },
  deadline: {
    type: Date
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  applicationsCount: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for searching
JobSchema.index({ title: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Job', JobSchema);
