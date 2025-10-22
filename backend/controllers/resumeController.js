const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { parseResume } = require('../services/resumeParserService');
const path = require('path');
const fs = require('fs').promises;

// @desc    Upload resume
// @route   POST /api/v1/resumes/upload
// @access  Private
exports.uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.files || !req.files.resume) {
    return next(new ErrorResponse('Please upload a resume file', 400));
  }

  const file = req.files.resume;

  // Check file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.mimetype)) {
    return next(new ErrorResponse('Please upload a PDF or Word document', 400));
  }

  // Check file size
  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorResponse(`Please upload a file less than ${process.env.MAX_FILE_SIZE / 1024 / 1024}MB`, 400));
  }

  // Create custom filename
  const fileExt = path.extname(file.name);
  file.name = `resume_${req.user.id}_${Date.now()}${fileExt}`;

  // Upload file
  const uploadPath = path.join(__dirname, '../uploads/resumes', file.name);
  
  await file.mv(uploadPath);

  // Determine file type
  let fileType = 'pdf';
  if (file.mimetype === 'application/msword') fileType = 'doc';
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

  // Create resume record
  const resume = await Resume.create({
    user: req.user.id,
    fileName: file.name,
    fileUrl: `/uploads/resumes/${file.name}`,
    fileType,
    fileSize: file.size
  });

  res.status(201).json({
    success: true,
    data: resume
  });
});

// @desc    Parse resume with AI
// @route   POST /api/v1/resumes/parse/:id
// @access  Private
exports.parseResumeById = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return next(new ErrorResponse(`Resume not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the resume
  if (resume.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to parse this resume', 401));
  }

  if (resume.isParsed) {
    return res.status(200).json({
      success: true,
      message: 'Resume already parsed',
      data: resume
    });
  }

  // Parse the resume
  const filePath = path.join(__dirname, '..', resume.fileUrl);
  const parsedData = await parseResume(filePath, resume.fileType);

  // Update resume with parsed data
  resume.parsedData = parsedData.parsedData;
  resume.aiAnalysis = parsedData.aiAnalysis;
  resume.isParsed = true;
  await resume.save();

  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Get all resumes for current user
// @route   GET /api/v1/resumes
// @access  Private
exports.getMyResumes = asyncHandler(async (req, res, next) => {
  const resumes = await Resume.find({ user: req.user.id, isActive: true })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resumes.length,
    data: resumes
  });
});

// @desc    Get single resume
// @route   GET /api/v1/resumes/:id
// @access  Private
exports.getResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id).populate('user', 'firstName lastName email');

  if (!resume) {
    return next(new ErrorResponse(`Resume not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the resume or has proper role
  if (
    resume.user._id.toString() !== req.user.id &&
    !['hr_recruiter', 'manager', 'admin'].includes(req.user.role)
  ) {
    return next(new ErrorResponse('Not authorized to view this resume', 401));
  }

  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Get resumes by user ID
// @route   GET /api/v1/resumes/user/:userId
// @access  Private (HR/Manager/Admin)
exports.getUserResumes = asyncHandler(async (req, res, next) => {
  const resumes = await Resume.find({ user: req.params.userId, isActive: true })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: resumes.length,
    data: resumes
  });
});

// @desc    Delete resume
// @route   DELETE /api/v1/resumes/:id
// @access  Private
exports.deleteResume = asyncHandler(async (req, res, next) => {
  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    return next(new ErrorResponse(`Resume not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns the resume
  if (resume.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this resume', 401));
  }

  // Soft delete
  resume.isActive = false;
  await resume.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});
