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

  await application.save({ validateBeforeSave: false });

  // Populate the application before sending response
  const populatedApp = await Application.findById(application._id)
    .populate('applicant', 'firstName lastName email phone')
    .populate('job', 'title department location employmentType')
    .populate('resume', 'fileName fileUrl isParsed');

  // Send status update email
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
    .populate('resume');

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { duration = 30, notes } = req.body;

  // Validate duration
  if (duration < 15 || duration > 120) {
    return next(new ErrorResponse('Interview duration must be between 15 and 120 minutes', 400));
  }

  // Generate interview questions
  const { generateInterviewQuestions, generateUniqueInterviewLink } = require('../services/aiService');
  const questions = await generateInterviewQuestions(application.job, application.resume, duration);

  // Generate unique link
  const uniqueLink = generateUniqueInterviewLink();

  // Set expiration date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create AI interview object
  const aiInterviewData = {
    duration,
    questions,
    uniqueLink,
    expiresAt,
    vapiSessionId: null, // Will be set when Vapi session is created
    vapiCallId: null,
    transcript: '',
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
    notes: notes || `AI video interview scheduled for ${duration} minutes`
  });

  await application.save();

  // Return interview data with link
  const interview = application.interviews[application.interviews.length - 1];

  res.status(200).json({
    success: true,
    data: {
      application: application._id,
      interviewId: interview._id,
      uniqueLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ai-interview/${uniqueLink}`,
      questions: questions.length,
      duration,
      expiresAt
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
      uniqueLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/ai-interview/${aiInterview.aiInterview.uniqueLink}`,
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
  const { status, transcript, vapiCallId, notes } = req.body;

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

      // Analyze transcript if provided
      if (transcript) {
        interview.aiInterview.transcript = transcript;
        interview.aiInterview.vapiCallId = vapiCallId || interview.aiInterview.vapiCallId;

        // Generate AI feedback
        const { analyzeInterviewTranscript } = require('../services/aiService');
        const feedback = await analyzeInterviewTranscript(transcript, interview.aiInterview.questions);
        interview.aiInterview.aiFeedback = feedback;
      }

      // Update application status
      application.status = 'interviewed';
      application.timeline.push({
        status: 'ai_interview_completed',
        date: Date.now(),
        updatedBy: req.user.id,
        notes: notes || 'AI video interview completed'
      });
    }
  }

  await application.save();

  res.status(200).json({
    success: true,
    data: application
  });
});

// @desc    Get AI interview by unique link (public route for candidates)
// @route   GET /api/v1/public/ai-interview/:link
// @access  Public
exports.getAIInterviewByLink = asyncHandler(async (req, res, next) => {
  const { link } = req.params;

  // Find application with this unique link
  const application = await Application.findOne({
    'interviews.aiInterview.uniqueLink': link
  })
  .populate('job', 'title company description')
  .populate('applicant', 'firstName lastName email');

  if (!application) {
    return next(new ErrorResponse('Invalid interview link', 404));
  }

  // Find the specific AI interview
  const aiInterview = application.interviews.find(
    interview => interview.aiInterview && interview.aiInterview.uniqueLink === link
  );

  if (!aiInterview) {
    return next(new ErrorResponse('Interview not found', 404));
  }

  // Check if link is expired
  if (aiInterview.aiInterview.expiresAt < new Date()) {
    return next(new ErrorResponse('This interview link has expired', 400));
  }

  // Check if interview is still available
  if (aiInterview.status === 'completed') {
    return next(new ErrorResponse('This interview has already been completed', 400));
  }

  res.status(200).json({
    success: true,
    data: {
      interviewId: aiInterview._id,
      applicationId: application._id,
      candidate: {
        firstName: application.applicant.firstName,
        lastName: application.applicant.lastName,
        email: application.applicant.email
      },
      job: {
        title: application.job.title,
        company: application.job.company,
        description: application.job.description
      },
      questions: aiInterview.aiInterview.questions,
      duration: aiInterview.aiInterview.duration,
      expiresAt: aiInterview.aiInterview.expiresAt,
      vapiAssistantId: aiInterview.aiInterview.vapiAssistantId || '5966f84b-85ec-47ca-b294-9b1ca366ac2f' // Default assistant ID
    }
  });
});

// @desc    Get Vapi configuration for interview
// @route   GET /api/v1/applications/:id/vapi-config
// @access  Private (HR/Manager/Admin)
exports.getVapiConfig = asyncHandler(async (req, res, next) => {
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

  // Vapi configuration - in production, these should come from environment variables
  const vapiConfig = {
    apiKey: process.env.VAPI_API_KEY || 'your-vapi-api-key', // Should be set in .env
    assistantId: aiInterview.aiInterview.vapiAssistantId || '5966f84b-85ec-47ca-b294-9b1ca366ac2f',
    model: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
    },
    voice: {
      provider: "11labs",
      voiceId: "burt",
    }
  };

  res.status(200).json({
    success: true,
    data: vapiConfig
  });
});

// @desc    Update AI interview with Vapi call details
// @route   PUT /api/v1/applications/:id/ai-interview/:interviewId/vapi
// @access  Private (HR/Manager/Admin)
exports.updateAIInterviewWithVapi = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);

  if (!application) {
    return next(new ErrorResponse(`Application not found with id of ${req.params.id}`, 404));
  }

  const { interviewId } = req.params;
  const { vapiCallId, transcript, recordingUrl, duration, feedback, completedAt } = req.body;

  // Find the specific interview
  const interview = application.interviews.id(interviewId);
  if (!interview || interview.type !== 'ai_video') {
    return next(new ErrorResponse('AI interview not found', 404));
  }

  // Update Vapi-related fields
  if (vapiCallId) {
    interview.aiInterview.vapiCallId = vapiCallId;
  }

  if (transcript) {
    interview.aiInterview.transcript = transcript;
  }

  if (recordingUrl) {
    interview.aiInterview.recordingUrl = recordingUrl;
  }

  if (duration) {
    interview.aiInterview.actualDuration = duration;
  }

  if (feedback) {
    interview.aiInterview.candidateFeedback = feedback;
  }

  if (completedAt) {
    interview.aiInterview.completedAt = new Date(completedAt);
    interview.status = 'completed';

    // Update application status
    application.status = 'interviewed';
    application.timeline.push({
      status: 'ai_interview_completed',
      date: new Date(),
      notes: 'AI video interview completed via Vapi'
    });
  }

  await application.save();

  res.status(200).json({
    success: true,
    data: application
  });
});
