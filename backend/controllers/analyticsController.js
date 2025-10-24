const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { matchCandidateToJob } = require('../services/aiService');

// @desc    Get dashboard analytics
// @route   GET /api/v1/analytics/dashboard
// @access  Private (HR/Manager/Admin)
exports.getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  const [
    totalJobs,
    openJobs,
    totalApplications,
    pendingApplications,
    totalUsers,
    activeUsers
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: 'open' }),
    Application.countDocuments(),
    Application.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    User.countDocuments(),
    User.countDocuments({ isActive: true })
  ]);

  // Applications by status
  const applicationsByStatus = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Jobs by department
  const jobsByDepartment = await Job.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        openPositions: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        }
      }
    }
  ]);

  // Recent applications
  const recentApplications = await Application.find()
    .populate('job', 'title department')
    .populate('applicant', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10);

  // Top jobs by applications
  const topJobs = await Job.find()
    .sort({ applicationsCount: -1 })
    .limit(5)
    .select('title department applicationsCount viewsCount');

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalJobs,
        openJobs,
        totalApplications,
        pendingApplications,
        totalUsers,
        activeUsers
      },
      applicationsByStatus,
      jobsByDepartment,
      recentApplications,
      topJobs
    }
  });
});

// @desc    Get application analytics
// @route   GET /api/v1/analytics/applications
// @access  Private (HR/Manager/Admin)
exports.getApplicationAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, department } = req.query;

  const matchStage = {};
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Applications trend over time
  const applicationsTrend = await Application.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Average time to hire
  const hiredApplications = await Application.find({
    status: 'accepted',
    ...matchStage
  });

  let avgTimeToHire = 0;
  if (hiredApplications.length > 0) {
    const totalTime = hiredApplications.reduce((acc, app) => {
      const submitDate = new Date(app.createdAt);
      const hireDate = new Date(app.updatedAt);
      return acc + (hireDate - submitDate);
    }, 0);
    avgTimeToHire = Math.round(totalTime / hiredApplications.length / (1000 * 60 * 60 * 24)); // Convert to days
  }

  // Conversion rates
  const totalApps = await Application.countDocuments(matchStage);
  const shortlistedApps = await Application.countDocuments({ ...matchStage, status: { $in: ['shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'accepted'] } });
  const interviewedApps = await Application.countDocuments({ ...matchStage, status: { $in: ['interviewed', 'offer_extended', 'accepted'] } });
  const hiredApps = await Application.countDocuments({ ...matchStage, status: 'accepted' });

  const conversionRates = {
    applicationToShortlist: totalApps > 0 ? ((shortlistedApps / totalApps) * 100).toFixed(2) : 0,
    shortlistToInterview: shortlistedApps > 0 ? ((interviewedApps / shortlistedApps) * 100).toFixed(2) : 0,
    interviewToHire: interviewedApps > 0 ? ((hiredApps / interviewedApps) * 100).toFixed(2) : 0
  };

  res.status(200).json({
    success: true,
    data: {
      applicationsTrend,
      avgTimeToHire,
      conversionRates,
      totalApplications: totalApps
    }
  });
});

// @desc    Get job analytics
// @route   GET /api/v1/analytics/jobs
// @access  Private (HR/Manager/Admin)
exports.getJobAnalytics = asyncHandler(async (req, res, next) => {
  // Jobs by status
  const jobsByStatus = await Job.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Jobs by employment type
  const jobsByEmploymentType = await Job.aggregate([
    {
      $group: {
        _id: '$employmentType',
        count: { $sum: 1 }
      }
    }
  ]);

  // Average applications per job
  const avgApplicationsPerJob = await Job.aggregate([
    {
      $group: {
        _id: null,
        avgApplications: { $avg: '$applicationsCount' },
        avgViews: { $avg: '$viewsCount' }
      }
    }
  ]);

  // Most viewed jobs
  const mostViewedJobs = await Job.find()
    .sort({ viewsCount: -1 })
    .limit(10)
    .select('title department viewsCount applicationsCount');

  res.status(200).json({
    success: true,
    data: {
      jobsByStatus,
      jobsByEmploymentType,
      averages: avgApplicationsPerJob[0] || { avgApplications: 0, avgViews: 0 },
      mostViewedJobs
    }
  });
});

// @desc    AI-powered candidate matching
// @route   POST /api/v1/analytics/candidate-match
// @access  Private (HR/Manager/Admin)
exports.matchCandidates = asyncHandler(async (req, res, next) => {
  const { jobId, minScore } = req.body;

  if (!jobId) {
    return next(new ErrorResponse('Please provide a job ID', 400));
  }

  const job = await Job.findById(jobId);
  if (!job) {
    return next(new ErrorResponse('Job not found', 404));
  }

  // Get all applications for this job
  const applications = await Application.find({ job: jobId })
    .populate('resume')
    .populate('applicant', 'firstName lastName email');

  // Match candidates using AI
  const matches = await Promise.all(
    applications.map(async (app) => {
      const score = await matchCandidateToJob(app, job);
      return {
        application: app,
        matchScore: score.overallScore,
        details: score
      };
    })
  );

  // Filter by minimum score if provided
  let filteredMatches = matches;
  if (minScore) {
    filteredMatches = matches.filter(m => m.matchScore >= minScore);
  }

  // Sort by match score
  filteredMatches.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    count: filteredMatches.length,
    data: filteredMatches
  });
});

// @desc    Get recent system logs
// @route   GET /api/v1/analytics/logs
// @access  Private (Admin)
exports.getSystemLogs = asyncHandler(async (req, res, next) => {
  const Log = require('../models/Log');
  const limit = parseInt(req.query.limit, 10) || 10;
  const level = req.query.level; // filter by level: info, warn, error, debug
  const category = req.query.category; // filter by category

  const query = {};
  if (level) query.level = level;
  if (category) query.category = category;

  const logs = await Log.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: logs
  });
});
