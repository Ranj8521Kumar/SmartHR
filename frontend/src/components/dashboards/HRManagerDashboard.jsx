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
  Inbox
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
  const [jobsData, setJobsData] = useState([]);
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

  // Candidates page state
  const [allCandidates, setAllCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all');
  const [isCandidateDetailsOpen, setIsCandidateDetailsOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  // Interviews page state
  const [allInterviews, setAllInterviews] = useState([]);
  const [filteredInterviews, setFilteredInterviews] = useState([]);
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewSearchQuery, setInterviewSearchQuery] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('all');
  const [isInterviewDetailsOpen, setIsInterviewDetailsOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Communications page state
  const [allCommunications, setAllCommunications] = useState([]);
  const [filteredCommunications, setFilteredCommunications] = useState([]);
  const [communicationsLoading, setCommunicationsLoading] = useState(false);
  const [communicationSearchQuery, setCommunicationSearchQuery] = useState('');
  const [communicationTypeFilter, setCommunicationTypeFilter] = useState('all');
  const [isCommunicationDetailsOpen, setIsCommunicationDetailsOpen] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [dashboardResponse, applicationsResponse, jobsResponse] = await Promise.all([
        dashboardService.getDashboardAnalytics(),
        dashboardService.getApplications({ limit: 10, sort: '-createdAt' }),
        dashboardService.getJobs({ status: 'open', limit: 5 })
      ]);

      setDashboardData(dashboardResponse.data);
      setApplicationsData(applicationsResponse.data || []);
      setJobsData(jobsResponse.data || []);
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

  // Handle job creation
  const handleJobCreated = (newJob) => {
    // Add the new job to the jobs data
    setJobsData(prev => [newJob, ...prev]);
    // Refresh dashboard data to update stats
    fetchDashboardData();
  };

  // Handle job update
  const handleJobUpdated = (updatedJob) => {
    // Update the job in the jobs data
    setJobsData(prev => prev.map(job => job._id === updatedJob._id ? updatedJob : job));
    // Refresh dashboard data to update stats
    fetchDashboardData();
  };

  // Handle edit job click
  const handleEditJob = (job) => {
    setSelectedJob(job);
    setIsEditJobOpen(true);
  };

  // Handle view applications click
  const handleViewApplications = (job) => {
    setSelectedJob(job);
    setIsViewApplicationsOpen(true);
  };

  // Fetch all applications for Applications page
  const fetchAllApplications = async () => {
    setApplicationsLoading(true);
    try {
      const response = await applicationService.getApplications({ limit: 100 });
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
    setAllApplications(prev => 
      prev.map(app => app._id === updatedApplication._id ? updatedApplication : app)
    );
    filterApplicationsByStatus(
      allApplications.map(app => app._id === updatedApplication._id ? updatedApplication : app),
      statusFilter,
      searchQuery
    );
    fetchDashboardData(); // Refresh dashboard stats
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
      const response = await applicationService.updateApplicationStatus(applicationId, newStatus, feedback);
      if (response.success) {
        // Refresh interviews
        await fetchAllInterviews();
        // Refresh dashboard stats
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating interview status:', err);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communicationTypeFilter, communicationSearchQuery]);

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
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs') },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: summary.totalApplications || 0 },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <Calendar className="h-5 w-5" />, label: 'Interviews', active: activeView === 'interviews', onClick: () => setActiveView('interviews'), badge: allInterviews.length || 0 },
    { icon: <Mail className="h-5 w-5" />, label: 'Communications', active: activeView === 'communications', onClick: () => setActiveView('communications') },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
  ];

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="purple">
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
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="purple">
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
    <DashboardLayout user={user} sidebarItems={sidebarItems} theme="purple">
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">HR Manager Dashboard</h1>
            <p className="text-gray-600">Recruitment and candidate management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="flex items-center justify-between">
                <CardTitle>Application Pipeline</CardTitle>
                <Button variant="outline" size="sm">View All</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {getApplicationsByStatus().map((stage, index) => (
                  <div key={index} className={`${stage.color} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stage.applications.length > 0 ? (
                        stage.applications.map((app) => (
                          <div key={app.id} className="bg-white p-3 rounded shadow-sm">
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
              <CardTitle>Recent Applications</CardTitle>
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
                      <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-12 h-12 rounded-full" 
                          />
                          <div>
                            <p className="font-medium">{candidateName}</p>
                            <p className="text-sm text-gray-500">{jobTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant={statusBadgeMap[app.status]} className="mb-1">
                              {statusLabelMap[app.status]}
                            </Badge>
                            <p className="text-xs text-gray-500">{appliedDate}</p>
                          </div>
                          <div className="text-center">
                            <div className="text-purple-600 font-semibold mb-1">{score}</div>
                            <Progress value={score} className="w-20" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" title="View Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" title="Approve">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="outline" title="Reject">
                              <XCircle className="h-4 w-4 text-red-600" />
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
              <h1 className="text-gray-900 mb-2">Applications</h1>
              <p className="text-gray-600">Manage all job applications</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
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
                  <SelectTrigger className="w-[200px]">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {filteredApplications.map((app) => {
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
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-14 h-14 rounded-full" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {candidateName}
                              </h3>
                              <Badge variant={statusBadgeMap[app.status]}>
                                {statusLabelMap[app.status]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{jobTitle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{app.applicant?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Applied: {appliedDate}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-sm text-gray-600">AI Match:</span>
                              <div className="flex items-center gap-2 flex-1 max-w-xs">
                                <Progress value={score} className="flex-1" />
                                <span className="font-semibold text-purple-600">{score}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewApplicationDetails(app._id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {app.status !== 'accepted' && app.status !== 'rejected' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleQuickStatusUpdate(app._id, 'shortlisted')}
                                title="Shortlist"
                                disabled={app.status === 'shortlisted'}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
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
        </div>
      )}

      {activeView === 'candidates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Candidates</h1>
              <p className="text-gray-600">Manage all candidates and their applications</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
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
                  <SelectTrigger className="w-[200px]">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Total Candidates</div>
                <div className="text-2xl font-bold text-gray-900">{allCandidates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Active</div>
                <div className="text-2xl font-bold text-blue-600">
                  {allCandidates.filter(c => 
                    ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended']
                    .includes(c.latestStatus)
                  ).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Hired</div>
                <div className="text-2xl font-bold text-green-600">
                  {allCandidates.filter(c => c.latestStatus === 'accepted').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600 mb-1">Avg Applications</div>
                <div className="text-2xl font-bold text-purple-600">
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
              {filteredCandidates.map((candidate) => {
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
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                            alt={candidateName} 
                            className="w-16 h-16 rounded-full" 
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-xl text-gray-900">
                                {candidateName}
                              </h3>
                              <Badge variant={latestStatusBadgeMap[candidate.latestStatus]}>
                                {latestStatusLabelMap[candidate.latestStatus]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{candidate.email}</span>
                              </div>
                              {candidate.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{candidate.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{candidate.totalApplications} {candidate.totalApplications === 1 ? 'Application' : 'Applications'}</span>
                              </div>
                            </div>
                            {candidate.averageScore > 0 && (
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">Average Score:</span>
                                <div className="flex items-center gap-2 flex-1 max-w-xs">
                                  <Progress value={candidate.averageScore} className="flex-1" />
                                  <span className="font-semibold text-purple-600 min-w-[3rem]">{candidate.averageScore}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewCandidateDetails(candidate._id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
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
        </div>
      )}

      {activeView === 'interviews' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Interviews</h1>
              <p className="text-gray-600">Manage and schedule interviews</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
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
                  <SelectTrigger className="w-[200px]">
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
            <div className="space-y-4">
              {filteredInterviews.map((interview) => {
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
              <h2 className="text-2xl font-bold text-gray-900">Communications</h2>
              <p className="text-gray-600 mt-1">View and manage all candidate communications</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              {filteredCommunications.map((communication) => {
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
        </div>
      )}

      {activeView === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Job Postings</h1>
              <p className="text-gray-600">Create and manage job openings</p>
            </div>
            <Button onClick={() => setIsCreateJobOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Job Posting
            </Button>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active ({jobsData.filter(j => j.status === 'open').length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({jobsData.filter(j => j.status === 'draft').length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({jobsData.filter(j => j.status === 'closed').length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4 mt-6">
              {jobsData.filter(j => j.status === 'open').length > 0 ? (
                jobsData.filter(j => j.status === 'open').map((job) => {
                  const daysAgo = Math.floor((new Date() - new Date(job.createdAt)) / (1000 * 60 * 60 * 24));
                  return (
                    <Card key={job._id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{job.department}</span>
                              <span>â€¢</span>
                              <span>{job.applicationsCount || 0} applications</span>
                              <span>â€¢</span>
                              <span>Posted {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleEditJob(job)}>
                              Edit
                            </Button>
                            <Button onClick={() => handleViewApplications(job)}>
                              View Applications
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No active job postings</p>
                  <Button className="mt-4" onClick={() => setIsCreateJobOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Job
                  </Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="draft" className="space-y-4 mt-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No draft job postings</p>
              </div>
            </TabsContent>
            <TabsContent value="closed" className="space-y-4 mt-6">
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No closed job postings</p>
              </div>
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
        onClose={() => setIsViewApplicationsOpen(false)}
        job={selectedJob}
      />

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        isOpen={isApplicationDetailsOpen}
        onClose={() => setIsApplicationDetailsOpen(false)}
        applicationId={selectedApplicationId}
        onStatusUpdate={handleApplicationStatusUpdate}
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
    </DashboardLayout>
  );
}
