const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { analyzeApplicationAI } = require('../services/aiService');
const sendEmail = require('../utils/sendEmail');
const { uploadVideoRecording, uploadAudioRecording, uploadRemoteVideoUrl } = require('../utils/mediaUpload');

// Helper function to format status display names
const getStatusDisplayName = (status) => {
  const statusMap = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'shortlisted': 'Shortlisted',
    'interview_scheduled': 'Interview Scheduled',
    'interviewed': 'Interviewed',
    'offer_extended': 'Offer Extended',
    'accepted': 'Accepted',
    'rejected': 'Rejected',
    'withdrawn': 'Withdrawn'
  };
  return statusMap[status] || status;
};

// Helper function to get status-specific message and styling
const getStatusEmailDetails = (status) => {
  const details = {
    'submitted': {
      icon: '📧',
      color: '#2196f3',
      bgColor: '#e3f2fd',
      message: 'Your application has been received and is being reviewed by our team.',
      nextSteps: 'Our HR team will review your application and get back to you soon.'
    },
    'under_review': {
      icon: '👀',
      color: '#ff9800',
      bgColor: '#fff3e0',
      message: 'Your application is currently being reviewed by our recruitment team.',
      nextSteps: 'We are evaluating your qualifications and will update you soon.'
    },
    'shortlisted': {
      icon: '⭐',
      color: '#4caf50',
      bgColor: '#e8f5e9',
      message: 'Congratulations! Your application has been shortlisted.',
      nextSteps: 'You may be contacted for the next step in the hiring process.'
    },
    'interview_scheduled': {
      icon: '📅',
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      message: 'An interview has been scheduled for your application.',
      nextSteps: 'Please check your dashboard or email for interview details.'
    },
    'interviewed': {
      icon: '✅',
      color: '#2196f3',
      bgColor: '#e3f2fd',
      message: 'Thank you for completing your interview.',
      nextSteps: 'We will review your interview and get back to you soon.'
    },
    'offer_extended': {
      icon: '🎉',
      color: '#4caf50',
      bgColor: '#e8f5e9',
      message: 'Congratulations! We are pleased to extend an offer to you.',
      nextSteps: 'Please check your dashboard or email for the offer details.'
    },
    'accepted': {
      icon: '🎊',
      color: '#4caf50',
      bgColor: '#e8f5e9',
      message: 'Welcome aboard! Your offer has been accepted.',
      nextSteps: 'Our team will contact you with onboarding details.'
    },
    'rejected': {
      icon: '😔',
      color: '#f44336',
      bgColor: '#ffebee',
      message: 'Thank you for your interest, but we have decided to move forward with other candidates.',
      nextSteps: 'We encourage you to apply for other positions that match your skills.'
    },
    'withdrawn': {
      icon: '↩️',
      color: '#9e9e9e',
      bgColor: '#f5f5f5',
      message: 'Your application has been withdrawn.',
      nextSteps: 'Feel free to apply for other positions anytime.'
    }
  };
  return details[status] || {
    icon: '📌',
    color: '#2196f3',
    bgColor: '#e3f2fd',
    message: `Your application status has been updated to ${getStatusDisplayName(status)}.`,
    nextSteps: 'Please check your dashboard for more details.'
  };
};

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
    .populate('interviews.interviewer', 'firstName lastName email')
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

// @desc    Upload interview recording to Cloudinary
// @route   POST /api/v1/applications/:id/ai-interview/:interviewId/recording
// @access  Private (HR/Manager/Admin)
exports.uploadInterviewRecording = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const { recordingType } = req.body; // 'video' or 'audio'

  // Find the specific interview
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  // Validate that aiInterview exists
  if (!interview.aiInterview) {
    return next(new ErrorResponse('AI interview data not found', 404));
  }

  // Check if file was uploaded
  if (!req.files || !req.files.recording) {
    return next(new ErrorResponse('No recording file provided', 400));
  }

  const recordingFile = req.files.recording;

  try {
    let uploadResult;

    if (recordingType === 'audio') {
      uploadResult = await uploadAudioRecording(
        recordingFile.data,
        recordingFile.name,
        application._id.toString(),
        interviewId
      );
    } else {
      // Default to video recording
      uploadResult = await uploadVideoRecording(
        recordingFile.data,
        recordingFile.name,
        application._id.toString(),
        interviewId
      );
    }

    // Log successful upload
    console.log('[UploadPrivate] Recording uploaded to Cloudinary', {
      recordingType,
      applicationId: application._id.toString(),
      interviewId,
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      size: uploadResult.size,
      duration: uploadResult.duration,
      format: uploadResult.format
    });

    // Update the interview with the recording URL
    if (recordingType === 'audio') {
      interview.aiInterview.localAudioRecordingUrl = uploadResult.url;
    } else {
      interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
    }

    // Save to MongoDB
    await application.save();

    // ✅ VERIFICATION: Log that URL was saved to MongoDB
    console.log('[MongoDB] ✅ Recording URL saved to database', {
      applicationId: application._id.toString(),
      interviewId: interviewId,
      savedVideoUrl: interview.aiInterview.localVideoRecordingUrl,
      savedAudioUrl: interview.aiInterview.localAudioRecordingUrl,
      cloudinaryUrl: uploadResult.url
    });

    // ✅ VERIFICATION: Re-fetch from database to confirm persistence
    const verifyApp = await Application.findById(application._id);
    const verifyInterview = verifyApp.interviews.id(interviewId);
    console.log('[MongoDB] ✅ Verification - URL exists in database:', {
      urlInDb: verifyInterview.aiInterview.localVideoRecordingUrl || verifyInterview.aiInterview.localAudioRecordingUrl,
      matchesCloudinary: (verifyInterview.aiInterview.localVideoRecordingUrl === uploadResult.url) || (verifyInterview.aiInterview.localAudioRecordingUrl === uploadResult.url)
    });

    res.status(200).json({
      success: true,
      data: {
        recordingUrl: uploadResult.url,
        publicId: uploadResult.public_id,
        size: uploadResult.size,
        duration: uploadResult.duration,
        format: uploadResult.format,
        savedToDatabase: true  // ✅ Confirmation flag
      }
    });
  } catch (error) {
    console.error('Recording upload error:', error);
    return next(new ErrorResponse('Failed to upload recording', 500));
  }
});

// @desc    Upload interview recording to Cloudinary (Public by link)
// @route   POST /api/v1/applications/public/ai-interview/:link/recording
// @access  Public (candidate via unique link)
exports.uploadInterviewRecordingPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;

  // Find application and interview by link
  const application = await Application.findOne({
    'interviews.aiInterview.uniqueLink': link
  });

  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }

  const interview = application.interviews.find(
    i => i.aiInterview && i.aiInterview.uniqueLink === link
  );

  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  if (!req.files || !req.files.recording) {
    return next(new ErrorResponse('No recording file provided', 400));
  }

  const recordingType = req.body?.recordingType;
  const recordingFile = req.files.recording;

  try {
    let uploadResult;
    if (recordingType === 'audio') {
      uploadResult = await uploadAudioRecording(
        recordingFile.data,
        recordingFile.name,
        application._id.toString(),
        interview._id.toString()
      );
    } else {
      uploadResult = await uploadVideoRecording(
        recordingFile.data,
        recordingFile.name,
        application._id.toString(),
        interview._id.toString()
      );
    }

    // Log successful upload
    console.log('[UploadPublic] Recording uploaded to Cloudinary', {
      link,
      recordingType,
      applicationId: application._id.toString(),
      interviewId: interview._id.toString(),
      publicId: uploadResult.public_id,
      url: uploadResult.url,
      size: uploadResult.size,
      duration: uploadResult.duration,
      format: uploadResult.format
    });

    if (recordingType === 'audio') {
      interview.aiInterview.localAudioRecordingUrl = uploadResult.url;
    } else {
      interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
    }

    // Save to MongoDB
    await application.save();

    // ✅ VERIFICATION: Log that URL was saved to MongoDB
    console.log('[MongoDB] ✅ Recording URL saved to database', {
      applicationId: application._id.toString(),
      interviewId: interview._id.toString(),
      savedVideoUrl: interview.aiInterview.localVideoRecordingUrl,
      savedAudioUrl: interview.aiInterview.localAudioRecordingUrl,
      cloudinaryUrl: uploadResult.url
    });

    // ✅ VERIFICATION: Re-fetch from database to confirm persistence
    const verifyApp = await Application.findById(application._id);
    const verifyInterview = verifyApp.interviews.id(interview._id);
    console.log('[MongoDB] ✅ Verification - URL exists in database:', {
      urlInDb: verifyInterview.aiInterview.localVideoRecordingUrl || verifyInterview.aiInterview.localAudioRecordingUrl,
      matchesCloudinary: (verifyInterview.aiInterview.localVideoRecordingUrl === uploadResult.url) || (verifyInterview.aiInterview.localAudioRecordingUrl === uploadResult.url)
    });

    res.status(200).json({
      success: true,
      data: {
        recordingUrl: uploadResult.url,
        publicId: uploadResult.public_id,
        size: uploadResult.size,
        duration: uploadResult.duration,
        format: uploadResult.format,
        savedToDatabase: true  // ✅ Confirmation flag
      }
    });
  } catch (error) {
    console.error('[UploadPublic] Public recording upload error:', error);
    return next(new ErrorResponse('Failed to upload recording', 500));
  }
});

// @desc    Upload interview recording as raw binary (authenticated)
// @route   POST /api/v1/applications/:id/ai-interview/:interviewId/recording/raw
// @access  Private (HR/Manager/Admin)
exports.uploadInterviewRecordingRaw = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }
  if (!interview.aiInterview) {
    return next(new ErrorResponse('AI interview data not found', 404));
  }

  if (!req.body || !(req.body instanceof Buffer) || req.body.length === 0) {
    return next(new ErrorResponse('No recording binary provided', 400));
  }

  try {
    const uploadResult = await uploadVideoRecording(
      req.body,
      `interview_${interviewId}.webm`,
      application._id.toString(),
      interviewId
    );

    interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
    await application.save();

    console.log('[UploadRaw] Recording uploaded to Cloudinary', {
      applicationId: application._id.toString(),
      interviewId,
      url: uploadResult.url
    });

    res.status(200).json({
      success: true,
      data: {
        recordingUrl: uploadResult.url
      }
    });
  } catch (err) {
    console.error('[UploadRaw] Recording upload error:', err);
    return next(new ErrorResponse('Failed to upload raw recording', 500));
  }
});

// @desc    Upload interview recording as raw binary by public link (candidate)
// @route   POST /api/v1/applications/public/ai-interview/:link/recording/raw
// @access  Public
exports.uploadInterviewRecordingRawPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;
  const application = await Application.findOne({ 'interviews.aiInterview.uniqueLink': link });
  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }
  const interview = application.interviews.find(i => i.aiInterview && i.aiInterview.uniqueLink === link);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }
  if (!req.body || !(req.body instanceof Buffer) || req.body.length === 0) {
    return next(new ErrorResponse('No recording binary provided', 400));
  }
  try {
    const uploadResult = await uploadVideoRecording(
      req.body,
      `interview_${interview._id.toString()}.webm`,
      application._id.toString(),
      interview._id.toString()
    );
    interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
    await application.save();
    console.log('[UploadRawPublic] Recording uploaded to Cloudinary', {
      link,
      applicationId: application._id.toString(),
      interviewId: interview._id.toString(),
      url: uploadResult.url
    });
    res.status(200).json({ success: true, data: { recordingUrl: uploadResult.url } });
  } catch (err) {
    console.error('[UploadRawPublic] Recording upload error:', err);
    return next(new ErrorResponse('Failed to upload raw recording', 500));
  }
});

// @desc    Start recording (authenticated)
// @route   POST /api/v1/applications/:id/ai-interview/:interviewId/recording/start
// @access  Private (HR/Manager/Admin)
exports.startInterviewRecording = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video' || !interview.aiInterview) {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  interview.aiInterview.recordingStartedAt = new Date();
  interview.aiInterview.recordingLastHeartbeatAt = new Date();
  interview.aiInterview.recordingActive = true;

  console.log('[Recording] Started interview video recording', {
    applicationId: application._id.toString(),
    interviewId
  });

  await application.save();

  res.status(200).json({
    success: true,
    data: {
      startedAt: interview.aiInterview.recordingStartedAt,
      active: interview.aiInterview.recordingActive
    }
  });
});

// @desc    Recording heartbeat (authenticated)
// @route   POST /api/v1/applications/:id/ai-interview/:interviewId/recording/heartbeat
// @access  Private (HR/Manager/Admin)
exports.heartbeatInterviewRecording = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video' || !interview.aiInterview) {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  interview.aiInterview.recordingLastHeartbeatAt = new Date();
  interview.aiInterview.recordingActive = true;

  await application.save();

  res.status(200).json({
    success: true,
    data: {
      lastHeartbeatAt: interview.aiInterview.recordingLastHeartbeatAt,
      active: interview.aiInterview.recordingActive
    }
  });
});

// @desc    Get recording status (authenticated)
// @route   GET /api/v1/applications/:id/ai-interview/:interviewId/recording/status
// @access  Private (HR/Manager/Admin)
exports.getInterviewRecordingStatus = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video' || !interview.aiInterview) {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  const { recordingStartedAt, recordingLastHeartbeatAt, recordingActive } = interview.aiInterview;

  res.status(200).json({
    success: true,
    data: {
      recordingStartedAt: recordingStartedAt || null,
      recordingLastHeartbeatAt: recordingLastHeartbeatAt || null,
      recordingActive: Boolean(recordingActive)
    }
  });
});

// @desc    Start recording by public link (candidate)
// @route   POST /api/v1/applications/public/ai-interview/:link/recording/start
// @access  Public
exports.startInterviewRecordingPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;
  const application = await Application.findOne({ 'interviews.aiInterview.uniqueLink': link });
  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }
  const interview = application.interviews.find(i => i.aiInterview && i.aiInterview.uniqueLink === link);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }
  interview.aiInterview.recordingStartedAt = new Date();
  interview.aiInterview.recordingLastHeartbeatAt = new Date();
  interview.aiInterview.recordingActive = true;
  console.log('[Recording] Started interview video recording (public link)', {
    applicationId: application._id.toString(),
    interviewId: interview._id.toString(),
    link
  });
  await application.save();
  res.status(200).json({ success: true, data: { startedAt: interview.aiInterview.recordingStartedAt, active: true } });
});

// @desc    Recording heartbeat by public link (candidate)
// @route   POST /api/v1/applications/public/ai-interview/:link/recording/heartbeat
// @access  Public
exports.heartbeatInterviewRecordingPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;
  const application = await Application.findOne({ 'interviews.aiInterview.uniqueLink': link });
  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }
  const interview = application.interviews.find(i => i.aiInterview && i.aiInterview.uniqueLink === link);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }
  interview.aiInterview.recordingLastHeartbeatAt = new Date();
  interview.aiInterview.recordingActive = true;
  await application.save();
  res.status(200).json({ success: true, data: { lastHeartbeatAt: interview.aiInterview.recordingLastHeartbeatAt, active: true } });
});

// @desc    Get recording status by public link (candidate)
// @route   GET /api/v1/applications/public/ai-interview/:link/recording/status
// @access  Public
exports.getInterviewRecordingStatusPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;
  const application = await Application.findOne({ 'interviews.aiInterview.uniqueLink': link });
  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }
  const interview = application.interviews.find(i => i.aiInterview && i.aiInterview.uniqueLink === link);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }
  const { recordingStartedAt, recordingLastHeartbeatAt, recordingActive } = interview.aiInterview;
  res.status(200).json({
    success: true,
    data: {
      recordingStartedAt: recordingStartedAt || null,
      recordingLastHeartbeatAt: recordingLastHeartbeatAt || null,
      recordingActive: Boolean(recordingActive)
    }
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
    application.aiScore = {
      ...aiScore,
      matchedSkills: aiScore.matchedSkills || [],
      matchedKeywords: aiScore.matchedKeywords || [],
      matchedPhrases: aiScore.matchedPhrases || []
    };
    await application.save({ validateBeforeSave: false });
  } catch (error) {
    console.error('AI Analysis Error:', error);
  }

  // Send confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Application Submitted Successfully',
      message: `Hi ${req.user.firstName},\n\nYour application for ${jobExists.title} has been submitted successfully.\n\nWe have received your application and our team will review it shortly. You will be notified of any updates via email.\n\nBest regards,\nHRMS Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">✅ Application Submitted</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${req.user.firstName} 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Great news! Your application for <strong>${jobExists.title}</strong> has been submitted successfully.
            </p>
            <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
              <h3 style="margin-top: 0; color: #1976d2;">📋 Application Details:</h3>
              <p style="margin: 5px 0;"><strong>Position:</strong> ${jobExists.title}</p>
              <p style="margin: 5px 0;"><strong>Department:</strong> ${jobExists.department || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${jobExists.location || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #666; line-height: 1.6;">
              We have received your application and our HR team will review it shortly. You will be notified via email of any updates regarding your application status.
            </p>
            <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-weight: bold;">
                💡 What's Next?
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; padding: 0;">
                <li>Our team will review your application</li>
                <li>You'll receive email updates on your application status</li>
                <li>You can track your application progress in your dashboard</li>
              </ul>
            </div>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Thank you for your interest in joining our team!
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Best regards,<br>
              <strong>HRMS Team</strong>
            </p>
          </div>
        </div>
      `
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

  await application.save({ validateBeforeSave: false });

  // Populate the application before sending response
  const populatedApp = await Application.findById(application._id)
    .populate('applicant', 'firstName lastName email phone')
    .populate('job', 'title department location employmentType')
    .populate('resume', 'fileName fileUrl isParsed');

  // Send status update email
  try {
    const statusDetails = getStatusEmailDetails(status);
    const displayName = getStatusDisplayName(status);
    const applicantName = `${populatedApp.applicant.firstName} ${populatedApp.applicant.lastName || ''}`.trim();
    
    await sendEmail({
      email: populatedApp.applicant.email,
      subject: `Application Status Update: ${populatedApp.job.title}`,
      message: `Hi ${populatedApp.applicant.firstName},\n\nYour application status for ${populatedApp.job.title} has been updated to: ${displayName}.\n\n${statusDetails.message}\n\n${statusDetails.nextSteps}\n\nBest regards,\nHRMS Team`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">${statusDetails.icon} Status Update</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${populatedApp.applicant.firstName} 👋</h2>
            <p style="color: #666; line-height: 1.6;">
              Your application status for <strong>${populatedApp.job.title}</strong> has been updated to:
            </p>
            <div style="margin: 30px 0; padding: 25px; background: ${statusDetails.bgColor}; border-radius: 8px; border-left: 5px solid ${statusDetails.color}; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${statusDetails.icon}</div>
              <h2 style="margin: 0; color: ${statusDetails.color}; font-size: 24px;">${displayName}</h2>
            </div>
            <p style="color: #666; line-height: 1.6;">
              ${statusDetails.message}
            </p>
            <div style="margin: 30px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e0e0e0;">
              <h3 style="margin-top: 0; color: #333;">📋 Application Details:</h3>
              <p style="margin: 5px 0;"><strong>Position:</strong> ${populatedApp.job.title}</p>
              <p style="margin: 5px 0;"><strong>Department:</strong> ${populatedApp.job.department || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${populatedApp.job.location || 'N/A'}</p>
              <p style="margin: 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div style="margin: 30px 0; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-weight: bold;">
                💡 What's Next?
              </p>
              <p style="margin: 10px 0 0 0; color: #856404;">
                ${statusDetails.nextSteps}
              </p>
            </div>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Thank you for your continued interest in joining our team!
            </p>
            <p style="color: #666; line-height: 1.6; margin-top: 20px;">
              Best regards,<br>
              <strong>HRMS Team</strong>
            </p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Email send error:', err);
  }

  res.status(200).json({
    success: true,
    data: populatedApp
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

// @desc    Schedule AI video interview
// @route   POST /api/v1/applications/:id/ai-interview
// @access  Private (HR/Manager/Admin)
exports.scheduleAIInterview = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('job')
    .populate('resume')
    .populate('applicant', 'firstName lastName email');

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { duration = 30, scheduledDate, notes, questions = 5, secondsPerQuestion } = req.body;

  // Validate duration
  if (duration < 15 || duration > 120) {
    return next(new ErrorResponse('Interview duration must be between 15 and 120 minutes', 400));
  }

  // Validate scheduled date
  if (!scheduledDate) {
    return next(new ErrorResponse('Scheduled date is required', 400));
  }

  const scheduledDateTime = new Date(scheduledDate);
  if (scheduledDateTime < new Date()) {
    return next(new ErrorResponse('Scheduled date must be in the future', 400));
  }

  // Calculate number of questions based on duration (1 question per 5 minutes)
  const numQuestions = Math.floor(duration / 5);

  // Generate interview questions
  const { generateInterviewQuestions, generateUniqueInterviewLink } = require('../services/aiService');
  const generated = await generateInterviewQuestions(application.job, application.resume, duration, { numQuestions });

  // Generate unique link
  const uniqueLink = generateUniqueInterviewLink();

  // Set expiration date (1 day after scheduled date)
  const expiresAt = new Date(scheduledDateTime);
  expiresAt.setDate(expiresAt.getDate() + 1);

  // Create AI interview object
  const aiInterviewData = {
    scheduledDate: scheduledDateTime,
    duration,
    questions: generated.map(q => ({
      ...q,
      timeLimit: 300 // 5 minutes per question
    })),
    uniqueLink,
    expiresAt,
    candidateEmail: application.applicant.email, // Store candidate email for verification
    transcript: [],
    aiFeedback: null,
    completedAt: null
  };

  // Add AI interview to application
  application.interviews.push({
    type: 'ai_video',
    status: 'scheduled',
    aiInterview: aiInterviewData
  });

  application.status = 'interview_scheduled';
  application.timeline.push({
    status: 'ai_interview_scheduled',
    date: Date.now(),
    updatedBy: req.user.id,
    notes: notes || `AI video interview scheduled for ${scheduledDateTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} (${duration} minutes)`
  });

  await application.save();

  // Return interview data with link
  const interview = application.interviews[application.interviews.length - 1];
  const interviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/ai-interview/${uniqueLink}`;

  // Send email to candidate with interview link
  try {
    const candidateName = `${application.applicant.firstName} ${application.applicant.lastName}`;
    const jobTitle = application.job.title;
    const companyName = application.job.company || 'Our Company';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎥 AI Video Interview Invitation</h1>
          </div>
          <div class="content">
            <p>Dear ${candidateName},</p>

            <p>Congratulations! We are pleased to invite you to the next stage of our recruitment process for the <strong>${jobTitle}</strong> position at ${companyName}.</p>

            <div class="info-box">
              <h3>📋 Interview Details:</h3>
              <ul>
                <li><strong>Position:</strong> ${jobTitle}</li>
                <li><strong>Scheduled Date & Time:</strong> ${scheduledDateTime.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>
                <li><strong>Duration:</strong> ${duration} minutes</li>
                <li><strong>Number of Questions:</strong> ${generated.length}</li>
                <li><strong>Link Expires:</strong> ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
              </ul>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> You must be logged in with the email address <strong>${application.applicant.email}</strong> to access this interview. Please log in before clicking the link below.
            </div>

            <h3>🚀 How to Take Your Interview:</h3>
            <ol>
              <li><strong>Log in to your account</strong> using your registered email (${application.applicant.email})</li>
              <li>Click the button below or copy the interview link</li>
              <li>Ensure you have a <strong>stable internet connection</strong></li>
              <li>Find a <strong>quiet environment</strong> with good lighting</li>
              <li>Make sure your <strong>camera and microphone</strong> are working</li>
              <li>The interview will be <strong>recorded</strong> for evaluation purposes</li>
            </ol>

            <div style="text-align: center;">
              <a href="${interviewLink}" class="button">Start AI Interview</a>
            </div>

            <p style="margin-top: 20px;">Or copy this link: <br><code style="background: #e5e7eb; padding: 5px 10px; border-radius: 3px; font-size: 12px;">${interviewLink}</code></p>

            <div class="info-box">
              <h4>💡 Tips for Success:</h4>
              <ul>
                <li>Answer questions naturally and take your time</li>
                <li>Speak clearly and maintain eye contact with the camera</li>
                <li>Be yourself and showcase your skills and experience</li>
                <li>Each question has a time limit, so stay focused</li>
              </ul>
            </div>

            <p>If you have any technical difficulties or questions, please don't hesitate to contact us.</p>

            <p>We look forward to learning more about you!</p>

            <p>Best regards,<br>
            <strong>${companyName} Recruitment Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>This interview link will expire on ${expiresAt.toLocaleDateString()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      email: application.applicant.email,
      subject: `AI Video Interview Invitation - ${jobTitle} Position`,
      message: `You have been invited to take an AI video interview for the ${jobTitle} position. Please log in to your account and visit: ${interviewLink}`,
      html: emailHtml
    });

    console.log(`✅ Interview invitation email sent to ${application.applicant.email}`);
  } catch (emailError) {
    console.error('Failed to send interview invitation email:', emailError);
    // Don't fail the entire request if email fails, just log it
  }

  res.status(200).json({
    success: true,
    data: {
      application: application._id,
      interviewId: interview._id,
      uniqueLink: interviewLink,
      questions: generated.length,
      duration,
      expiresAt,
      emailSent: true
    }
  });
});

// @desc    Get AI interview link
// @route   GET /api/v1/applications/:id/ai-interview-link
// @access  Private (HR/Manager/Admin)
exports.getAIInterviewLink = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  // Find AI interview
  const aiInterview = application.interviews.find(
    interview => interview.type === 'ai_video' && interview.aiInterview
  );

  if (!aiInterview) {
    return next(new ErrorResponse('No AI interview found for this application', 404));
  }

  // Check if link is expired
  if (aiInterview.aiInterview.expiresAt < new Date()) {
    return next(new ErrorResponse('AI interview link has expired', 400));
  }

  res.status(200).json({
    success: true,
    data: {
      uniqueLink: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/ai-interview/${aiInterview.aiInterview.uniqueLink}`,
      expiresAt: aiInterview.aiInterview.expiresAt,
      status: aiInterview.status,
      completedAt: aiInterview.aiInterview.completedAt
    }
  });
});

// @desc    Update AI interview status and feedback
// @route   PUT /api/v1/applications/:id/ai-interview/:interviewId
// @access  Private (HR/Manager/Admin)
exports.updateAIInterviewStatus = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const { status, transcript, notes, recordingUrl, recordingBase64 } = req.body;

  // Find the specific interview
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  // Update status
  if (status) {
    interview.status = status;

    if (status === 'completed') {
      interview.aiInterview.completedAt = new Date();
      // Expire the public link immediately when interview ends
      interview.aiInterview.expiresAt = new Date();

      // Analyze transcript if provided
      if (transcript !== undefined) {
        // Ensure transcript is stored as array of objects with required fields
        let processedTranscript;
        if (Array.isArray(transcript)) {
          processedTranscript = transcript.filter(item =>
            item &&
            typeof item.id !== 'undefined' &&
            typeof item.speaker === 'string' &&
            item.timestamp &&
            typeof item.message === 'string' &&
            item.message.trim() !== ''
          );
        } else if (typeof transcript === 'string' && transcript.trim() !== '') {
          processedTranscript = [{ id: 1, speaker: 'Candidate', timestamp: new Date(), message: transcript }];
        } else {
          processedTranscript = [];
        }

        interview.aiInterview.transcript = processedTranscript;

        // Generate AI feedback only if we have valid transcript data
        if (processedTranscript.length > 0) {
          const { analyzeInterviewTranscript } = require('../services/aiService');
          const feedback = await analyzeInterviewTranscript(processedTranscript, interview.aiInterview.questions);
          interview.aiInterview.aiFeedback = feedback;
        }
      }

      // If a file blob was sent with this completion request, upload it now
      if (req.files && req.files.recording) {
        try {
          const recordingFile = req.files.recording;
          const uploadResult = await uploadVideoRecording(
            recordingFile.data,
            recordingFile.name,
            application._id.toString(),
            interviewId
          );
          interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
          console.log('[AIInterview] Uploaded local recording on completion (status endpoint)', {
            applicationId: application._id.toString(),
            interviewId,
            cloudinaryUrl: uploadResult.url
          });
        } catch (err) {
          console.error('[AIInterview] Failed uploading local recording on completion:', err);
        }
      }

      // If a recording URL is provided in this flow, mirror it to Cloudinary
      if (recordingUrl && typeof recordingUrl === 'string') {
        try {
          const upload = await uploadRemoteVideoUrl(
            recordingUrl,
            application._id.toString(),
            interviewId
          );
          interview.aiInterview.localVideoRecordingUrl = upload.url;
          console.log('[AIInterview] Mirrored recording to Cloudinary (status endpoint)', {
            applicationId: application._id.toString(),
            interviewId,
            cloudinaryUrl: upload.url
          });
        } catch (err) {
          console.error('[AIInterview] Failed to mirror recording on completion:', err);
        }
      }

      // If a base64 recording is provided, decode and upload
      if (!interview.aiInterview.localVideoRecordingUrl && recordingBase64 && typeof recordingBase64 === 'string') {
        try {
          const match = recordingBase64.match(/^data:(.*?);base64,(.*)$/);
          const base64Data = match ? match[2] : recordingBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const uploadResult = await uploadVideoRecording(
            buffer,
            `interview_${interviewId}.webm`,
            application._id.toString(),
            interviewId
          );
          interview.aiInterview.localVideoRecordingUrl = uploadResult.url;
          console.log('[AIInterview] Uploaded base64 recording to Cloudinary (status endpoint)', {
            applicationId: application._id.toString(),
            interviewId,
            cloudinaryUrl: uploadResult.url
          });
        } catch (err) {
          console.error('[AIInterview] Failed uploading base64 recording on completion:', err);
        }
      }

      // Update application status
      application.status = 'interviewed';
      application.timeline.push({
        status: 'ai_interview_completed',
        date: Date.now(),
        updatedBy: req.user.id,
        notes: notes || 'AI video interview completed'
      });

    console.log('[Recording] Ended interview video recording', {
        applicationId: application._id.toString(),
        interviewId,
      localUrl: interview.aiInterview.localVideoRecordingUrl || null,
        providerUrl: null
      });

      if (interview.aiInterview.localVideoRecordingUrl) {
        console.log('[Recording] Cloudinary URL', {
          applicationId: application._id.toString(),
          interviewId,
          cloudinaryUrl: interview.aiInterview.localVideoRecordingUrl
        });
      } else {
        console.error('[Recording] Missing recording payload on completion; no Cloudinary URL produced. Include one of: multipart recording file, recordingUrl, or recordingBase64.');
      }
    }
  }

  await application.save();

  res.status(200).json({
    success: true,
    data: application,
    cloudinaryUrl: application.interviews.id(interviewId)?.aiInterview?.localVideoRecordingUrl || null
  });
});

// @desc    Update AI interview status via public link (for candidates)
// @route   PUT /api/v1/applications/public/ai-interview/:link
// @access  Private (Must be authenticated as the candidate)
exports.updateAIInterviewStatusPublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;
  const { status, transcript } = req.body;

  // Find application and interview by link
  const application = await Application.findOne({
    'interviews.aiInterview.uniqueLink': link
  })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title company');

  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }

  const interview = application.interviews.find(
    i => i.aiInterview && i.aiInterview.uniqueLink === link
  );

  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  // Verify the logged-in user's email matches the candidate email (if authentication is enabled)
  if (req.user) {
    const candidateEmail = interview.aiInterview.candidateEmail;
    if (candidateEmail && req.user.email !== candidateEmail) {
      return next(new ErrorResponse(`This interview is assigned to ${candidateEmail}. Please log in with the correct account.`, 403));
    }
  }

  // Update status
  if (status) {
    interview.status = status;

    if (status === 'completed') {
      interview.aiInterview.completedAt = new Date();
      // Expire the public link immediately when interview ends
      interview.aiInterview.expiresAt = new Date();

      // Process transcript if provided
      if (transcript !== undefined) {
        let processedTranscript;
        if (Array.isArray(transcript)) {
          processedTranscript = transcript.filter(item =>
            item &&
            typeof item.id !== 'undefined' &&
            typeof item.speaker === 'string' &&
            item.timestamp &&
            typeof item.message === 'string' &&
            item.message.trim() !== ''
          );
        } else if (typeof transcript === 'string' && transcript.trim() !== '') {
          processedTranscript = [{ id: 1, speaker: 'Candidate', timestamp: new Date(), message: transcript }];
        } else {
          processedTranscript = [];
        }

        interview.aiInterview.transcript = processedTranscript;

        // Generate AI feedback only if we have valid transcript data
        if (processedTranscript.length > 0) {
          try {
            const { analyzeInterviewTranscript } = require('../services/aiService');
            const feedback = await analyzeInterviewTranscript(processedTranscript, interview.aiInterview.questions);
            interview.aiInterview.aiFeedback = feedback;
          } catch (err) {
            console.error('[AIInterview] Failed to analyze transcript:', err);
          }
        }
      }

      // Update application status
      application.status = 'interviewed';
      application.timeline.push({
        status: 'ai_interview_completed',
        date: new Date(),
        notes: 'AI interview completed by candidate'
      });

      // Send completion confirmation email
      try {
        const candidateName = `${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim() || 'Candidate';
        const jobTitle = application.job?.title || 'the position';
        const companyName = application.job?.company || 'Our Company';
        const duration = interview.aiInterview.duration || 30;

        await sendEmail({
          email: application.applicant.email,
          subject: 'AI Video Interview Completed Successfully',
          message: `Dear ${candidateName},\n\nThank you for completing your AI video interview for the ${jobTitle} position at ${companyName}.\n\nYour interview has been recorded and submitted for review. Our hiring team will evaluate your responses and get back to you soon.\n\nThank you for your time and interest in joining our team!\n\nBest regards,\nHRMS Recruitment Team`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Interview Completed</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello ${candidateName} 👋</h2>
                <p style="color: #666; line-height: 1.6;">
                  Thank you for completing your AI video interview for the <strong>${jobTitle}</strong> position at ${companyName}!
                </p>
                <div style="margin: 30px 0; padding: 20px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #4caf50;">
                  <h3 style="margin-top: 0; color: #2e7d32;">🎉 Interview Summary:</h3>
                  <p style="margin: 5px 0;"><strong>Position:</strong> ${jobTitle}</p>
                  <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
                  <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration} minutes</p>
                  <p style="margin: 5px 0;"><strong>Completed:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  Your interview has been recorded and submitted for review. Our hiring team will carefully evaluate your responses and get back to you soon regarding the next steps in the hiring process.
                </p>
                <div style="margin: 30px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                  <p style="margin: 0; color: #1976d2; font-weight: bold;">
                    💼 What's Next?
                  </p>
                  <ul style="color: #1976d2; margin: 10px 0 0 20px; padding: 0;">
                    <li>Our team will review your interview responses</li>
                    <li>You'll receive email updates on your application status</li>
                    <li>You can track your application progress in your dashboard</li>
                  </ul>
                </div>
                <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                  Thank you for your time and interest in joining our team!
                </p>
                <p style="color: #666; line-height: 1.6; margin-top: 20px;">
                  Best regards,<br>
                  <strong>${companyName} Recruitment Team</strong>
                </p>
              </div>
            </div>
          `
        });
        console.log(`✅ Interview completion email sent to ${application.applicant.email}`);
      } catch (emailError) {
        console.error('Failed to send interview completion email:', emailError);
        // Don't fail the entire request if email fails
      }
    }
  }

  await application.save();

  res.status(200).json({
    success: true,
    data: {
      status: interview.status,
      completedAt: interview.aiInterview.completedAt
    }
  });
});

// @desc    Get AI interview by unique link (public route for candidates)
// @route   GET /api/v1/public/ai-interview/:link
// @access  Public
// @desc    Get AI interview by unique link (requires authentication)
// @route   GET /api/v1/applications/public/ai-interview/:link
// @access  Private (Must be authenticated as the candidate)
exports.getAIInterviewByLink = asyncHandler(async (req, res, next) => {
  try {
    const { link } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'You must be logged in to access this interview',
        requiresAuth: true
      });
    }

    const application = await Application.findOne({
      'interviews.aiInterview.uniqueLink': link
    }).populate('job', 'title company description').populate('applicant', 'firstName lastName email');

    if (!application) {
      return next(new ErrorResponse('Invalid interview link', 404));
    }

    const aiInterview = application.interviews.find(
      interview => interview.aiInterview && interview.aiInterview.uniqueLink === link
    );

    if (!aiInterview) {
      return next(new ErrorResponse('Interview not found', 404));
    }

    // Verify the logged-in user's email matches the candidate email
    const candidateEmail = aiInterview.aiInterview.candidateEmail || application.applicant.email;
    if (req.user.email !== candidateEmail) {
      return res.status(403).json({
        success: false,
        error: `This interview is assigned to ${candidateEmail}. Please log in with the correct account.`,
        requiresCorrectAccount: true,
        expectedEmail: candidateEmail
      });
    }

    // If interview is completed or expired, return 410 Gone to prevent access
    if (aiInterview.status === 'completed' || aiInterview.aiInterview.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        expired: true,
        error: 'This interview link has expired'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        application: {
          _id: application._id.toString(),
          job: {
            title: application.job.title,
            company: application.job.company,
            description: application.job.description
          },
          applicant: {
            firstName: application.applicant.firstName,
            lastName: application.applicant.lastName,
            email: application.applicant.email
          }
        },
        _id: aiInterview._id.toString(),
        type: aiInterview.type,
        status: aiInterview.status,
        aiInterview: {
          duration: aiInterview.aiInterview.duration,
          questions: aiInterview.aiInterview.questions || [],
          expiresAt: aiInterview.aiInterview.expiresAt,
          completedAt: aiInterview.aiInterview.completedAt || null,
          localVideoRecordingUrl: aiInterview.aiInterview.localVideoRecordingUrl || null
        }
      }
    });
  } catch (error) {
    console.error('Error in getAIInterviewByLink:', error);
    return next(new ErrorResponse('Failed to retrieve interview', 500));
  }
});


// Vapi integration removed

// @desc    Verify if recording URL exists in database
// @route   GET /api/v1/applications/:id/ai-interview/:interviewId/recording/verify
// @access  Private (HR/Manager/Admin)
exports.verifyRecordingInDatabase = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const interview = application.interviews.id(interviewId);

  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  if (!interview.aiInterview) {
    return next(new ErrorResponse('AI interview data not found', 404));
  }

  const videoUrl = interview.aiInterview.localVideoRecordingUrl;
  const audioUrl = interview.aiInterview.localAudioRecordingUrl;

  res.status(200).json({
    success: true,
    data: {
      applicationId: application._id.toString(),
      interviewId: interviewId,
      hasVideoRecording: !!videoUrl,
      hasAudioRecording: !!audioUrl,
      videoRecordingUrl: videoUrl || null,
      audioRecordingUrl: audioUrl || null,
      recordingExists: !!(videoUrl || audioUrl)
    }
  });
});

// @desc    Verify if recording URL exists in database (Public by link)
// @route   GET /api/v1/applications/public/ai-interview/:link/recording/verify
// @access  Public (candidate via unique link)
exports.verifyRecordingInDatabasePublic = asyncHandler(async (req, res, next) => {
  const { link } = req.params;

  // Find application and interview by link
  const application = await Application.findOne({
    'interviews.aiInterview.uniqueLink': link
  });

  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }

  const interview = application.interviews.find(
    i => i.aiInterview && i.aiInterview.uniqueLink === link
  );

  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  const videoUrl = interview.aiInterview.localVideoRecordingUrl;
  const audioUrl = interview.aiInterview.localAudioRecordingUrl;

  res.status(200).json({
    success: true,
    data: {
      applicationId: application._id.toString(),
      interviewId: interview._id.toString(),
      hasVideoRecording: !!videoUrl,
      hasAudioRecording: !!audioUrl,
      videoRecordingUrl: videoUrl || null,
      audioRecordingUrl: audioUrl || null,
      recordingExists: !!(videoUrl || audioUrl)
    }
  });
});
