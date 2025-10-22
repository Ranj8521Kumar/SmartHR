const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { parseResume } = require('../services/resumeParserService');
const { deleteFromCloudinary, uploadBufferToCloudinary } = require('../utils/cloudinary');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

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
  const customFileName = `resume_${req.user.id}_${Date.now()}`;
  const fullFileName = customFileName + fileExt; // Include extension for Cloudinary

  // Determine file type
  let fileType = 'pdf';
  if (file.mimetype === 'application/msword') fileType = 'doc';
  if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = 'docx';

  try {
    // Upload to Cloudinary using buffer (with file extension and format)
    const cloudinaryResult = await uploadBufferToCloudinary(
      file.data,
      process.env.CLOUDINARY_FOLDER || 'hrms/resumes',
      fullFileName,
      'raw',
      fileType  // Pass the format explicitly
    );

    // Create resume record
    const resume = await Resume.create({
      user: req.user.id,
      fileName: fullFileName,
      fileUrl: cloudinaryResult.url,
      cloudinaryId: cloudinaryResult.public_id,
      fileType,
      fileSize: file.size
    });

    res.status(201).json({
      success: true,
      data: resume
    });
  } catch (error) {
    return next(new ErrorResponse('Failed to upload resume to cloud storage', 500));
  }
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

  try {
    // For Cloudinary-stored files, download temporarily for parsing
    let filePath;
    
    if (resume.cloudinaryId) {
      // Download file from Cloudinary URL
      const response = await axios({
        method: 'get',
        url: resume.fileUrl,
        responseType: 'arraybuffer'
      });

      // Save temporarily
      const tempDir = os.tmpdir();
      filePath = path.join(tempDir, resume.fileName);
      await fs.writeFile(filePath, response.data);
    } else {
      // Legacy local file path
      filePath = path.join(__dirname, '..', resume.fileUrl);
    }

    // Parse the resume
    const parsedData = await parseResume(filePath, resume.fileType);

    // Clean up temp file if it was downloaded
    if (resume.cloudinaryId) {
      await fs.unlink(filePath).catch(err => console.error('Error deleting temp file:', err));
    }

    // Update resume with parsed data
    resume.parsedData = parsedData.parsedData;
    resume.aiAnalysis = parsedData.aiAnalysis;
    resume.isParsed = true;
    await resume.save();

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return next(new ErrorResponse('Failed to parse resume', 500));
  }
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

  // Delete from Cloudinary if cloudinaryId exists
  if (resume.cloudinaryId) {
    try {
      await deleteFromCloudinary(resume.cloudinaryId, 'raw');
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      // Continue with soft delete even if Cloudinary delete fails
    }
  }

  // Soft delete
  resume.isActive = false;
  await resume.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});
