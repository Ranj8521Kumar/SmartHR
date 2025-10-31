import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import StatsCard from '../shared/StatsCard';
import CreateJobForm from '../jobs/CreateJobForm';
import EditJobForm from '../jobs/EditJobForm';
import ViewApplicationsDialog from '../jobs/ViewApplicationsDialog';
import ApplicationDetailsDialog from '../applications/ApplicationDetailsDialog';
import CandidateDetailsDialog from '../candidates/CandidateDetailsDialog';
import InterviewDetailsDialog from '../interviews/InterviewDetailsDialog';
import CommunicationDetailsDialog from '../communications/CommunicationDetailsDialog';
import SettingsDialog from '../settings/SettingsDialog';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  User,
  Calendar,
  Mail,
  BarChart3,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  Filter,
  Phone,
  Video,
  Send,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Gift,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import dashboardService from '../../services/dashboardService';
import applicationService from '../../services/applicationService';
import candidateService from '../../services/candidateService';
import interviewService from '../../services/interviewService';
import communicationService from '../../services/communicationService';
import analyticsService from '../../services/analyticsService';

const kanbanStages = [
  { 
    name: 'Applied', 
    count: 24,
    color: 'bg-gray-100',
    applications: [
      { id: 1, name: 'John Smith', position: 'Developer', score: 85 },
      { id: 2, name: 'Sarah Lee', position: 'Designer', score: 90 },
    ]
  },
  { 
    name: 'Screening', 
    count: 12,
    color: 'bg-blue-100',
    applications: [
      { id: 3, name: 'Mike Johnson', position: 'Manager', score: 88 },
    ]
  },
  { 
    name: 'Interview', 
    count: 8,
    color: 'bg-purple-100',
    applications: [
      { id: 4, name: 'Emma Wilson', position: 'Developer', score: 92 },
      { id: 5, name: 'Tom Brown', position: 'Analyst', score: 87 },
    ]
  },
  { 
    name: 'Offer', 
    count: 5,
    color: 'bg-green-100',
    applications: [
      { id: 6, name: 'Lisa Chen', position: 'Designer', score: 94 },
    ]
  },
  { 
    name: 'Hired', 
    count: 15,
    color: 'bg-green-200',
    applications: []
  },
];

export default function HRManagerDashboard({ user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [applicationsData, setApplicationsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [isViewApplicationsOpen, setIsViewApplicationsOpen] = useState(false);
  const [isApplicationDetailsOpen, setIsApplicationDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  
  // Applications page state
  const [allApplications, setAllApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentApplicationsPage, setCurrentApplicationsPage] = useState(1);
  const [applicationsPerPage] = useState(10);

  // Candidates page state
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all');
  const [isCandidateDetailsOpen, setIsCandidateDetailsOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [currentCandidatesPage, setCurrentCandidatesPage] = useState(1);
  const [candidatesPerPage] = useState(10);

  // Interviews page state
  const [allInterviews, setAllInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewSearchQuery, setInterviewSearchQuery] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('all');
  const [currentInterviewsPage, setCurrentInterviewsPage] = useState(1);
  const [interviewsPerPage] = useState(10);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set());
  
  const [isInterviewDetailsOpen, setIsInterviewDetailsOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load read notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`readNotifications_${user.id}`);
    if (saved) {
      try {
        setReadNotifications(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Error loading read notifications:', e);
      }
    }
  }, [user.id]);

  // Save read notifications to localStorage whenever it changes
  useEffect(() => {
    if (readNotifications.size > 0) {
      localStorage.setItem(
        `readNotifications_${user.id}`,
        JSON.stringify([...readNotifications])
      );
    }
  }, [readNotifications, user.id]);

  // Communications page state
  const [allCommunications, setAllCommunications] = useState([]);
  const [filteredCommunications, setFilteredCommunications] = useState([]);
  const [communicationsLoading, setCommunicationsLoading] = useState(false);
  const [communicationSearchQuery, setCommunicationSearchQuery] = useState('');
  const [communicationTypeFilter, setCommunicationTypeFilter] = useState('all');
  const [isCommunicationDetailsOpen, setIsCommunicationDetailsOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [currentCommunicationsPage, setCurrentCommunicationsPage] = useState(1);
  const [communicationsPerPage] = useState(10);

  // Analytics page state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [applicationAnalytics, setApplicationAnalytics] = useState(null);
  const [jobAnalytics, setJobAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days

  // Jobs pagination state
  const [allJobs, setAllJobs] = useState([]);
  const [currentJobsPage, setCurrentJobsPage] = useState(1);
  const [jobsPerPage] = useState(10);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [
        dashboardResponse, 
        applicationsResponse, 
        jobsResponse, 
        candidatesResponse, 
        communicationsResponse, 
        interviewsResponse
      ] = await Promise.all([
        dashboardService.getDashboardAnalytics(),
        dashboardService.getApplications({ limit: 10, sort: '-createdAt' }),
        dashboardService.getJobs({ limit: 1000 }).catch(() => ({ data: [] })),
        candidateService.getCandidates().catch(() => ({ data: [] })),
        communicationService.getCommunications().catch(() => ({ data: [] })),
        interviewService.getInterviews().catch(() => ({ data: [] }))
      ]);

      setDashboardData(dashboardResponse.data);
      setApplicationsData(applicationsResponse.data || []);
      
      // Set counts for badges
      if (jobsResponse.success && jobsResponse.data) {
        setAllJobs(jobsResponse.data);
      }
      if (candidatesResponse.success && candidatesResponse.data) {
        setAllCandidates(candidatesResponse.data);
      }
      if (communicationsResponse.success && communicationsResponse.data) {
        setAllCommunications(communicationsResponse.data);
      }
      if (interviewsResponse.success && interviewsResponse.data) {
        setAllInterviews(interviewsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Generate notifications from applications and jobs
  useEffect(() => {
    const generatedNotifications = [];
    
    // Get recent applications (last 24 hours or pending status)
    if (applicationsData && applicationsData.length > 0) {
      const recentApplications = applicationsData.filter(app => {
        const appDate = new Date(app.createdAt);
        const hoursDiff = (new Date() - appDate) / (1000 * 60 * 60);
        return hoursDiff < 24 || app.status === 'Pending';
      }).slice(0, 5);

      recentApplications.forEach(app => {
        const timeAgo = formatTimeAgo(new Date(app.createdAt));
        const candidateName = app.applicant 
          ? `${app.applicant.firstName || ''} ${app.applicant.lastName || ''}`.trim() || 'Unknown'
          : 'Unknown';
        generatedNotifications.push({
          id: app._id,
          type: 'info',
          message: `New application from ${candidateName} for ${app.job?.title || 'a position'}`,
          time: timeAgo,
          read: readNotifications.has(app._id), // Check if notification was read
          applicationId: app._id
        });
      });
    }

    // Add interview notifications
    if (allInterviews && allInterviews.length > 0) {
      const upcomingInterviews = allInterviews.filter(interview => {
        const interviewDate = new Date(interview.scheduledDate);
        return interviewDate > new Date() && interview.status === 'Scheduled';
      }).slice(0, 3);

      upcomingInterviews.forEach(interview => {
        const interviewNotifId = `interview-${interview._id}`;
        const candidateName = interview.candidate 
          ? `${interview.candidate.firstName || ''} ${interview.candidate.lastName || ''}`.trim() || 'candidate'
          : 'candidate';
        generatedNotifications.push({
          id: interviewNotifId,
          type: 'warning',
          message: `Interview scheduled with ${candidateName} for ${interview.job?.title || 'position'}`,
          time: new Date(interview.scheduledDate).toLocaleDateString(),
          read: readNotifications.has(interviewNotifId), // Check if notification was read
          interviewId: interview._id
        });
      });
    }

    setNotifications(generatedNotifications);
  }, [applicationsData, allInterviews, readNotifications]); // Added readNotifications dependency

  // Format time ago helper
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notification.id);
      return newSet;
    });
    
    if (notification.applicationId) {
      setSelectedApplicationId(notification.applicationId);
      setIsApplicationDetailsOpen(true);
    }
  };

  // Handle mark all notifications as read
  const handleMarkAllRead = () => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      notifications.forEach(notif => newSet.add(notif.id));
      return newSet;
    });
  };

  // Handle job creation
  const handleJobCreated = (newJob) => {
    // Add to allJobs for pagination
    setAllJobs(prev => [newJob, ...prev]);
    // Refresh dashboard data to update stats
    fetchDashboardData();
  };

  // Handle job update
  const handleJobUpdated = (updatedJob) => {
    // Update in allJobs for pagination
    setAllJobs(prev => prev.map(job => job._id === updatedJob._id ? updatedJob : job));
    // Refresh dashboard data to update stats
    fetchDashboardData();
  };

  // Handle edit job click
  const handleEditJob = (job) => {
    setSelectedJob(job);
    setIsEditJobOpen(true);
  };

  // Handle settings click
  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  // Handle view applications click
  const handleViewApplications = (job) => {
    if (!job?._id) {
      console.error('Invalid job object:', job);
      return;
    }
    console.log('Opening applications for job:', job);
    setSelectedJob(job);
    setIsViewApplicationsOpen(true);
  };

  // Fetch all applications for Applications page
  const fetchAllApplications = async () => {
    setApplicationsLoading(true);
    try {
      const response = await applicationService.getApplications({ limit: 1000 });
      if (response.success && response.data) {
        setAllApplications(response.data);
        filterApplicationsByStatus(response.data, statusFilter, searchQuery);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Filter applications
  const filterApplicationsByStatus = (apps, status, query) => {
    let filtered = apps;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(app => app.status === status);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(app => 
        (app.applicant?.firstName?.toLowerCase().includes(lowerQuery)) ||
        (app.applicant?.lastName?.toLowerCase().includes(lowerQuery)) ||
        (app.applicant?.email?.toLowerCase().includes(lowerQuery)) ||
        (app.job?.title?.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredApplications(filtered);
  };

  // Handle application view details
  const handleViewApplicationDetails = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setIsApplicationDetailsOpen(true);
  };

  // Handle application status update
  const handleApplicationStatusUpdate = (updatedApplication) => {
    // Create the updated applications array with preserved data
    const updatedApplications = allApplications.map(app => {
      if (app._id === updatedApplication._id) {
        // Preserve the populated applicant and job data
        return {
          ...updatedApplication,
          applicant: updatedApplication.applicant || app.applicant,
          job: updatedApplication.job || app.job,
          resume: updatedApplication.resume || app.resume
        };
      }
      return app;
    });

    // Update state
    setAllApplications(updatedApplications);
    
    // Filter with the updated array
    filterApplicationsByStatus(updatedApplications, statusFilter, searchQuery);
    
    // Refresh dashboard stats
    fetchDashboardData();
  };

  // Quick status update
  const handleQuickStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus);
      if (response.success) {
        handleApplicationStatusUpdate(response.data);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
    }
  };

  // Effect to fetch applications when view changes
  useEffect(() => {
    if (activeView === 'applications') {
      fetchAllApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Effect to filter applications when filters change
  useEffect(() => {
    if (allApplications.length > 0) {
      filterApplicationsByStatus(allApplications, statusFilter, searchQuery);
      setCurrentApplicationsPage(1); // Reset to first page when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  // Fetch all candidates for Candidates page
  const fetchAllCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const response = await candidateService.getCandidates();
      if (response.success && response.data) {
        setAllCandidates(response.data);
        filterCandidatesByStatus(response.data, candidateStatusFilter, candidateSearchQuery);
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Filter candidates
  const filterCandidatesByStatus = (candidates, status, query) => {
    let filtered = candidates;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(c => c.latestStatus === status);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(c =>
        (c.firstName?.toLowerCase().includes(lowerQuery)) ||
        (c.lastName?.toLowerCase().includes(lowerQuery)) ||
        (c.email?.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by AI score (averageScore) in descending order
    filtered = filtered.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

    setFilteredCandidates(filtered);
  };

  // Handle candidate view details
  const handleViewCandidateDetails = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setIsCandidateDetailsOpen(true);
  };

  // Fetch all interviews for Interviews page
  const fetchAllInterviews = async () => {
    setInterviewsLoading(true);
    try {
      const response = await interviewService.getInterviews();
      if (response.success && response.data) {
        setAllInterviews(response.data);
        filterInterviewsByStatus(response.data, interviewStatusFilter, interviewSearchQuery);
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setInterviewsLoading(false);
    }
  };

  // Filter interviews
  const filterInterviewsByStatus = (interviews, status, query) => {
    let filtered = interviews;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(i => i.status === status);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(i => 
        (i.candidate?.firstName?.toLowerCase().includes(lowerQuery)) ||
        (i.candidate?.lastName?.toLowerCase().includes(lowerQuery)) ||
        (i.candidate?.email?.toLowerCase().includes(lowerQuery)) ||
        (i.job?.title?.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredInterviews(filtered);
  };

  // Handle interview view details
  const handleViewInterviewDetails = (interview) => {
    setSelectedInterview(interview);
    setIsInterviewDetailsOpen(true);
  };

  // Handle interview status update
  const handleInterviewStatusUpdate = async (applicationId, newStatus, feedback) => {
    try {
      console.log('Updating application:', applicationId, 'with status:', newStatus, 'and feedback:', feedback);
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus, feedback);
      console.log('Update response:', response);
      if (response.success) {
        // Refresh interviews
        await fetchAllInterviews();
        // Refresh dashboard stats
        fetchDashboardData();
      } else {
        throw new Error(response.message || 'Failed to update application status');
      }
    } catch (err) {
      console.error('Error updating interview status:', err);
      throw err; // Re-throw to be caught by the dialog
    }
  };

  // Effect to fetch interviews when view changes
  useEffect(() => {
    if (activeView === 'interviews') {
      fetchAllInterviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Effect to filter interviews when filters change
  useEffect(() => {
    if (allInterviews.length > 0) {
      filterInterviewsByStatus(allInterviews, interviewStatusFilter, interviewSearchQuery);
      setCurrentInterviewsPage(1); // Reset to first page when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewStatusFilter, interviewSearchQuery]);

  // Effect to fetch candidates when view changes
  useEffect(() => {
    if (activeView === 'candidates') {
      fetchAllCandidates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Effect to filter candidates when filters change
  useEffect(() => {
    if (allCandidates.length > 0) {
      filterCandidatesByStatus(allCandidates, candidateStatusFilter, candidateSearchQuery);
      setCurrentCandidatesPage(1); // Reset to first page when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateStatusFilter, candidateSearchQuery]);

  // Fetch all communications for Communications page
  const fetchAllCommunications = async () => {
    setCommunicationsLoading(true);
    try {
      const response = await communicationService.getCommunications();
      if (response.success && response.data) {
        setAllCommunications(response.data);
        filterCommunicationsByType(response.data, communicationTypeFilter, communicationSearchQuery);
      }
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      setCommunicationsLoading(false);
    }
  };

  // Filter communications
  const filterCommunicationsByType = (communications, type, query) => {
    let filtered = communications;

    // Filter by type
    if (type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(c => 
        (c.candidateName?.toLowerCase().includes(lowerQuery)) ||
        (c.candidateEmail?.toLowerCase().includes(lowerQuery)) ||
        (c.subject?.toLowerCase().includes(lowerQuery)) ||
        (c.message?.toLowerCase().includes(lowerQuery))
      );
    }

    setFilteredCommunications(filtered);
  };

  // Handle communication view details
  const handleViewCommunicationDetails = (communication) => {
    setSelectedCommunication(communication);
    setIsCommunicationDetailsOpen(true);
    // Mark as read
    communicationService.markAsRead(communication.id);
  };

  // Handle send reply
  const handleSendReply = async (communicationId, message) => {
    try {
      const communication = allCommunications.find(c => c.id === communicationId);
      if (communication) {
        await communicationService.sendMessage({
          to: communication.candidateEmail,
          subject: `Re: ${communication.subject}`,
          message: message,
          candidateName: communication.candidateName,
          jobTitle: communication.jobTitle
        });
        // Refresh communications
        await fetchAllCommunications();
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // Effect to fetch communications when view changes
  useEffect(() => {
    if (activeView === 'communications') {
      fetchAllCommunications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  // Effect to filter communications when filters change
  useEffect(() => {
    if (allCommunications.length > 0) {
      filterCommunicationsByType(allCommunications, communicationTypeFilter, communicationSearchQuery);
      setCurrentCommunicationsPage(1); // Reset to first page when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communicationTypeFilter, communicationSearchQuery]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const [dashboardAnalytics, appAnalytics, jobsAnalytics] = await Promise.all([
        analyticsService.getDashboardAnalytics(),
        analyticsService.getApplicationAnalytics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        analyticsService.getJobAnalytics()
      ]);

      setAnalyticsData(dashboardAnalytics.data);
      setApplicationAnalytics(appAnalytics.data);
      setJobAnalytics(jobsAnalytics.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Effect to fetch analytics when view changes
  useEffect(() => {
    if (activeView === 'analytics') {
      fetchAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, dateRange]);

  // Fetch all jobs with pagination
  const fetchAllJobs = async () => {
    try {
      setJobsLoading(true);
      
      // Fetch all jobs without pagination for now, then handle client-side
      // Set a high limit to ensure we get all jobs
      const response = await dashboardService.getJobs({ limit: 1000 });
      
      if (response.success && response.data) {
        setAllJobs(response.data);
      }
    } catch (err) {
      console.error('Error fetching all jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  // Effect to fetch jobs when view changes
  useEffect(() => {
    if (activeView === 'jobs') {
      fetchAllJobs();
    }
  }, [activeView]);

  // Get paginated jobs by status
  const getPaginatedJobs = (status) => {
    const filteredJobs = allJobs.filter(job => job.status === status);
    const startIndex = (currentJobsPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  // Calculate total pages for a status
  const getTotalPages = (status) => {
    const filteredJobs = allJobs.filter(job => job.status === status);
    return Math.ceil(filteredJobs.length / jobsPerPage);
  };

  // Handle page change
  const handleJobsPageChange = (newPage) => {
    setCurrentJobsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated applications
  const getPaginatedApplications = () => {
    const startIndex = (currentApplicationsPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };

  // Calculate total pages for applications
  const getTotalApplicationsPages = () => {
    return Math.ceil(filteredApplications.length / applicationsPerPage);
  };

  // Handle applications page change
  const handleApplicationsPageChange = (newPage) => {
    setCurrentApplicationsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated candidates
  const getPaginatedCandidates = () => {
    const startIndex = (currentCandidatesPage - 1) * candidatesPerPage;
    const endIndex = startIndex + candidatesPerPage;
    return filteredCandidates.slice(startIndex, endIndex);
  };

  // Calculate total pages for candidates
  const getTotalCandidatesPages = () => {
    return Math.ceil(filteredCandidates.length / candidatesPerPage);
  };

  // Handle candidates page change
  const handleCandidatesPageChange = (newPage) => {
    setCurrentCandidatesPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated communications
  const getPaginatedCommunications = () => {
    const startIndex = (currentCommunicationsPage - 1) * communicationsPerPage;
    const endIndex = startIndex + communicationsPerPage;
    return filteredCommunications.slice(startIndex, endIndex);
  };

  // Calculate total pages for communications
  const getTotalCommunicationsPages = () => {
    return Math.ceil(filteredCommunications.length / communicationsPerPage);
  };

  // Handle communications page change
  const handleCommunicationsPageChange = (newPage) => {
    setCurrentCommunicationsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get paginated interviews
  const getPaginatedInterviews = () => {
    const startIndex = (currentInterviewsPage - 1) * interviewsPerPage;
    const endIndex = startIndex + interviewsPerPage;
    return filteredInterviews.slice(startIndex, endIndex);
  };

  // Calculate total pages for interviews
  const getTotalInterviewsPages = () => {
    return Math.ceil(filteredInterviews.length / interviewsPerPage);
  };

  // Handle interviews page change
  const handleInterviewsPageChange = (newPage) => {
    setCurrentInterviewsPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group applications by status for kanban board
  const getApplicationsByStatus = () => {
    if (!applicationsData.length) return kanbanStages;

    const statusMap = {
      'submitted': 'Applied',
      'under_review': 'Screening',
      'shortlisted': 'Interview',
      'interview_scheduled': 'Interview',
      'interviewed': 'Interview',
      'offer_extended': 'Offer',
      'accepted': 'Hired',
      'rejected': null,
      'withdrawn': null
    };

    const grouped = {
      'Applied': [],
      'Screening': [],
      'Interview': [],
      'Offer': [],
      'Hired': []
    };

    applicationsData.forEach(app => {
      const stageName = statusMap[app.status];
      if (stageName && grouped[stageName]) {
        grouped[stageName].push({
          id: app._id,
          name: app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : 'Unknown',
          position: app.job ? app.job.title : 'Unknown Position',
          score: app.aiScore?.overallScore || Math.floor(Math.random() * 30) + 70 // Use AI score or fallback
        });
      }
    });

    // Sort each group by AI score in descending order
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => b.score - a.score);
    });

    return kanbanStages.map(stage => ({
      ...stage,
      count: grouped[stage.name].length,
      applications: grouped[stage.name].slice(0, 2)
    }));
  };

  const summary = dashboardData?.summary || {};
  const recentApplications = dashboardData?.recentApplications || [];

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs'), badge: allJobs.length || 0 },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: summary.totalApplications || 0 },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates'), badge: allCandidates.length || 0 },
    { icon: <Calendar className="h-5 w-5" />, label: 'Interviews', active: activeView === 'interviews', onClick: () => setActiveView('interviews'), badge: allInterviews.length || 0 },
    { icon: <Mail className="h-5 w-5" />, label: 'Communications', active: activeView === 'communications', onClick: () => setActiveView('communications'), badge: allCommunications.length || 0 },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', active: false, onClick: handleSettingsClick },
  ];

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="purple" onSettingsClick={handleSettingsClick}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="purple" onSettingsClick={handleSettingsClick}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Safely extract numeric values
  const openJobs = String(summary.openJobs ?? 0);
  const totalApplications = String(summary.totalApplications ?? 0);
  const pendingApplications = String(summary.pendingApplications ?? 0);
  const totalJobs = String(summary.totalJobs ?? 0);
  
  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      theme="purple"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onViewAllNotifications={() => setActiveView('applications')}
      onMarkAllRead={handleMarkAllRead}
      onSettingsClick={handleSettingsClick}
    >
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">HR Manager Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600">Recruitment and candidate management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              title="Open Positions"
              value={openJobs}
              icon={<Briefcase className="h-6 w-6" />}
              color="purple"
              trend={{ value: 6, isPositive: true }}
            />
            <StatsCard
              title="Active Applications"
              value={totalApplications}
              icon={<FileText className="h-6 w-6" />}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Pending Review"
              value={pendingApplications}
              icon={<Calendar className="h-6 w-6" />}
              color="orange"
            />
            <StatsCard
              title="Total Jobs"
              value={totalJobs}
              icon={<Clock className="h-6 w-6" />}
              color="green"
            />
          </div>

          {/* Application Pipeline */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg md:text-xl">Application Pipeline</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={() => setActiveView('applications')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {getApplicationsByStatus().map((stage, index) => (
                  <div key={index} className={`${stage.color} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stage.applications.length > 0 ? (
                        stage.applications.map((app) => (
                          <div 
                            key={app.id} 
                            className="bg-white p-3 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                              setSelectedApplicationId(app.id);
                              setIsApplicationDetailsOpen(true);
                            }}
                          >
                            <p className="text-sm font-medium mb-1">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.position}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-purple-600 h-1 rounded-full" 
                                  style={{ width: `${app.score}%` }}
                                />
                              </div>
                              <span className="text-xs">{app.score}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white/50 p-3 rounded text-center">
                          <p className="text-xs text-gray-500">No applications</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentApplications.length > 0 ? (
                  recentApplications.slice(0, 5).map((app) => {
                    const candidateName = app.applicant 
                      ? `${app.applicant.firstName} ${app.applicant.lastName}` 
                      : 'Unknown Candidate';
                    const jobTitle = app.job?.title || 'Unknown Position';
                    const score = app.aiScore?.overallScore || Math.floor(Math.random() * 30) + 70;
                    const appliedDate = new Date(app.createdAt).toLocaleDateString();
                    
                    const statusBadgeMap = {
                      'submitted': 'secondary',
                      'under_review': 'default',
                      'shortlisted': 'default',
                      'interview_scheduled': 'default',
                      'interviewed': 'default',
                      'offer_extended': 'default',
                      'accepted': 'default',
                      'rejected': 'destructive',
                      'withdrawn': 'secondary'
                    };

                    const statusLabelMap = {
                      'submitted': 'Applied',
                      'under_review': 'Screening',
                      'shortlisted': 'Shortlisted',
                      'interview_scheduled': 'Interview Scheduled',
                      'interviewed': 'Interviewed',
                      'offer_extended': 'Offer Extended',
                      'accepted': 'Hired',
                      'rejected': 'Rejected',
                      'withdrawn': 'Withdrawn'
                    };

                    return (
                      <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" 
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base truncate">{candidateName}</p>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{jobTitle}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:text-right w-full sm:w-auto">
                            <Badge variant={statusBadgeMap[app.status]} className="text-xs whitespace-nowrap">
                              {statusLabelMap[app.status]}
                            </Badge>
                            <p className="text-xs text-gray-500 sm:hidden">{appliedDate}</p>
                          </div>
                          <p className="text-xs text-gray-500 hidden sm:block">{appliedDate}</p>
                          <div className="flex items-center gap-2">
                            <div className="text-center">
                              <div className="text-purple-600 font-semibold text-sm sm:text-base mb-1">{score}</div>
                              <Progress value={score} className="w-16 sm:w-20 h-1.5 sm:h-2" />
                            </div>
                          </div>
                          <div className="flex gap-2 ml-auto sm:ml-0">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              title="View Details" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewApplicationDetails(app._id);
                              }}
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button size="sm" variant="outline" title="Approve" className="h-8 w-8 p-0">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="outline" title="Reject" className="h-8 w-8 p-0">
                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No recent applications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'applications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Applications</h1>
              <p className="text-sm md:text-base text-gray-600">Manage all job applications</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by candidate name, email, or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="offer_extended">Offer Extended</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Total Applications</div>
                <div className="text-2xl font-bold text-gray-900">{allApplications.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">New</div>
                <div className="text-2xl font-bold text-blue-600">
                  {allApplications.filter(a => a.status === 'submitted').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Under Review</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {allApplications.filter(a => a.status === 'under_review').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Shortlisted</div>
                <div className="text-2xl font-bold text-green-600">
                  {allApplications.filter(a => a.status === 'shortlisted').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredApplications.length > 0 ? (
            <div className="space-y-4">
              {getPaginatedApplications().map((app) => {
                const candidateName = app.applicant 
                  ? `${app.applicant.firstName} ${app.applicant.lastName}` 
                  : 'Unknown Candidate';
                const jobTitle = app.job?.title || 'Unknown Position';
                const score = app.aiScore?.overallScore || 0;
                const appliedDate = new Date(app.createdAt).toLocaleDateString();
                
                const statusBadgeMap = {
                  'submitted': 'secondary',
                  'under_review': 'default',
                  'shortlisted': 'default',
                  'interview_scheduled': 'default',
                  'interviewed': 'default',
                  'offer_extended': 'default',
                  'accepted': 'default',
                  'rejected': 'destructive',
                  'withdrawn': 'secondary'
                };

                const statusLabelMap = {
                  'submitted': 'New',
                  'under_review': 'Under Review',
                  'shortlisted': 'Shortlisted',
                  'interview_scheduled': 'Interview Scheduled',
                  'interviewed': 'Interviewed',
                  'offer_extended': 'Offer Extended',
                  'accepted': 'Accepted',
                  'rejected': 'Rejected',
                  'withdrawn': 'Withdrawn'
                };

                return (
                  <Card key={app._id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                                {candidateName}
                              </h3>
                              <Badge variant={statusBadgeMap[app.status]} className="text-xs sm:text-sm w-fit">
                                {statusLabelMap[app.status]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{jobTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{app.applicant?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>Applied: {appliedDate}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 mt-2">
                              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">AI Match:</span>
                              <div className="flex items-center gap-2 flex-1">
                                <Progress value={score} className="flex-1 max-w-[120px] sm:max-w-xs" />
                                <span className="text-xs sm:text-sm font-semibold text-purple-600 flex-shrink-0">{score}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-col lg:flex-row sm:ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewApplicationDetails(app._id)}
                            title="View Details"
                            className="flex-1 sm:flex-none h-8 sm:h-9"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0 lg:mr-0" />
                            <span className="sm:hidden lg:inline ml-1">View</span>
                          </Button>
                          {app.status !== 'accepted' && app.status !== 'rejected' && (
                            <>
                              {/* Show Shortlist button only if not yet interview scheduled */}
                              {!['interview_scheduled', 'interviewed', 'offer_extended'].includes(app.status) && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleQuickStatusUpdate(app._id, 'shortlisted')}
                                  title="Shortlist"
                                  disabled={app.status === 'shortlisted'}
                                  className="flex-1 sm:flex-none h-8 sm:h-9"
                                >
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                </Button>
                              )}
                              
                              {/* Show Extend Offer button when interview is scheduled or completed */}
                              {['interview_scheduled', 'interviewed'].includes(app.status) && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleQuickStatusUpdate(app._id, 'offer_extended')}
                                  title="Extend Offer"
                                  disabled={app.status === 'offer_extended'}
                                  className="flex-1 sm:flex-none h-8 sm:h-9"
                                >
                                  <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                </Button>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleQuickStatusUpdate(app._id, 'rejected')}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No applications match your filters' 
                  : 'No applications yet'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredApplications.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {getPaginatedApplications().length} of {filteredApplications.length} applications
                    {getTotalApplicationsPages() > 1 && (
                      <span> • Page {currentApplicationsPage} of {getTotalApplicationsPages()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplicationsPageChange(currentApplicationsPage - 1)}
                      disabled={currentApplicationsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplicationsPageChange(currentApplicationsPage + 1)}
                      disabled={currentApplicationsPage >= getTotalApplicationsPages()}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'candidates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Candidates</h1>
              <p className="text-sm md:text-base text-gray-600">Manage all candidates and their applications</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by candidate name or email..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={candidateStatusFilter} onValueChange={setCandidateStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Active</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="accepted">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Candidates</div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{allCandidates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Active</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {allCandidates.filter(c => 
                    ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended']
                    .includes(c.latestStatus)
                  ).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Hired</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {allCandidates.filter(c => c.latestStatus === 'accepted').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 md:p-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg Applications</div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {allCandidates.length > 0 
                    ? (allCandidates.reduce((sum, c) => sum + c.totalApplications, 0) / allCandidates.length).toFixed(1)
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidates List */}
          {candidatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCandidates.length > 0 ? (
            <div className="space-y-4">
              {getPaginatedCandidates().map((candidate) => {
                const candidateName = `${candidate.firstName} ${candidate.lastName}`;
                const latestStatusBadgeMap = {
                  'submitted': 'secondary',
                  'under_review': 'default',
                  'shortlisted': 'default',
                  'interview_scheduled': 'default',
                  'interviewed': 'default',
                  'offer_extended': 'default',
                  'accepted': 'default',
                  'rejected': 'destructive',
                  'withdrawn': 'secondary'
                };

                const latestStatusLabelMap = {
                  'submitted': 'Active',
                  'under_review': 'Under Review',
                  'shortlisted': 'Shortlisted',
                  'interview_scheduled': 'Interview Scheduled',
                  'interviewed': 'Interviewed',
                  'offer_extended': 'Offer Extended',
                  'accepted': 'Hired',
                  'rejected': 'Rejected',
                  'withdrawn': 'Withdrawn'
                };

                return (
                  <Card key={candidate._id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-base sm:text-xl text-gray-900 truncate">
                                {candidateName}
                              </h3>
                              <Badge variant={latestStatusBadgeMap[candidate.latestStatus]} className="text-xs sm:text-sm w-fit">
                                {latestStatusLabelMap[candidate.latestStatus]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{candidate.email}</span>
                              </div>
                              {candidate.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>{candidate.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{candidate.totalApplications} {candidate.totalApplications === 1 ? 'Application' : 'Applications'}</span>
                              </div>
                            </div>
                            {candidate.averageScore > 0 && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">Average Score:</span>
                                <div className="flex items-center gap-2 flex-1">
                                  <Progress value={candidate.averageScore} className="flex-1 max-w-[120px] sm:max-w-xs" />
                                  <span className="text-xs sm:text-sm font-semibold text-purple-600 min-w-[2.5rem] sm:min-w-[3rem]">{candidate.averageScore}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewCandidateDetails(candidate._id)}
                            title="View Details"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">View Profile</span>
                            <span className="sm:hidden ml-1">View</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {candidateSearchQuery || candidateStatusFilter !== 'all' 
                  ? 'No candidates match your filters' 
                  : 'No candidates yet'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredCandidates.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {getPaginatedCandidates().length} of {filteredCandidates.length} candidates
                    {getTotalCandidatesPages() > 1 && (
                      <span> • Page {currentCandidatesPage} of {getTotalCandidatesPages()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCandidatesPageChange(currentCandidatesPage - 1)}
                      disabled={currentCandidatesPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCandidatesPageChange(currentCandidatesPage + 1)}
                      disabled={currentCandidatesPage >= getTotalCandidatesPages()}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'interviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Interviews</h1>
              <p className="text-sm md:text-base text-gray-600">Manage and schedule interviews</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by candidate name, email, or position..."
                    value={interviewSearchQuery}
                    onChange={(e) => setInterviewSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={interviewStatusFilter} onValueChange={setInterviewStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Interviews Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Total Interviews</div>
                <div className="text-2xl font-bold text-gray-900">{allInterviews.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Today</div>
                <div className="text-2xl font-bold text-blue-600">
                  {allInterviews.filter(i => {
                    if (!i.scheduledDate) return false;
                    const today = new Date();
                    const interviewDate = new Date(i.scheduledDate);
                    return interviewDate.toDateString() === today.toDateString();
                  }).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Upcoming</div>
                <div className="text-2xl font-bold text-orange-600">
                  {allInterviews.filter(i => {
                    if (!i.scheduledDate) return false;
                    const interviewDate = new Date(i.scheduledDate);
                    return interviewDate > new Date() && (i.status === 'scheduled' || i.status === 'pending');
                  }).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Completed</div>
                <div className="text-2xl font-bold text-green-600">
                  {allInterviews.filter(i => i.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interviews List */}
          {interviewsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredInterviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {getPaginatedInterviews().map((interview) => {
                  const candidateName = interview.candidate 
                    ? `${interview.candidate.firstName} ${interview.candidate.lastName}` 
                    : 'Unknown Candidate';

                  const interviewTypeMap = {
                    'phone': { label: 'Phone', icon: Phone, color: 'bg-blue-100 text-blue-600' },
                    'video': { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-600' },
                    'in-person': { label: 'In-Person', icon: Users, color: 'bg-green-100 text-green-600' },
                    'technical': { label: 'Technical', icon: Briefcase, color: 'bg-orange-100 text-orange-600' },
                    'hr': { label: 'HR', icon: Users, color: 'bg-pink-100 text-pink-600' },
                  };

                  const interviewType = interviewTypeMap[interview.type] || null;
                  const TypeIcon = interviewType?.icon;

                  const statusBadgeMap = {
                    'scheduled': 'default',
                    'pending': 'secondary',
                    'completed': 'default',
                  };

                  const isUpcoming = interview.scheduledDate && new Date(interview.scheduledDate) > new Date();
                  const isToday = interview.scheduledDate && 
                    new Date(interview.scheduledDate).toDateString() === new Date().toDateString();

                  return (
                    <Card key={interview._id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                              alt={candidateName} 
                              className="w-14 h-14 rounded-full flex-shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {candidateName}
                                </h3>
                                <Badge variant={statusBadgeMap[interview.status] || 'secondary'}>
                                  {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1)}
                                </Badge>
                                {isToday && (
                                  <Badge variant="default" className="bg-blue-600">
                                    Today
                                  </Badge>
                                )}
                                {isUpcoming && !isToday && (
                                  <Badge variant="outline">
                                    Upcoming
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{interview.job?.title || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{interview.candidate?.email || 'N/A'}</span>
                                </div>
                                {interview.scheduledDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                      {new Date(interview.scheduledDate).toLocaleDateString()} at{' '}
                                      {new Date(interview.scheduledDate).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {interviewType && (
                                <div className="mt-2 inline-flex">
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${interviewType.color} text-xs`}>
                                    {TypeIcon && <TypeIcon className="h-3 w-3" />}
                                    <span>{interviewType.label}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewInterviewDetails(interview)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {getPaginatedInterviews().length} of {filteredInterviews.length} interviews
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInterviewsPageChange(currentInterviewsPage - 1)}
                        disabled={currentInterviewsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="text-sm text-gray-600">
                        Page {currentInterviewsPage} of {getTotalInterviewsPages() || 1}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInterviewsPageChange(currentInterviewsPage + 1)}
                        disabled={currentInterviewsPage >= getTotalInterviewsPages()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {interviewSearchQuery || interviewStatusFilter !== 'all' 
                  ? 'No interviews match your filters' 
                  : 'No interviews scheduled yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeView === 'communications' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Communications</h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">View and manage all candidate communications</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by candidate name, email, or subject..."
                value={communicationSearchQuery}
                onChange={(e) => setCommunicationSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={communicationTypeFilter} onValueChange={setCommunicationTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="application">Applications</SelectItem>
                <SelectItem value="interview">Interviews</SelectItem>
                <SelectItem value="offer">Job Offers</SelectItem>
                <SelectItem value="acceptance">Acceptances</SelectItem>
                <SelectItem value="rejection">Rejections</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
                <Inbox className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allCommunications.length}</div>
                <p className="text-xs text-gray-600 mt-1">All messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Mail className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {allCommunications.filter(c => !c.read).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Require attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {allCommunications.filter(c => {
                    const today = new Date();
                    const msgDate = new Date(c.date);
                    return msgDate.toDateString() === today.toDateString();
                  }).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Today's messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Send className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {allCommunications.filter(c => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(c.date) >= weekAgo;
                  }).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Communications List */}
          {communicationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredCommunications.length > 0 ? (
            <div className="space-y-3">
              {getPaginatedCommunications().map((communication) => {
                const getTypeColor = (type) => {
                  const colors = {
                    'application': 'bg-blue-100 text-blue-800',
                    'interview': 'bg-purple-100 text-purple-800',
                    'offer': 'bg-green-100 text-green-800',
                    'acceptance': 'bg-emerald-100 text-emerald-800',
                    'rejection': 'bg-red-100 text-red-800'
                  };
                  return colors[type] || 'bg-gray-100 text-gray-800';
                };

                const getTypeIcon = (type) => {
                  const icons = {
                    'application': FileText,
                    'interview': Video,
                    'offer': Briefcase,
                    'acceptance': CheckCircle,
                    'rejection': XCircle
                  };
                  return icons[type] || Mail;
                };

                const TypeIcon = getTypeIcon(communication.type);
                const isToday = new Date(communication.date).toDateString() === new Date().toDateString();

                return (
                  <Card key={communication.id} className={`hover:shadow-md transition-shadow ${!communication.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <TypeIcon className="h-5 w-5 flex-shrink-0 text-gray-600" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {communication.subject}
                            </h3>
                            <Badge className={getTypeColor(communication.type)}>
                              {communication.type.charAt(0).toUpperCase() + communication.type.slice(1)}
                            </Badge>
                            {!communication.read && (
                              <Badge variant="destructive" className="text-xs">
                                New
                              </Badge>
                            )}
                            {isToday && (
                              <Badge variant="default" className="bg-blue-600 text-xs">
                                Today
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{communication.candidateName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{communication.candidateEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>
                                {new Date(communication.date).toLocaleDateString()} at{' '}
                                {new Date(communication.date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {communication.message}
                          </p>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {communication.jobTitle}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewCommunicationDetails(communication)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {communicationSearchQuery || communicationTypeFilter !== 'all' 
                  ? 'No communications match your filters' 
                  : 'No communications yet'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredCommunications.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {getPaginatedCommunications().length} of {filteredCommunications.length} communications
                    {getTotalCommunicationsPages() > 1 && (
                      <span> • Page {currentCommunicationsPage} of {getTotalCommunicationsPages()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCommunicationsPageChange(currentCommunicationsPage - 1)}
                      disabled={currentCommunicationsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCommunicationsPageChange(currentCommunicationsPage + 1)}
                      disabled={currentCommunicationsPage >= getTotalCommunicationsPages()}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-sm md:text-base text-gray-600">Insights and metrics for recruitment performance</p>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analyticsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : analyticsError ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-red-600 mb-4">Error loading analytics: {analyticsError}</p>
              <Button onClick={fetchAnalyticsData}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Total Jobs</div>
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData?.summary?.totalJobs || 0}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {analyticsData?.summary?.openJobs || 0} open positions
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Total Applications</div>
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {applicationAnalytics?.totalApplications || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      In selected period
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Avg. Time to Hire</div>
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {applicationAnalytics?.avgTimeToHire || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">days</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Active Users</div>
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData?.summary?.activeUsers || 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      of {analyticsData?.summary?.totalUsers || 0} total
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Conversion Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Mobile: Stacked Layout */}
                  <div className="flex flex-col md:hidden space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">Application to Shortlist</div>
                      <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">
                        {applicationAnalytics?.conversionRates?.applicationToShortlist || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.applicationToShortlist || 0)} 
                        className="h-2"
                      />
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">Shortlist to Interview</div>
                      <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
                        {applicationAnalytics?.conversionRates?.shortlistToInterview || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.shortlistToInterview || 0)} 
                        className="h-2"
                      />
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">Interview to Hire</div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                        {applicationAnalytics?.conversionRates?.interviewToHire || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.interviewToHire || 0)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  {/* Desktop: Side-by-side with dividers */}
                  <div className="hidden md:flex items-center justify-around divide-x divide-gray-200">
                    <div className="flex-1 px-4 text-center">
                      <div className="text-sm text-gray-600 mb-3">Application to Shortlist</div>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {applicationAnalytics?.conversionRates?.applicationToShortlist || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.applicationToShortlist || 0)} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex-1 px-4 text-center">
                      <div className="text-sm text-gray-600 mb-3">Shortlist to Interview</div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {applicationAnalytics?.conversionRates?.shortlistToInterview || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.shortlistToInterview || 0)} 
                        className="h-2"
                      />
                    </div>
                    <div className="flex-1 px-4 text-center">
                      <div className="text-sm text-gray-600 mb-3">Interview to Hire</div>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {applicationAnalytics?.conversionRates?.interviewToHire || 0}%
                      </div>
                      <Progress 
                        value={parseFloat(applicationAnalytics?.conversionRates?.interviewToHire || 0)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Applications by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Applications by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData?.applicationsByStatus?.map((item, index) => {
                        const statusColors = {
                          'submitted': 'bg-gray-500',
                          'under_review': 'bg-blue-500',
                          'shortlisted': 'bg-purple-500',
                          'interview_scheduled': 'bg-yellow-500',
                          'interviewed': 'bg-orange-500',
                          'offer_extended': 'bg-green-500',
                          'accepted': 'bg-emerald-600',
                          'rejected': 'bg-red-500',
                          'withdrawn': 'bg-gray-400'
                        };
                        
                        const statusLabels = {
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

                        const total = analyticsData?.applicationsByStatus?.reduce((sum, s) => sum + s.count, 0) || 1;
                        const percentage = ((item.count / total) * 100).toFixed(1);

                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                {statusLabels[item._id] || item._id}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0 ml-2">
                                {item.count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${statusColors[item._id] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Jobs by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Jobs by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData?.jobsByDepartment?.map((item, index) => {
                        const total = analyticsData?.jobsByDepartment?.reduce((sum, d) => sum + d.count, 0) || 1;
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];

                        return (
                          <div key={index}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                {item._id || 'Not Specified'}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                                {item.count} jobs ({item.openPositions} open)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Jobs by Applications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Top Jobs by Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {analyticsData?.topJobs?.length > 0 ? (
                      analyticsData.topJobs.map((job, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base text-gray-900 truncate">{job.title}</h4>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{job.department}</p>
                          </div>
                          <div className="flex gap-4 sm:gap-6 items-center">
                            <div className="text-center">
                              <div className="text-xs md:text-sm text-gray-600">Applications</div>
                              <div className="text-lg md:text-xl font-bold text-purple-600">
                                {job.applicationsCount || 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs md:text-sm text-gray-600">Views</div>
                              <div className="text-lg md:text-xl font-bold text-blue-600">
                                {job.viewsCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm md:text-base">No job data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Jobs by Employment Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Jobs by Employment Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {jobAnalytics?.jobsByEmploymentType?.map((item, index) => {
                      const typeLabels = {
                        'full-time': 'Full-Time',
                        'part-time': 'Part-Time',
                        'contract': 'Contract',
                        'internship': 'Internship',
                        'temporary': 'Temporary'
                      };

                      return (
                        <div key={index} className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                            {item.count}
                          </div>
                          <div className="text-xs md:text-sm text-gray-600">
                            {typeLabels[item._id] || item._id}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Most Viewed Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg md:text-xl">Most Viewed Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 md:space-y-3">
                    {jobAnalytics?.mostViewedJobs?.length > 0 ? (
                      jobAnalytics.mostViewedJobs.slice(0, 5).map((job, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 md:p-3 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm md:text-base text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{job.department}</p>
                          </div>
                          <div className="flex gap-4 sm:gap-6 items-center justify-start sm:justify-end">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                              <span className="text-sm md:text-base font-semibold text-gray-900">{job.viewsCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                              <span className="text-sm md:text-base font-semibold text-gray-900">{job.applicationsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Eye className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm md:text-base">No view data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeView === 'jobs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Job Postings</h1>
              <p className="text-sm md:text-base text-gray-600">Create and manage job openings</p>
            </div>
            <Button onClick={() => setIsCreateJobOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Job Posting
            </Button>
          </div>

          <Tabs defaultValue="active" onValueChange={() => setCurrentJobsPage(1)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active" className="text-xs sm:text-sm">
                Active ({allJobs.filter(j => j.status === 'open').length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="text-xs sm:text-sm">
                Drafts ({allJobs.filter(j => j.status === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="closed" className="text-xs sm:text-sm">
                Closed ({allJobs.filter(j => j.status === 'closed').length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4 mt-6">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : getPaginatedJobs('open').length > 0 ? (
                <>
                  {getPaginatedJobs('open').map((job) => {
                    const daysAgo = Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
                    return (
                      <Card key={job._id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">{job.title}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span className="truncate">{job.department}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{job.applicationsCount || 0} applications</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Posted {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Button variant="outline" onClick={() => handleEditJob(job)} className="w-full sm:w-auto text-sm">
                                Edit
                              </Button>
                              <Button onClick={() => handleViewApplications(job)} className="w-full sm:w-auto text-sm">
                                View Applications
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Pagination Controls - Always visible */}
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {getPaginatedJobs('open').length} of {allJobs.filter(j => j.status === 'open').length} jobs
                          {getTotalPages('open') > 1 && (
                            <span className="ml-2">• Page {currentJobsPage} of {getTotalPages('open')}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage - 1)}
                            disabled={currentJobsPage === 1 || getTotalPages('open') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage + 1)}
                            disabled={currentJobsPage === getTotalPages('open') || getTotalPages('open') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base text-gray-500">No active job postings</p>
                  <Button className="mt-4 w-full sm:w-auto" onClick={() => setIsCreateJobOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Job
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="draft" className="space-y-4 mt-6">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : getPaginatedJobs('draft').length > 0 ? (
                <>
                  {getPaginatedJobs('draft').map((job) => {
                    const daysAgo = Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
                    return (
                      <Card key={job._id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">{job.title}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span className="truncate">{job.department}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Created {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Button variant="outline" onClick={() => handleEditJob(job)} className="w-full sm:w-auto text-sm">
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Pagination Controls - Always visible */}
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {getPaginatedJobs('draft').length} of {allJobs.filter(j => j.status === 'draft').length} jobs
                          {getTotalPages('draft') > 1 && (
                            <span className="ml-2">• Page {currentJobsPage} of {getTotalPages('draft')}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage - 1)}
                            disabled={currentJobsPage === 1 || getTotalPages('draft') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage + 1)}
                            disabled={currentJobsPage === getTotalPages('draft') || getTotalPages('draft') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base text-gray-500">No draft job postings</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="closed" className="space-y-4 mt-6">
              {jobsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : getPaginatedJobs('closed').length > 0 ? (
                <>
                  {getPaginatedJobs('closed').map((job) => {
                    const daysAgo = Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
                    return (
                      <Card key={job._id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">{job.title}</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <span className="truncate">{job.department}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{job.applicationsCount || 0} applications</span>
                                <span className="hidden sm:inline">•</span>
                                <span>Closed {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Button onClick={() => handleViewApplications(job)} className="w-full sm:w-auto text-sm">
                                View Applications
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {/* Pagination Controls - Always visible */}
                  <Card className="mt-6">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {getPaginatedJobs('closed').length} of {allJobs.filter(j => j.status === 'closed').length} jobs
                          {getTotalPages('closed') > 1 && (
                            <span className="ml-2">• Page {currentJobsPage} of {getTotalPages('closed')}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage - 1)}
                            disabled={currentJobsPage === 1 || getTotalPages('closed') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleJobsPageChange(currentJobsPage + 1)}
                            disabled={currentJobsPage === getTotalPages('closed') || getTotalPages('closed') <= 1}
                            className="flex-1 sm:flex-none"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm sm:text-base text-gray-500">No closed job postings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create Job Form Dialog */}
      <CreateJobForm
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={handleJobCreated}
      />

      {/* Edit Job Form Dialog */}
      <EditJobForm
        isOpen={isEditJobOpen}
        onClose={() => setIsEditJobOpen(false)}
        job={selectedJob}
        onJobUpdated={handleJobUpdated}
      />

      {/* View Applications Dialog */}
      <ViewApplicationsDialog
        isOpen={isViewApplicationsOpen}
        onClose={() => {
          setIsViewApplicationsOpen(false);
          setSelectedJob(null);
        }}
        job={selectedJob}
        user={user}
      />

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        isOpen={isApplicationDetailsOpen}
        onClose={() => setIsApplicationDetailsOpen(false)}
        applicationId={selectedApplicationId}
        onStatusUpdate={handleApplicationStatusUpdate}
        user={user}
      />

      {/* Candidate Details Dialog */}
      <CandidateDetailsDialog
        isOpen={isCandidateDetailsOpen}
        onClose={() => setIsCandidateDetailsOpen(false)}
        candidateId={selectedCandidateId}
      />

      {/* Interview Details Dialog */}
      <InterviewDetailsDialog
        isOpen={isInterviewDetailsOpen}
        onClose={() => setIsInterviewDetailsOpen(false)}
        interview={selectedInterview}
        onStatusUpdate={handleInterviewStatusUpdate}
      />

      {/* Communication Details Dialog */}
      <CommunicationDetailsDialog
        open={isCommunicationDetailsOpen}
        onClose={() => setIsCommunicationDetailsOpen(false)}
        communication={selectedCommunication}
        onSendReply={handleSendReply}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </DashboardLayout>
  );
}
