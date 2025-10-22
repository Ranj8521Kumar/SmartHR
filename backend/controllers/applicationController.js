const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { analyzeApplicationAI } = require('../services/aiService');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all applications
// @route   GET /api/v1/applications
// @access  Private
exports.getApplications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // If employee, only show their applications
  if (req.user.role === 'employee') {
    query.applicant = req.user.id;
  }

  // Filter by job
  if (req.query.job) {
    query.job = req.query.job;
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by applicant (for HR/Manager/Admin)
  if (req.query.applicant && req.user.role !== 'employee') {
    query.applicant = req.query.applicant;
  }

  const applications = await Application.find(query)
    .populate('job', 'title department location employmentType')
    .populate('applicant', 'firstName lastName email phone')
    .populate('resume', 'fileName fileUrl isParsed')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Application.countDocuments(query);

  res.status(200).json({
    success: true,
    count: applications.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: applications
  });
});

// @desc    Get single application
// @route   GET /api/v1/applications/:id
// @access  Private
exports.getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('job')
    .populate('applicant', 'firstName lastName email phone')
    .populate('resume')
    .populate('timeline.updatedBy', 'firstName lastName')
    .populate('interviews.interviewer', 'firstName lastName email')
    .populate('notes.author', 'firstName lastName');

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is application owner or has proper role
  if (
    application.applicant._id.toString() !== req.user.id &&
    !['hr_recruiter', 'manager', 'admin'].includes(req.user.role)
  ) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to view this application`, 401)
    );
  }

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Submit job application
// @route   POST /api/v1/applications
// @access  Private
exports.createApplication = asyncHandler(async (req, res, next) => {
  const { job, resume, coverLetter } = req.body;

  // Check if job exists and is open
  const jobExists = await Job.findById(job);
  if (!jobExists) {
    return next(new ErrorResponse('Job not found', 404));
  }
  if (jobExists.status !== 'open') {
    return next(new ErrorResponse('This job is no longer accepting applications', 400));
  }

  // Check if resume exists and belongs to user
  const resumeExists = await Resume.findById(resume);
  if (!resumeExists) {
    return next(new ErrorResponse('Resume not found', 404));
  }
  if (resumeExists.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to use this resume', 401));
  }

  // Check if user already applied for this job
  const existingApplication = await Application.findOne({
    job,
    applicant: req.user.id
  });
  if (existingApplication) {
    return next(new ErrorResponse('You have already applied for this job', 400));
  }

  // Create application
  const application = await Application.create({
    job,
    applicant: req.user.id,
    resume,
    coverLetter,
    timeline: [{
      status: 'submitted',
      date: Date.now()
    }]
  });

  // Update job applications count
  jobExists.applicationsCount += 1;
  await jobExists.save({ validateBeforeSave: false });

  // Analyze application with AI
  try {
    const aiScore = await analyzeApplicationAI(application._id);
    application.aiScore = aiScore;
    await application.save({ validateBeforeSave: false });
  } catch (error) {
    console.error('AI Analysis Error:', error);
  }

  // Send confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Application Submitted Successfully',
      message: `Your application for ${jobExists.title} has been submitted successfully.`
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  res.status(201).json({
    success: true,
    data: application
  });
});

// @desc    Update application status
// @route   PUT /api/v1/applications/:id
// @access  Private (HR/Manager/Admin)
exports.updateApplication = asyncHandler(async (req, res, next) => {
  let application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { status, notes } = req.body;

  // Update status
  if (status && status !== application.status) {
    application.status = status;
    application.timeline.push({
      status,
      date: Date.now(),
      updatedBy: req.user.id,
      notes
    });
  }

  // Add notes
  if (notes) {
    application.notes.push({
      author: req.user.id,
      content: notes
    });
  }

  await application.save();

  // Send status update email
  const populatedApp = await Application.findById(application._id)
    .populate('applicant', 'email firstName')
    .populate('job', 'title');

  try {
    await sendEmail({
      email: populatedApp.applicant.email,
      subject: `Application Status Update: ${populatedApp.job.title}`,
      message: `Your application status has been updated to: ${status}`
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Delete application
// @route   DELETE /api/v1/applications/:id
// @access  Private
exports.deleteApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is application owner or admin
  if (application.applicant.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this application`, 401)
    );
  }

  await application.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Schedule interview
// @route   POST /api/v1/applications/:id/interview
// @access  Private (HR/Manager/Admin)
exports.scheduleInterview = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { scheduledDate, type, interviewer, notes } = req.body;

  application.interviews.push({
    scheduledDate,
    type,
    interviewer,
    status: 'scheduled'
  });

  application.status = 'interview_scheduled';
  application.timeline.push({
    status: 'interview_scheduled',
    date: Date.now(),
    updatedBy: req.user.id,
    notes
  });

  await application.save();

  res.status(200).json({
    success: true,
    data: application
  });
});
