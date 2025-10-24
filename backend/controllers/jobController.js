const Job = require('../models/Job');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all jobs
// @route   GET /api/v1/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  // Filter by status (default to 'open' for public access)
  if (req.query.status) {
    query.status = req.query.status;
  } else if (!req.user || req.user.role === 'employee') {
    query.status = 'open';
  }

  // Filter by department
  if (req.query.department) {
    query.department = req.query.department;
  }

  // Filter by location
  if (req.query.location) {
    query.location = new RegExp(req.query.location, 'i');
  }

  // Filter by employment type
  if (req.query.employmentType) {
    query.employmentType = req.query.employmentType;
  }

  // Filter by experience level
  if (req.query.experienceLevel) {
    query.experienceLevel = req.query.experienceLevel;
  }

  // Text search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  const jobs = await Job.find(query)
    .populate('postedBy', 'firstName lastName email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: jobs
  });
});

// @desc    Get single job
// @route   GET /api/v1/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate('postedBy', 'firstName lastName email');

  if (!job) {
    return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
  }

  // Increment views count
  job.viewsCount += 1;
  await job.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    data: job
  });
});

// @desc    Create new job
// @route   POST /api/v1/jobs
// @access  Private (HR/Manager/Admin)
exports.createJob = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.postedBy = req.user.id;

  const job = await Job.create(req.body);

  res.status(201).json({
    success: true,
    data: job
  });
});

// @desc    Update job
// @route   PUT /api/v1/jobs/:id
// @access  Private (HR/Recruiter/Manager)
exports.updateJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is job owner or has permission
  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this job`, 403));
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: updatedJob
  });
});

// @desc    Delete job
// @route   DELETE /api/v1/jobs/:id
// @access  Private (HR/Recruiter/Manager)
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorResponse(`Job not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is job owner or has permission
  if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this job`, 403));
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
