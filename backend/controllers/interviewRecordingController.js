const InterviewRecording = require('../models/InterviewRecording');
const Application = require('../models/Application');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { uploadBufferToCloudinary, deleteFromCloudinary, getDownloadUrl } = require('../utils/cloudinary');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept video and audio files
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('Invalid file type. Only video and audio files are allowed', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit for video files
  }
});

// @desc    Upload interview recording
// @route   POST /api/v1/interview-recordings/upload
// @access  Private (HR/Manager/Admin)
const uploadRecording = asyncHandler(async (req, res, next) => {
  const { applicationId, interviewType, notes, vapiCallId, transcript, duration } = req.body;

  if (!req.file) {
    return next(new ErrorResponse('Please upload a recording file', 400));
  }

  if (!applicationId) {
    return next(new ErrorResponse('Application ID is required', 400));
  }

  // Get application details
  const application = await Application.findById(applicationId)
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title department');

  if (!application) {
    return next(new ErrorResponse('Application not found', 404));
  }

  // Generate unique filename
  const fileExtension = path.extname(req.file.originalname);
  const fileName = `interview_${application.applicant._id}_${Date.now()}${fileExtension}`;
  const fileNameWithoutExt = fileName.replace(fileExtension, '');

  // Determine resource type (video or raw for audio)
  const mimeType = req.file.mimetype;
  const resourceType = mimeType.startsWith('video/') ? 'video' : 'raw';

  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadBufferToCloudinary(
      req.file.buffer,
      'SmartHR/InterviewRecordings',
      fileNameWithoutExt,
      resourceType,
      fileExtension.replace('.', '')
    );

    // Create interview recording document
    const recording = await InterviewRecording.create({
      application: applicationId,
      applicant: application.applicant._id,
      job: application.job._id,
      interviewType: interviewType || 'ai_voice',
      recordingUrl: cloudinaryResult.url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      cloudinaryResourceType: resourceType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration: duration ? parseInt(duration) : null,
      format: cloudinaryResult.format,
      vapiCallId: vapiCallId || null,
      transcript: transcript || null,
      notes: notes || null,
      uploadedBy: req.user.id,
      status: 'ready'
    });

    // Populate the recording before sending response
    await recording.populate([
      { path: 'applicant', select: 'firstName lastName email' },
      { path: 'job', select: 'title department' },
      { path: 'uploadedBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      data: recording
    });
  } catch (error) {
    console.error('Upload recording error:', error);
    return next(new ErrorResponse('Failed to upload recording', 500));
  }
});

// @desc    Get all interview recordings
// @route   GET /api/v1/interview-recordings
// @access  Private (HR/Manager/Admin)
const getRecordings = asyncHandler(async (req, res, next) => {
  const { applicationId, applicantId, jobId, interviewType, status } = req.query;

  // Build query
  let query = {};

  if (applicationId) query.application = applicationId;
  if (applicantId) query.applicant = applicantId;
  if (jobId) query.job = jobId;
  if (interviewType) query.interviewType = interviewType;
  if (status) query.status = status;

  const recordings = await InterviewRecording.find(query)
    .populate('applicant', 'firstName lastName email phone')
    .populate('job', 'title department')
    .populate('application', 'status')
    .populate('uploadedBy', 'firstName lastName email')
    .populate('interviewer', 'firstName lastName email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: recordings.length,
    data: recordings
  });
});

// @desc    Get single interview recording
// @route   GET /api/v1/interview-recordings/:id
// @access  Private
const getRecording = asyncHandler(async (req, res, next) => {
  const recording = await InterviewRecording.findById(req.params.id)
    .populate('applicant', 'firstName lastName email phone')
    .populate('job', 'title department location')
    .populate('application', 'status coverLetter')
    .populate('uploadedBy', 'firstName lastName email')
    .populate('interviewer', 'firstName lastName email');

  if (!recording) {
    return next(new ErrorResponse('Interview recording not found', 404));
  }

  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    req.user.role !== 'hr_recruiter' &&
    recording.applicant._id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to access this recording', 403));
  }

  res.status(200).json({
    success: true,
    data: recording
  });
});

// @desc    Get recordings by application
// @route   GET /api/v1/interview-recordings/application/:applicationId
// @access  Private
const getRecordingsByApplication = asyncHandler(async (req, res, next) => {
  const recordings = await InterviewRecording.getByApplication(req.params.applicationId);

  res.status(200).json({
    success: true,
    count: recordings.length,
    data: recordings
  });
});

// @desc    Get recordings by applicant
// @route   GET /api/v1/interview-recordings/applicant/:applicantId
// @access  Private (HR/Manager/Admin or own applicant)
const getRecordingsByApplicant = asyncHandler(async (req, res, next) => {
  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    req.user.role !== 'hr_recruiter' &&
    req.params.applicantId !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to access these recordings', 403));
  }

  const recordings = await InterviewRecording.getByApplicant(req.params.applicantId);

  res.status(200).json({
    success: true,
    count: recordings.length,
    data: recordings
  });
});

// @desc    Update interview recording
// @route   PUT /api/v1/interview-recordings/:id
// @access  Private (HR/Manager/Admin)
const updateRecording = asyncHandler(async (req, res, next) => {
  let recording = await InterviewRecording.findById(req.params.id);

  if (!recording) {
    return next(new ErrorResponse('Interview recording not found', 404));
  }

  const { notes, feedback, status, aiAnalysis, transcript, interviewer } = req.body;

  // Update fields
  if (notes !== undefined) recording.notes = notes;
  if (feedback !== undefined) recording.feedback = feedback;
  if (status !== undefined) recording.status = status;
  if (aiAnalysis !== undefined) recording.aiAnalysis = aiAnalysis;
  if (transcript !== undefined) recording.transcript = transcript;
  if (interviewer !== undefined) recording.interviewer = interviewer;

  await recording.save();

  // Populate before sending response
  await recording.populate([
    { path: 'applicant', select: 'firstName lastName email' },
    { path: 'job', select: 'title department' },
    { path: 'interviewer', select: 'firstName lastName email' }
  ]);

  res.status(200).json({
    success: true,
    data: recording
  });
});

// @desc    Delete interview recording
// @route   DELETE /api/v1/interview-recordings/:id
// @access  Private (Admin only)
const deleteRecording = asyncHandler(async (req, res, next) => {
  const recording = await InterviewRecording.findById(req.params.id);

  if (!recording) {
    return next(new ErrorResponse('Interview recording not found', 404));
  }

  try {
    // Delete from Cloudinary
    await deleteFromCloudinary(recording.cloudinaryPublicId, recording.cloudinaryResourceType);

    // Delete from database
    await recording.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete recording error:', error);
    return next(new ErrorResponse('Failed to delete recording', 500));
  }
});

// @desc    Get download URL for recording
// @route   GET /api/v1/interview-recordings/:id/download
// @access  Private
const getDownloadLink = asyncHandler(async (req, res, next) => {
  const recording = await InterviewRecording.findById(req.params.id);

  if (!recording) {
    return next(new ErrorResponse('Interview recording not found', 404));
  }

  // Check authorization
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'manager' &&
    req.user.role !== 'hr_recruiter' &&
    recording.applicant.toString() !== req.user.id
  ) {
    return next(new ErrorResponse('Not authorized to download this recording', 403));
  }

  const downloadUrl = getDownloadUrl(recording.cloudinaryPublicId);

  res.status(200).json({
    success: true,
    data: {
      downloadUrl,
      fileName: recording.fileName
    }
  });
});

module.exports = {
  upload,
  uploadRecording,
  getRecordings,
  getRecording,
  getRecordingsByApplication,
  getRecordingsByApplicant,
  updateRecording,
  deleteRecording,
  getDownloadLink
};
