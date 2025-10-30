import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  User,
  Bell,
  Bookmark,
  Upload,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import resumeService from '../../services/resumeService';
import authService from '../../services/authService';
import JobDetailsDialog from '../jobs/JobDetailsDialog';
import ApplyJobDialog from '../jobs/ApplyJobDialog';
import ApplicationDetailsDialog from '../applications/ApplicationDetailsDialog';
import toast from 'react-hot-toast';

const statusColors = {
  'Interview Scheduled': 'bg-purple-100 text-purple-800',
  'Under Review': 'bg-blue-100 text-blue-800',
  'Application Submitted': 'bg-gray-100 text-gray-800',
  'Offer Received': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'pending': 'bg-gray-100 text-gray-800',
  'submitted': 'bg-gray-100 text-gray-800',
  'under_review': 'bg-blue-100 text-blue-800',
  'reviewed': 'bg-blue-100 text-blue-800',
  'shortlisted': 'bg-purple-100 text-purple-800',
  'interview_scheduled': 'bg-purple-100 text-purple-800',
  'interviewed': 'bg-purple-100 text-purple-800',
  'offer_extended': 'bg-green-100 text-green-800',
  'offered': 'bg-green-100 text-green-800',
  'accepted': 'bg-green-100 text-green-800',
  'rejected': 'bg-red-100 text-red-800',
  'withdrawn': 'bg-gray-100 text-gray-800',
};

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

export default function EmployeeDashboard({ user }) {
  const [activeView, setActiveView] = useState('browse');
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsPerPage] = useState(6); // Show 6 jobs per page (3 rows x 2 columns)
  
  // State for jobs
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  
  // State for applications
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [applicationsError, setApplicationsError] = useState(null);

  // Dialog states
  const [selectedJob, setSelectedJob] = useState(null);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isApplicationDetailsOpen, setIsApplicationDetailsOpen] = useState(false);

  // Profile states
  const [profileData, setProfileData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState(null);

  // Resume states
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [readNotifications, setReadNotifications] = useState(new Set());

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

  // Load saved jobs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`savedJobs_${user.id}`);
    if (saved) {
      try {
        setSavedJobs(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved jobs:', error);
      }
    }
  }, [user.id]);

  // Save to localStorage whenever savedJobs changes
  useEffect(() => {
    localStorage.setItem(`savedJobs_${user.id}`, JSON.stringify(savedJobs));
  }, [savedJobs, user.id]);

  // Fetch resumes when profile view is active
  useEffect(() => {
    const fetchResumes = async () => {
      if (activeView === 'profile') {
        setLoadingResumes(true);
        setResumeError(null);
        try {
          const response = await resumeService.getMyResumes();
          setResumes(response.data || []);
        } catch (error) {
          console.error('Error fetching resumes:', error);
          setResumeError(error.message || 'Failed to load resumes');
        } finally {
          setLoadingResumes(false);
        }
      }
    };

    fetchResumes();
  }, [activeView]);

  // Generate notifications from applications (run on mount and when data changes)
  useEffect(() => {
    // Generate notifications from application timeline events to show ALL status changes
    const generatedNotifications = [];
    
    applications.forEach((app) => {
      const job = jobs.find(j => j._id === app.job?._id) || app.job;
      
      // Add notification for initial submission
      const submissionTime = formatTimeAgo(new Date(app.createdAt));
      generatedNotifications.push({
        id: `${app._id}_submitted`,
        type: 'info',
        message: `Your application for ${job?.title || 'a position'} has been submitted.`,
        time: submissionTime,
        read: readNotifications.has(`${app._id}_submitted`),
        applicationId: app._id,
        jobId: job?._id,
        timestamp: new Date(app.createdAt).getTime()
      });
      
      // Add notifications for each status change in timeline
      if (app.timeline && app.timeline.length > 0) {
        app.timeline.forEach((event, index) => {
          const eventTime = formatTimeAgo(new Date(event.date));
          let type = 'info';
          let message = '';
          
          switch(event.status) {
            case 'accepted':
              type = 'success';
              message = `Your application for ${job?.title || 'a position'} has been accepted! 🎉`;
              break;
            case 'rejected':
              type = 'error';
              message = `Your application for ${job?.title || 'a position'} was not successful.`;
              break;
            case 'interview_scheduled':
              type = 'warning';
              message = `You have been invited for an interview for ${job?.title || 'a position'}! 📅`;
              break;
            case 'interviewed':
              type = 'info';
              message = `Interview completed for ${job?.title || 'a position'}.`;
              break;
            case 'offer_extended':
              type = 'success';
              message = `Congratulations! You have received a job offer for ${job?.title || 'a position'}! 🎁`;
              break;
            case 'under_review':
              type = 'info';
              message = `Your application for ${job?.title || 'a position'} is under review. 👀`;
              break;
            case 'shortlisted':
              type = 'success';
              message = `Great news! You've been shortlisted for ${job?.title || 'a position'}! ⭐`;
              break;
            case 'withdrawn':
              type = 'info';
              message = `Your application for ${job?.title || 'a position'} has been withdrawn.`;
              break;
            default:
              type = 'info';
              message = `Application status updated to ${event.status.replace('_', ' ')} for ${job?.title || 'a position'}.`;
          }
          
          // Extract AI interview link if status is interview_scheduled
          let aiInterviewLink = null;
          if (event.status === 'interview_scheduled' && app.interviews) {
            const aiInterview = app.interviews.find(interview => 
              interview.type === 'ai_video' && interview.aiInterview?.uniqueLink
            );
            if (aiInterview && aiInterview.aiInterview.uniqueLink) {
              const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
              aiInterviewLink = aiInterview.aiInterview.uniqueLink.startsWith('http') 
                ? aiInterview.aiInterview.uniqueLink 
                : `${baseUrl}/ai-interview/${aiInterview.aiInterview.uniqueLink}`;
            }
          }
          
          generatedNotifications.push({
            id: `${app._id}_${event.status}_${index}`,
            type,
            message,
            time: eventTime,
            read: readNotifications.has(`${app._id}_${event.status}_${index}`),
            applicationId: app._id,
            jobId: job?._id,
            timestamp: new Date(event.date).getTime(),
            aiInterviewLink: aiInterviewLink
          });
        });
      }
    });
    
    // Sort by timestamp (newest first)
    generatedNotifications.sort((a, b) => b.timestamp - a.timestamp);
    
    setNotifications(generatedNotifications);
  }, [applications, jobs, readNotifications]); // Run when applications, jobs, or read state changes

  // Fetch jobs from API on mount and when filters change
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);
      try {
        const params = {
          status: 'open',
          page: currentPage,
          limit: jobsPerPage,
        };
        
        if (searchQuery) params.search = searchQuery;
        if (departmentFilter !== 'all') params.department = departmentFilter;
        if (typeFilter !== 'all') params.employmentType = typeFilter;
        
        const response = await jobService.getJobs(params);
        setJobs(response.data || []);
        setTotalPages(response.pages || 1);
        setTotalJobs(response.total || 0);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobsError(error.message || 'Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [searchQuery, departmentFilter, typeFilter, currentPage, jobsPerPage]); // Fetch on mount and when filters or page change

  // Fetch applications from API on mount (always load to check "already applied" status)
  useEffect(() => {
    const fetchApplications = async () => {
      setLoadingApplications(true);
      setApplicationsError(null);
      try {
        const response = await applicationService.getApplications();
        setApplications(response.data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setApplicationsError(error.message || 'Failed to load applications');
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, []); // Run once on mount

  const sidebarItems = [
    { icon: <Search className="h-5 w-5" />, label: 'Browse Jobs', active: activeView === 'browse', onClick: () => setActiveView('browse') },
    { icon: <Bookmark className="h-5 w-5" />, label: 'Saved Jobs', active: activeView === 'saved', onClick: () => setActiveView('saved'), badge: savedJobs.length },
    { icon: <FileText className="h-5 w-5" />, label: 'My Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: applications.length },
    { icon: <User className="h-5 w-5" />, label: 'Profile', active: activeView === 'profile', onClick: () => setActiveView('profile') },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', active: activeView === 'notifications', onClick: () => setActiveView('notifications'), badge: notifications.filter(n => !n.read).length },
  ];

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };
  
  const handleApplyJob = (job) => {
    setSelectedJob(job);
    setIsApplyDialogOpen(true);
  };
  
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setIsJobDetailsOpen(true);
  };

  const handleApplicationSuccess = (newApplication) => {
    // Refresh applications list
    setApplications(prev => [newApplication, ...prev]);
    // Show success message or switch to applications view
    setActiveView('applications');
  };

  const handleViewApplicationDetails = (application) => {
    setSelectedApplication(application);
    setIsApplicationDetailsOpen(true);
  };

  // Profile handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileUpdateError(null);
    setProfileUpdateSuccess(false);

    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        setProfileUpdateSuccess(true);
        setTimeout(() => setProfileUpdateSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileUpdateError(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Resume handlers
  const handleResumeUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setResumeError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setResumeError('File size must be less than 10MB');
      return;
    }

    setUploadingResume(true);
    setResumeError(null);

    try {
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        setResumes(prev => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setResumeError(error.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleResumeFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleResumeUpload(file);
    }
  };

  const handleResumeDragOver = (e) => {
    e.preventDefault();
    setIsDraggingResume(true);
  };

  const handleResumeDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingResume(false);
  };

  const handleResumeDrop = (e) => {
    e.preventDefault();
    setIsDraggingResume(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleResumeUpload(file);
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      await resumeService.deleteResume(resumeId);
      setResumes(prev => prev.filter(r => r._id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
      setResumeError(error.message || 'Failed to delete resume');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUploadDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const handleMarkNotificationRead = (notificationId) => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  };

  const handleMarkAllRead = () => {
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      notifications.forEach(notif => newSet.add(notif.id));
      return newSet;
    });
  };

  const handleNotificationClick = (notification) => {
    handleMarkNotificationRead(notification.id);
    if (notification.applicationId) {
      const application = applications.find(app => app._id === notification.applicationId);
      if (application) {
        handleViewApplicationDetails(application);
      }
    }
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of main content area when page changes
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, typeFilter]);

  // Filter jobs for saved view
  const displayJobs = activeView === 'saved' 
    ? jobs.filter(job => savedJobs.includes(job._id))
    : jobs;

  return (
    <DashboardLayout 
      user={user} 
      sidebarItems={sidebarItems} 
      theme="orange"
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      onViewAllNotifications={() => setActiveView('notifications')}
      onMarkAllRead={handleMarkAllRead}
    >
      {activeView === 'browse' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {loadingJobs ? 'Loading...' : `${totalJobs} ${totalJobs === 1 ? 'opportunity' : 'opportunities'} available`}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search jobs..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loadingJobs && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading jobs...</span>
            </div>
          )}

          {/* Error State */}
          {jobsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-800">Error: {jobsError}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loadingJobs && !jobsError && jobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">
                  No jobs match your current filters. Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job Listings */}
          {!loadingJobs && !jobsError && jobs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{job.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Badge variant="secondary">{job.department}</Badge>
                          <Badge variant="outline">{job.employmentType}</Badge>
                          {job.experienceLevel && (
                            <Badge variant="outline">{job.experienceLevel}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSaveJob(job._id)}
                      >
                        <Bookmark 
                          className={`h-5 w-5 ${savedJobs.includes(job._id) ? 'fill-orange-600 text-orange-600' : ''}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        ${job.salary?.min?.toLocaleString()} - ${job.salary?.max?.toLocaleString()} {job.salary?.currency || 'USD'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                      {job.openings > 1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          {job.openings} openings
                        </div>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge variant="outline">+{job.skills.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {applications.some(app => app.job?._id === job._id || app.job === job._id) ? (
                        <Button 
                          className="flex-1 bg-gray-400 cursor-not-allowed"
                          disabled
                        >
                          Already Applied
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                          onClick={() => handleApplyJob(job)}
                        >
                          Apply Now
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => handleViewJobDetails(job)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loadingJobs && !jobsError && jobs.length > 0 && totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* First Page */}
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {/* Previous Page */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                      >
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Current Page */}
                  <PaginationItem>
                    <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {/* Next Page */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Last Page */}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              {/* Pagination Info */}
              <p className="text-sm text-gray-600">
                Showing {jobs.length > 0 ? ((currentPage - 1) * jobsPerPage + 1) : 0} to {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
              </p>
            </div>
          )}
        </div>
      )}

      {activeView === 'saved' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
            <p className="text-sm sm:text-base text-gray-600">Your bookmarked job opportunities</p>
          </div>

          {/* Loading State */}
          {loadingJobs && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading saved jobs...</span>
            </div>
          )}

          {/* Error State */}
          {jobsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-800">Error: {jobsError}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loadingJobs && !jobsError && displayJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved jobs yet</h3>
                <p className="text-gray-600 mb-4">
                  Browse available positions and bookmark your favorites to view them here!
                </p>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => setActiveView('browse')}
                >
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Saved Job Listings */}
          {!loadingJobs && !jobsError && displayJobs.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {displayJobs.map((job) => (
                <Card key={job._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{job.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Badge variant="secondary">{job.department}</Badge>
                          <Badge variant="outline">{job.employmentType}</Badge>
                          {job.experienceLevel && (
                            <Badge variant="outline">{job.experienceLevel}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSaveJob(job._id)}
                      >
                        <Bookmark 
                          className="h-5 w-5 fill-orange-600 text-orange-600"
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        ${job.salary?.min?.toLocaleString()} - ${job.salary?.max?.toLocaleString()} {job.salary?.currency || 'USD'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                      {job.openings > 1 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          {job.openings} openings
                        </div>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Required Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="outline">{skill}</Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge variant="outline">+{job.skills.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {applications.some(app => app.job?._id === job._id || app.job === job._id) ? (
                        <Button 
                          className="flex-1 bg-gray-400 cursor-not-allowed"
                          disabled
                        >
                          Already Applied
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                          onClick={() => handleApplyJob(job)}
                        >
                          Apply Now
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => handleViewJobDetails(job)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'applications' && (
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
            <p className="text-sm sm:text-base text-gray-600">Track your application progress</p>
          </div>

          {/* Loading State */}
          {loadingApplications && (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-sm sm:text-base text-gray-600">Loading applications...</span>
            </div>
          )}

          {/* Error State */}
          {applicationsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm sm:text-base text-red-800">Error: {applicationsError}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loadingApplications && !applicationsError && applications.length === 0 && (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  You haven't applied to any jobs yet. Start browsing and apply to positions that interest you!
                </p>
                <Button 
                  className="bg-orange-600 hover:bg-orange-700 text-sm sm:text-base"
                  onClick={() => setActiveView('browse')}
                >
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          {!loadingApplications && !applicationsError && applications.length > 0 && (
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">All Applications</span>
                  <span className="sm:hidden">All</span> ({applications.length})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  Active ({applications.filter(app => !['rejected', 'withdrawn'].includes(app.status)).length})
                </TabsTrigger>
                <TabsTrigger value="archived" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
                  <span className="hidden sm:inline">Archived</span>
                  <span className="sm:hidden">Arch.</span> ({applications.filter(app => ['rejected', 'withdrawn'].includes(app.status)).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {applications.map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{app.job?.title || 'Position'}</h3>
                            <Badge className={`${statusColors[app.status] || statusColors['pending']} text-xs w-fit`}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {app.job?.department && `${app.job.department} • `}
                            Applied on {new Date(app.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => handleViewApplicationDetails(app)}
                          className="text-xs sm:text-sm w-full sm:w-auto"
                        >
                          View Details
                        </Button>
                      </div>

                      {/* Timeline - Mobile Responsive */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                          {/* Applied Stage - Always completed */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-600" />
                            </div>
                            <span className="text-xs sm:text-sm whitespace-nowrap">Applied</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-300 min-w-[20px] sm:min-w-[40px]" />
                          
                          {/* Review Stage - Completed if status is under_review, shortlisted, interview_scheduled, interviewed, offer_extended, or accepted */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${['under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'accepted'].includes(app.status) ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${['under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended', 'accepted'].includes(app.status) ? 'bg-blue-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-xs sm:text-sm whitespace-nowrap">Review</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-300 min-w-[20px] sm:min-w-[40px]" />
                          
                          {/* Interview Stage - Completed if status is interview_scheduled, interviewed, offer_extended, or accepted */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${['interview_scheduled', 'interviewed', 'offer_extended', 'accepted'].includes(app.status) ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${['interview_scheduled', 'interviewed', 'offer_extended', 'accepted'].includes(app.status) ? 'bg-purple-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-xs sm:text-sm whitespace-nowrap">Interview</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-300 min-w-[20px] sm:min-w-[40px]" />
                          
                          {/* Offer Stage - Completed if status is offer_extended or accepted */}
                          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-shrink-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${['offer_extended', 'accepted'].includes(app.status) ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${['offer_extended', 'accepted'].includes(app.status) ? 'bg-green-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-xs sm:text-sm whitespace-nowrap">Offer</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="active" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {applications.filter(app => !['rejected', 'withdrawn'].includes(app.status)).map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{app.job?.title || 'Position'}</h3>
                            <Badge className={`${statusColors[app.status] || statusColors['pending']} text-xs w-fit`}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {app.job?.department && `${app.job.department} • `}
                            Applied on {new Date(app.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => handleViewApplicationDetails(app)}
                          className="text-xs sm:text-sm w-full sm:w-auto"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="archived" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                {applications.filter(app => ['rejected', 'withdrawn'].includes(app.status)).map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{app.job?.title || 'Position'}</h3>
                            <Badge className={`${statusColors[app.status] || statusColors['pending']} text-xs w-fit`}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {app.job?.department && `${app.job.department} • `}
                            Applied on {new Date(app.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <Button 
                          variant="outline"
                          onClick={() => handleViewApplicationDetails(app)}
                          className="text-xs sm:text-sm w-full sm:w-auto"
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {activeView === 'profile' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your profile and resume</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {profileUpdateSuccess && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                      Profile updated successfully!
                    </div>
                  )}
                  {profileUpdateError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                      {profileUpdateError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">First Name</label>
                      <Input 
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Last Name</label>
                      <Input 
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Email</label>
                      <Input 
                        name="email"
                        value={profileData.email}
                        disabled 
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">Phone</label>
                      <Input 
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-sm text-gray-600 block mb-1">Location</label>
                      <Input 
                        name="location"
                        value={profileData.location}
                        onChange={handleProfileChange}
                        placeholder="City, State"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resumeError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    {resumeError}
                  </div>
                )}

                {/* Upload Area */}
                {!uploadingResume && (
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                      isDraggingResume 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleResumeDragOver}
                    onDragLeave={handleResumeDragLeave}
                    onDrop={handleResumeDrop}
                    onClick={() => document.getElementById('resume-upload')?.click()}
                  >
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">Drop your resume here or</p>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('resume-upload')?.click();
                      }}
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">PDF, DOC up to 10MB</p>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleResumeFileChange}
                      className="hidden"
                    />
                  </div>
                )}

                {uploadingResume && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Loader2 className="h-10 w-10 text-orange-600 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-gray-600">Uploading resume...</p>
                  </div>
                )}

                {/* Resumes List */}
                {loadingResumes ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-600 mx-auto" />
                  </div>
                ) : resumes.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Your Resumes</p>
                    {resumes.map((resume) => (
                      <div key={resume._id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatUploadDate(resume.createdAt)} • {formatFileSize(resume.fileSize)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              asChild
                            >
                              <a href={resume.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Upload className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteResume(resume._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No resumes uploaded yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Notifications View */}
      {activeView === 'notifications' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Stay updated on your application status
              </p>
            </div>
            {notifications.some(n => !n.read) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllRead}
                className="w-full sm:w-auto"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  You'll receive notifications about your job applications here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-orange-500 bg-orange-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon based on notification type */}
                      <div className={`flex-shrink-0 rounded-full p-2 sm:p-3 ${
                        notification.type === 'success' ? 'bg-green-100' :
                        notification.type === 'error' ? 'bg-red-100' :
                        notification.type === 'warning' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        {notification.type === 'success' && (
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {notification.type === 'error' && (
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {notification.type === 'warning' && (
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        {notification.type === 'info' && (
                          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>

                      {/* Notification content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base ${
                          !notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{notification.time}</p>
                        
                        {/* Show interview link for interview_scheduled notifications */}
                        {notification.aiInterviewLink && (
                          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <p className="text-xs font-semibold text-purple-800 mb-2">🎥 AI Video Interview Link:</p>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={notification.aiInterviewLink}
                                className="flex-1 px-2 py-1 text-xs border border-purple-300 rounded bg-white text-gray-700 truncate"
                              />
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(notification.aiInterviewLink);
                                  toast.success('Interview link copied!');
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-shrink-0 text-xs h-8"
                              >
                                Copy
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(notification.aiInterviewLink, '_blank');
                                }}
                                variant="default"
                                size="sm"
                                className="flex-shrink-0 text-xs h-8 bg-purple-600 hover:bg-purple-700"
                              >
                                Open
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <JobDetailsDialog
        isOpen={isJobDetailsOpen}
        onClose={() => setIsJobDetailsOpen(false)}
        jobId={selectedJob?._id}
      />
      
      <ApplyJobDialog
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
        job={selectedJob}
        onSuccess={handleApplicationSuccess}
        existingApplications={applications}
      />

      <ApplicationDetailsDialog
        isOpen={isApplicationDetailsOpen}
        onClose={() => setIsApplicationDetailsOpen(false)}
        applicationId={selectedApplication?._id}
        user={user}
      />
    </DashboardLayout>
  );
}
