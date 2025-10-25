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
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
  const level = req.query.level; // filter by level: info, warn, error, debug
  const category = req.query.category; // filter by category

  const query = {};
  if (level) query.level = level;
  if (category) query.category = category;

  // Get total count for the query
  const totalCount = await Log.countDocuments(query);

  // Build the base query
  let logsQuery = Log.find(query)
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: -1 });

  // Apply limit only if specified and is a positive number
  if (limit && limit > 0) {
    logsQuery = logsQuery.limit(limit);
  }
  // If no limit specified, fetch all logs

  const logs = await logsQuery;

  res.status(200).json({
    success: true,
    count: logs.length,
    total: totalCount,
    data: logs
  });
});

// @desc    Delete a log entry
// @route   DELETE /api/v1/analytics/logs/:id
// @access  Private (Admin)
exports.deleteLog = asyncHandler(async (req, res, next) => {
  const Log = require('../models/Log');
  const log = await Log.findById(req.params.id);

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Log not found'
    });
  }

  const deletedLogInfo = {
    level: log.level,
    message: log.message,
    action: log.action
  };

  await log.deleteOne();

  // Create audit log for deletion
  await Log.create({
    level: 'info',
    message: 'Log entry deleted',
    action: 'DELETE_LOG',
    details: `Deleted log: ${deletedLogInfo.action || deletedLogInfo.message}`,
    user: req.user.id,
    category: 'system'
  });

  res.status(200).json({
    success: true,
    message: 'Log deleted successfully'
  });
});

// @desc    Delete multiple log entries
// @route   POST /api/v1/analytics/logs/delete-batch
// @access  Private (Admin)
exports.deleteBatchLogs = asyncHandler(async (req, res, next) => {
  const Log = require('../models/Log');
  const { logIds } = req.body;

  if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of log IDs to delete'
    });
  }

  // Fetch logs to be deleted for audit trail
  const logsToDelete = await Log.find({ _id: { $in: logIds } });
  
  if (logsToDelete.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No logs found with the provided IDs'
    });
  }

  // Delete all logs
  const deleteResult = await Log.deleteMany({ _id: { $in: logIds } });

  // Create a single audit log for the batch deletion
  await Log.create({
    level: 'info',
    message: `Batch deletion of ${deleteResult.deletedCount} log entries`,
    action: 'DELETE_LOGS_BATCH',
    details: `Admin deleted ${deleteResult.deletedCount} log entries. IDs: ${logIds.slice(0, 5).join(', ')}${logIds.length > 5 ? '...' : ''}`,
    user: req.user.id,
    category: 'system'
  });

  res.status(200).json({
    success: true,
    message: `Successfully deleted ${deleteResult.deletedCount} log entries`,
    deletedCount: deleteResult.deletedCount
  });
});

// @desc    Get manager dashboard analytics
// @route   GET /api/v1/analytics/manager-dashboard
// @access  Private (Manager/Admin)
exports.getManagerDashboardAnalytics = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const userDepartment = req.user.department;

  // For managers, filter jobs by their department
  const departmentQuery = userDepartment ? { department: userDepartment } : {};

  // Get open positions count for department
  const openPositions = await Job.countDocuments({
    ...departmentQuery,
    status: 'open'
  });

  // Get all jobs for this department/manager
  const departmentJobs = await Job.find(departmentQuery).select('_id');
  const departmentJobIds = departmentJobs.map(job => job._id);

  // Get applications count for department jobs
  const totalApplications = await Application.countDocuments({
    job: { $in: departmentJobIds }
  });

  // Get applications from last month
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const lastMonthApplications = await Application.countDocuments({
    job: { $in: departmentJobIds },
    createdAt: { $lt: lastMonth }
  });

  const applicationTrend = lastMonthApplications > 0 
    ? Math.round(((totalApplications - lastMonthApplications) / lastMonthApplications) * 100)
    : 0;

  // Get interviews scheduled
  const interviewsScheduled = await Application.countDocuments({
    job: { $in: departmentJobIds },
    status: { $in: ['interview_scheduled', 'interviewed'] }
  });

  // Get pending approvals (jobs in on-hold status or applications needing review)
  const pendingJobApprovals = await Job.countDocuments({
    ...departmentQuery,
    status: 'on-hold'
  });

  const pendingApplicationReviews = await Application.countDocuments({
    job: { $in: departmentJobIds },
    status: 'under_review'
  });

  const pendingApprovals = pendingJobApprovals + pendingApplicationReviews;

  // Get active job requisitions with details
  const activeRequisitions = await Job.find({
    ...departmentQuery,
    status: { $in: ['open', 'on-hold'] }
  })
    .select('title status openings applicationsCount')
    .sort({ createdAt: -1 })
    .limit(10);

  // Get application count and interview count for each requisition
  const requisitionsWithDetails = await Promise.all(
    activeRequisitions.map(async (job) => {
      const interviewCount = await Application.countDocuments({
        job: job._id,
        status: { $in: ['interview_scheduled', 'interviewed', 'offer_extended', 'accepted'] }
      });

      return {
        _id: job._id,
        title: job.title,
        status: job.status,
        applicants: job.applicationsCount || 0,
        interviews: interviewCount,
        openings: job.openings
      };
    })
  );

  // Get hiring progress by position
  const hiringProgress = await Promise.all(
    activeRequisitions.map(async (job) => {
      const hiredCount = await Application.countDocuments({
        job: job._id,
        status: 'accepted'
      });

      const progressPercentage = job.openings > 0
        ? Math.round((hiredCount / job.openings) * 100)
        : 0;

      return {
        role: job.title,
        current: hiredCount,
        target: job.openings,
        progress: progressPercentage
      };
    })
  );

  // Get top candidates (shortlisted and interviewed)
  const topCandidates = await Application.find({
    job: { $in: departmentJobIds },
    status: { $in: ['shortlisted', 'interview_scheduled', 'interviewed'] },
    'aiScore.overallScore': { $exists: true }
  })
    .populate('applicant', 'firstName lastName email')
    .populate('job', 'title')
    .populate('resume', 'parsedData')
    .sort({ 'aiScore.overallScore': -1 })
    .limit(10);

  const candidatesData = topCandidates.map(app => ({
    _id: app._id,
    name: `${app.applicant.firstName} ${app.applicant.lastName}`,
    email: app.applicant.email,
    position: app.job.title,
    experience: app.resume?.parsedData?.experience?.length 
      ? `${app.resume.parsedData.experience.length} years` 
      : 'N/A',
    skills: app.resume?.parsedData?.skills || [],
    score: app.aiScore?.overallScore || 0,
    status: app.status,
    interviews: app.interviews || []
  }));

  // Get pending approvals details
  const pendingApprovalsDetails = [];

  // Add job approvals
  const jobApprovals = await Job.find({
    ...departmentQuery,
    status: 'on-hold'
  })
    .select('title createdAt postedBy')
    .populate('postedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(5);

  jobApprovals.forEach(job => {
    pendingApprovalsDetails.push({
      _id: job._id,
      type: 'Job Posting',
      title: job.title,
      requester: `${job.postedBy?.firstName || ''} ${job.postedBy?.lastName || 'System'}`,
      date: job.createdAt,
      status: 'pending'
    });
  });

  // Add offer letters that need approval (applications with offer_extended status)
  const offerApprovals = await Application.find({
    job: { $in: departmentJobIds },
    status: 'offer_extended'
  })
    .populate('applicant', 'firstName lastName')
    .populate('job', 'title')
    .populate('timeline.updatedBy', 'firstName lastName')
    .sort({ updatedAt: -1 })
    .limit(5);

  offerApprovals.forEach(app => {
    const lastUpdate = app.timeline[app.timeline.length - 1];
    pendingApprovalsDetails.push({
      _id: app._id,
      type: 'Offer Letter',
      title: `${app.applicant.firstName} ${app.applicant.lastName} - ${app.job.title}`,
      requester: lastUpdate?.updatedBy 
        ? `${lastUpdate.updatedBy.firstName} ${lastUpdate.updatedBy.lastName}`
        : 'HR Team',
      date: app.updatedAt,
      status: 'pending'
    });
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        openPositions,
        totalApplications,
        applicationTrend,
        interviewsScheduled,
        pendingApprovals
      },
      activeRequisitions: requisitionsWithDetails,
      hiringProgress,
      topCandidates: candidatesData,
      pendingApprovals: pendingApprovalsDetails
    }
  });
});
