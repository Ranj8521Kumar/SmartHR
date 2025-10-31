import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import StatsCard from '../shared/StatsCard';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  Star,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Eye,
  XCircle,
  Loader2,
  MapPin,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import dashboardService from '../../services/dashboardService';
import applicationService from '../../services/applicationService';
import CreateJobForm from '../jobs/CreateJobForm';
import JobDetailsDialog from '../jobs/JobDetailsDialog';
import ViewApplicationsDialog from '../jobs/ViewApplicationsDialog';
import CandidateDetailsDialog from '../candidates/CandidateDetailsDialog';
import SettingsDialog from '../settings/SettingsDialog';

export default function ManagerDashboard({ user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Dialog states
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [isViewApplicationsOpen, setIsViewApplicationsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isCandidateDetailsOpen, setIsCandidateDetailsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Applications page state
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentApplicationsPage, setCurrentApplicationsPage] = useState(1);
  const applicationsPerPage = 8;
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  // Candidates page state
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [candidateFilter, setCandidateFilter] = useState('all');
  const [currentCandidatesPage, setCurrentCandidatesPage] = useState(1);
  const candidatesPerPage = 8;

  // Approvals page state
  const [approvals, setApprovals] = useState([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [approvingApprovalId, setApprovingApprovalId] = useState(null);
  const [rejectingApprovalId, setRejectingApprovalId] = useState(null);

  // Requisitions page state
  const [requisitionSearchQuery, setRequisitionSearchQuery] = useState('');
  const [requisitionStatusFilter, setRequisitionStatusFilter] = useState('all');
  const [currentRequisitionsPage, setCurrentRequisitionsPage] = useState(1);
  const requisitionsPerPage = 6;
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      openPositions: 0,
      totalApplications: 0,
      applicationTrend: 0,
      interviewsScheduled: 0,
      pendingApprovals: 0
    },
    activeRequisitions: [],
    hiringProgress: [],
    topCandidates: [],
    pendingApprovals: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeView === 'applications') {
      fetchApplications();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'candidates') {
      fetchCandidates();
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'approvals') {
      fetchApprovals();
    }
  }, [activeView]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getManagerDashboardAnalytics();
      if (response.success) {
        setDashboardData(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApplications(true);
      const response = await dashboardService.getApplications();
      if (response.success) {
        setApplications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoadingCandidates(true);
      // Fetch all applications, then filter client-side for relevant statuses
      const response = await dashboardService.getApplications();
      if (response.success) {
        const all = response.data || [];
        const relevantStatuses = new Set(['shortlisted','interview_scheduled','interviewed','offer_extended']);
        const filtered = all.filter(app => relevantStatuses.has(app.status));
        setCandidates(filtered);
        setCurrentCandidatesPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoadingApprovals(true);
      // Fetch applications that need manager approval (offer_extended status)
      const response = await dashboardService.getApplications({
        status: 'offer_extended'
      });
      if (response.success) {
        setApprovals(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApproveApplication = async (application) => {
    try {
      setApprovingId(application._id);
      await applicationService.updateApplicationStatus(
        application._id,
        'shortlisted',
        'Application approved by manager'
      );
      await fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectApplication = async (application) => {
    try {
      setRejectingId(application._id);
      await applicationService.updateApplicationStatus(
        application._id,
        'rejected',
        'Application rejected by manager'
      );
      await fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setRejectingId(null);
    }
  };

  const handleViewCandidate = (application) => {
    setSelectedApplication(application);
    setIsCandidateDetailsOpen(true);
  };

  const handleApproveApproval = async (approval) => {
    try {
      setApprovingApprovalId(approval._id);
      await applicationService.updateApplicationStatus(
        approval._id,
        'accepted',
        'Offer approved by manager'
      );
      await fetchApprovals();
      await fetchDashboardData(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error approving offer:', error);
      alert('Failed to approve offer. Please try again.');
    } finally {
      setApprovingApprovalId(null);
    }
  };

  const handleRejectApproval = async (approval) => {
    try {
      setRejectingApprovalId(approval._id);
      await applicationService.updateApplicationStatus(
        approval._id,
        'rejected',
        'Offer rejected by manager'
      );
      await fetchApprovals();
      await fetchDashboardData(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer. Please try again.');
    } finally {
      setRejectingApprovalId(null);
    }
  };

  const getFilteredApplications = () => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      const statusMap = {
        'new': ['submitted'],
        'review': ['under_review', 'shortlisted'],
        'interview': ['interview_scheduled', 'interviewed'],
        'offer': ['offer_extended'],
        'hired': ['accepted'],
        'rejected': ['rejected', 'withdrawn']
      };
      filtered = filtered.filter(app => statusMap[statusFilter]?.includes(app.status));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.applicant?.firstName?.toLowerCase().includes(query) ||
        app.applicant?.lastName?.toLowerCase().includes(query) ||
        app.applicant?.email?.toLowerCase().includes(query) ||
        app.job?.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Applications pagination helpers
  const getPaginatedApplications = () => {
    const filtered = getFilteredApplications();
    const startIndex = (currentApplicationsPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalApplicationsPages = () => {
    const filtered = getFilteredApplications();
    return Math.ceil(filtered.length / applicationsPerPage) || 1;
  };

  const handleApplicationsPageChange = (page) => {
    setCurrentApplicationsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset Applications page when filters/search change
  useEffect(() => {
    setCurrentApplicationsPage(1);
  }, [searchQuery, statusFilter]);

  const getFilteredCandidates = () => {
    let filtered = candidates;

    // Filter by status
    if (candidateFilter !== 'all') {
      const statusMap = {
        'shortlisted': ['shortlisted'],
        'interview': ['interview_scheduled', 'interviewed'],
        'offer': ['offer_extended']
      };
      filtered = filtered.filter(app => statusMap[candidateFilter]?.includes(app.status));
    }

    // Filter by search query
    if (candidateSearchQuery) {
      const query = candidateSearchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.applicant?.firstName?.toLowerCase().includes(query) ||
        app.applicant?.lastName?.toLowerCase().includes(query) ||
        app.applicant?.email?.toLowerCase().includes(query) ||
        app.job?.title?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Pagination helpers for Candidates
  const getPaginatedCandidates = () => {
    const filtered = getFilteredCandidates();
    const startIndex = (currentCandidatesPage - 1) * candidatesPerPage;
    const endIndex = startIndex + candidatesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalCandidatePages = () => {
    const filtered = getFilteredCandidates();
    return Math.ceil(filtered.length / candidatesPerPage) || 1;
  };

  const handleCandidatesPageChange = (page) => {
    setCurrentCandidatesPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to first page when candidate filters change
  useEffect(() => {
    setCurrentCandidatesPage(1);
  }, [candidateSearchQuery, candidateFilter]);

  // Define handleSettingsClick before sidebarItems
  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Requisitions', active: activeView === 'requisitions', onClick: () => setActiveView('requisitions'), badge: (dashboardData.activeRequisitions || []).length },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: dashboardData.stats.totalApplications },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <CheckCircle className="h-5 w-5" />, label: 'Approvals', active: activeView === 'approvals', onClick: () => setActiveView('approvals'), badge: dashboardData.stats.pendingApprovals },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', active: false, onClick: handleSettingsClick },
  ];

  const toggleCandidateSelection = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setIsJobDetailsOpen(true);
  };

  const handleReviewCandidates = (job) => {
    setSelectedJob(job);
    setIsViewApplicationsOpen(true);
  };

  const handleNewRequisition = () => {
    setIsCreateJobOpen(true);
  };

  const handleJobCreated = () => {
    setIsCreateJobOpen(false);
    fetchDashboardData(); // Refresh the dashboard data
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Filter and paginate requisitions
  const getFilteredRequisitions = () => {
    let filtered = dashboardData.activeRequisitions || [];

    // Apply search filter
    if (requisitionSearchQuery.trim()) {
      const query = requisitionSearchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.title?.toLowerCase().includes(query) ||
        req.department?.toLowerCase().includes(query) ||
        req.location?.toLowerCase().includes(query) ||
        req.type?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (requisitionStatusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === requisitionStatusFilter);
    }

    return filtered;
  };

  const getPaginatedRequisitions = () => {
    const filtered = getFilteredRequisitions();
    const startIndex = (currentRequisitionsPage - 1) * requisitionsPerPage;
    const endIndex = startIndex + requisitionsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalRequisitionsPages = () => {
    const filtered = getFilteredRequisitions();
    return Math.ceil(filtered.length / requisitionsPerPage);
  };

  const handleRequisitionsPageChange = (page) => {
    setCurrentRequisitionsPage(page);
    // Smooth scroll to top of requisitions section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentRequisitionsPage(1);
  }, [requisitionSearchQuery, requisitionStatusFilter]);

  const getStatusBadgeVariant = (status) => {
    const variants = {
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
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'submitted': 'New',
      'under_review': 'Under Review',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interviewed': 'Interviewed',
      'offer_extended': 'Offer Extended',
      'accepted': 'Hired',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green" onSettingsClick={handleSettingsClick}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green" onSettingsClick={handleSettingsClick}>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-600 text-lg">{error}</div>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      user={user} 
      sidebarItems={sidebarItems} 
      theme="green" 
      onSettingsClick={handleSettingsClick}
      notifications={[]}
      onNotificationClick={() => {}}
      onViewAllNotifications={() => {}}
      onMarkAllRead={() => {}}
    >
      {activeView === 'dashboard' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Manager Dashboard</h1>
              <p className="text-sm md:text-base text-gray-600">
                <span className="block sm:inline">Department hiring overview - {user.department || 'All Departments'}</span>
                {lastUpdated && (
                  <span className="block sm:inline sm:ml-3 text-xs md:text-sm text-gray-500 mt-1 sm:mt-0">
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchDashboardData} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="sm:inline">Refresh</span>
            </Button>
          </div>

          {/* Stats Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <StatsCard
              title="Open Positions"
              value={dashboardData.stats.openPositions.toString()}
              icon={<Briefcase className="h-5 w-5 md:h-6 md:w-6" />}
              color="green"
            />
            <StatsCard
              title="Applications"
              value={dashboardData.stats.totalApplications.toString()}
              icon={<FileText className="h-5 w-5 md:h-6 md:w-6" />}
              color="blue"
              trend={{ 
                value: Math.abs(dashboardData.stats.applicationTrend), 
                isPositive: dashboardData.stats.applicationTrend >= 0 
              }}
            />
            <StatsCard
              title="Interviews Scheduled"
              value={dashboardData.stats.interviewsScheduled.toString()}
              icon={<Users className="h-5 w-5 md:h-6 md:w-6" />}
              color="purple"
            />
            <StatsCard
              title="Pending Approvals"
              value={dashboardData.stats.pendingApprovals.toString()}
              icon={<Clock className="h-5 w-5 md:h-6 md:w-6" />}
              color="orange"
            />
          </div>

          {/* Active Requisitions - Mobile Responsive */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg md:text-xl">Active Job Requisitions</CardTitle>
                <Button onClick={handleNewRequisition} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="sm:inline">New Requisition</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.activeRequisitions.length === 0 ? (
                <div className="text-center py-8 text-sm md:text-base text-gray-500">
                  No active requisitions found
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {dashboardData.activeRequisitions.map((req) => (
                    <div key={req._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900">{req.title}</h3>
                          <Badge variant={req.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {req.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                          <span>{req.applicants} applicants</span>
                          <span>•</span>
                          <span>{req.interviews} interviews</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJobDetails(req)}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                        >
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleReviewCandidates(req)}
                          className="flex-1 sm:flex-none text-xs md:text-sm"
                        >
                          <span className="hidden sm:inline">Review Candidates</span>
                          <span className="sm:hidden">Review</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hiring Progress - Mobile Responsive */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Department Hiring Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.hiringProgress.length === 0 ? (
                <div className="text-center py-8 text-sm md:text-base text-gray-500">
                  No hiring progress data available
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {dashboardData.hiringProgress.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm md:text-base font-medium">{item.role}</span>
                        <span className="text-xs md:text-sm text-gray-600 whitespace-nowrap ml-2">
                          {item.current}/{item.target} filled
                        </span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'requisitions' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Job Requisitions</h1>
              <p className="text-sm md:text-base text-gray-600">Manage all job requisitions for your department</p>
            </div>
            <Button onClick={handleNewRequisition} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span>New Requisition</span>
            </Button>
          </div>

          {/* Filters Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by title, department, location, or type..."
                      value={requisitionSearchQuery}
                      onChange={(e) => setRequisitionSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Select value={requisitionStatusFilter} onValueChange={setRequisitionStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Total Requisitions</p>
                    <p className="text-xl md:text-2xl font-bold">{getFilteredRequisitions().length}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Open Positions</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {getFilteredRequisitions().filter(r => r.status === 'open').length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Total Applications</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {getFilteredRequisitions().reduce((sum, r) => sum + r.applicants, 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Interviews</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {getFilteredRequisitions().reduce((sum, r) => sum + r.interviews, 0)}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requisitions List */}
          {getFilteredRequisitions().length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <Briefcase className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base mb-2">
                    {requisitionSearchQuery || requisitionStatusFilter !== 'all' 
                      ? 'No requisitions found matching your filters' 
                      : 'No job requisitions found'}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400 mb-4">
                    {requisitionSearchQuery || requisitionStatusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Create your first job requisition to start hiring'}
                  </p>
                  <Button onClick={handleNewRequisition}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Requisition
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {getPaginatedRequisitions().map((req) => (
                  <Card key={req._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Job Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">{req.title}</h3>
                            <Badge variant={req.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                              {req.status}
                            </Badge>
                          </div>
                          
                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Location</p>
                              <p className="text-sm font-medium text-gray-900">{req.location || 'Remote'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Type</p>
                              <p className="text-sm font-medium text-gray-900">{req.type || 'Full-time'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Department</p>
                              <p className="text-sm font-medium text-gray-900">{req.department || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Posted</p>
                              <p className="text-sm font-medium text-gray-900">
                                {req.createdAt ? formatDate(req.createdAt) : 'Recently'}
                              </p>
                            </div>
                          </div>

                          {/* Statistics */}
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-600">{req.applicants} applicants</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-gray-600">{req.interviews} interviews</span>
                            </div>
                            {req.salary && (
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 text-yellow-600" />
                                <span className="text-gray-600">${req.salary.min}k - ${req.salary.max}k</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewJobDetails(req)}
                            className="w-full text-xs md:text-sm"
                          >
                            View Details
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleReviewCandidates(req)}
                            className="w-full text-xs md:text-sm"
                          >
                            Review Candidates
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {getTotalRequisitionsPages() > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handleRequisitionsPageChange(Math.max(1, currentRequisitionsPage - 1))}
                          className={currentRequisitionsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {[...Array(getTotalRequisitionsPages())].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalRequisitionsPages();
                        
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentRequisitionsPage - 1 && pageNumber <= currentRequisitionsPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => handleRequisitionsPageChange(pageNumber)}
                                isActive={currentRequisitionsPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentRequisitionsPage - 2 ||
                          pageNumber === currentRequisitionsPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handleRequisitionsPageChange(Math.min(getTotalRequisitionsPages(), currentRequisitionsPage + 1))}
                          className={currentRequisitionsPage === getTotalRequisitionsPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeView === 'applications' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Applications</h1>
              <p className="text-sm md:text-base text-gray-600">Manage all job applications for your department</p>
            </div>
            <Button onClick={fetchApplications} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email or job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="new" className="text-xs">New</TabsTrigger>
                      <TabsTrigger value="review" className="text-xs">Review</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="text-xl md:text-2xl font-bold">{applications.length}</p>
                  </div>
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">New</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {applications.filter(a => a.status === 'submitted').length}
                    </p>
                  </div>
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Shortlisted</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {applications.filter(a => a.status === 'shortlisted').length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Interviewed</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {applications.filter(a => a.status === 'interviewed').length}
                    </p>
                  </div>
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          {loadingApplications ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600">Loading applications...</span>
                </div>
              </CardContent>
            </Card>
          ) : getFilteredApplications().length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base mb-2">No applications found</p>
                  <p className="text-xs md:text-sm text-gray-400">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Applications will appear here when candidates apply'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {getPaginatedApplications().map((app) => (
                <Card key={app._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Candidate Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.applicant?.email || 'default'}`}
                          alt={`${app.applicant?.firstName} ${app.applicant?.lastName}`}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">
                              {app.applicant?.firstName} {app.applicant?.lastName}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(app.status)} className="text-xs">
                              {getStatusLabel(app.status)}
                            </Badge>
                          </div>

                          {/* Job Title */}
                          <div className="mb-2">
                            <p className="text-sm md:text-base text-gray-700 font-medium">
                              {app.job?.title || 'Position not specified'}
                            </p>
                          </div>

                          {/* Contact Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="truncate">{app.applicant?.email}</span>
                            </div>
                            {app.applicant?.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{app.applicant.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                              <span>Applied {formatDate(app.createdAt)}</span>
                            </div>
                            {app.aiMatchScore !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
                                <span>Match: {Math.round(app.aiMatchScore)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40 lg:flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCandidate(app)}
                              className="w-full text-xs md:text-sm"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              View Details
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View candidate details</p>
                          </TooltipContent>
                        </Tooltip>
                        {app.status !== 'accepted' && app.status !== 'rejected' && (
                          <div className="flex gap-2 w-full">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveApplication(app)}
                                  disabled={approvingId === app._id || rejectingId === app._id || app.status === 'shortlisted'}
                                  className={`flex-1 min-w-0 text-xs md:text-sm whitespace-nowrap ${
                                    app.status === 'shortlisted'
                                      ? 'bg-green-200 text-green-800 hover:bg-green-200 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {approvingId === app._id ? (
                                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                  ) : app.status === 'shortlisted' ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline truncate">Approved</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline truncate">Approve</span>
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{app.status === 'shortlisted' ? 'Application already approved' : 'Approve this application'}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectApplication(app)}
                                  disabled={approvingId === app._id || rejectingId === app._id}
                                  className="flex-1 min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm whitespace-nowrap"
                                >
                                  {rejectingId === app._id ? (
                                    <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                                      <span className="hidden sm:inline truncate">Reject</span>
                                    </>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reject this application</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {getTotalApplicationsPages() > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handleApplicationsPageChange(Math.max(1, currentApplicationsPage - 1))}
                          className={currentApplicationsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {[...Array(getTotalApplicationsPages())].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalApplicationsPages();
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentApplicationsPage - 1 && pageNumber <= currentApplicationsPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => handleApplicationsPageChange(pageNumber)}
                                isActive={currentApplicationsPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentApplicationsPage - 2 ||
                          pageNumber === currentApplicationsPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handleApplicationsPageChange(Math.min(getTotalApplicationsPages(), currentApplicationsPage + 1))}
                          className={currentApplicationsPage === getTotalApplicationsPages() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeView === 'candidates' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Candidates</h1>
              <p className="text-sm md:text-base text-gray-600">Review and compare shortlisted candidates</p>
            </div>
            <div className="flex gap-2">
              {selectedCandidates.length > 0 && (
                <Button className="flex-1 sm:flex-none">
                  <Users className="h-4 w-4 mr-2" />
                  Compare ({selectedCandidates.length})
                </Button>
              )}
              <Button onClick={fetchCandidates} variant="outline" className="flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search candidates by name or email..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-56">
                  <Tabs value={candidateFilter} onValueChange={setCandidateFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="shortlisted" className="text-xs">Shortlisted</TabsTrigger>
                      <TabsTrigger value="interview" className="text-xs">Interview</TabsTrigger>
                      <TabsTrigger value="offer" className="text-xs">Offer</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="text-xl md:text-2xl font-bold">{candidates.length}</p>
                  </div>
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Shortlisted</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {candidates.filter(c => c.status === 'shortlisted').length}
                    </p>
                  </div>
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Interview</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {candidates.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status)).length}
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Offers</p>
                    <p className="text-xl md:text-2xl font-bold">
                      {candidates.filter(c => c.status === 'offer_extended').length}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidates List */}
          {loadingCandidates ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600">Loading candidates...</span>
                </div>
              </CardContent>
            </Card>
          ) : getFilteredCandidates().length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base mb-2">No candidates available for review</p>
                  <p className="text-xs md:text-sm text-gray-400">
                    {candidateSearchQuery || candidateFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Candidates will appear here after being shortlisted'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {getPaginatedCandidates().map((candidate) => (
                <Card 
                  key={candidate._id}
                  className={`hover:shadow-lg transition-shadow ${selectedCandidates.includes(candidate._id) ? 'ring-2 ring-green-600' : ''}`}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.applicant?.email || 'default'}`} 
                          alt={`${candidate.applicant?.firstName} ${candidate.applicant?.lastName}`}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 truncate">
                            {candidate.applicant?.firstName} {candidate.applicant?.lastName}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{candidate.job?.title || 'Position'}</p>
                          <p className="text-xs text-gray-500">Applied {formatDate(candidate.createdAt)}</p>
                        </div>
                      </div>
                      {candidate.aiMatchScore !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs md:text-sm text-green-600 mb-1">Match</div>
                          <div className="text-lg md:text-xl font-bold text-gray-900">{Math.round(candidate.aiMatchScore)}%</div>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                        <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                        <span className="truncate">{candidate.applicant?.email}</span>
                      </div>
                      {candidate.applicant?.phone && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                          <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span>{candidate.applicant.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {candidate.applicant?.skills && candidate.applicant.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs md:text-sm text-gray-600 mb-2">Key Skills:</p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {candidate.applicant.skills.slice(0, 5).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                          {candidate.applicant.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{candidate.applicant.skills.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs md:text-sm">Status</Label>
                        <div className="mt-1">
                          <Badge variant={getStatusBadgeVariant(candidate.status)} className="text-xs">
                            {getStatusLabel(candidate.status)}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Notes</Label>
                        <Textarea 
                          placeholder="Add interview feedback or notes..." 
                          className="mt-1 text-xs md:text-sm min-h-[60px] md:min-h-[80px]" 
                          defaultValue={candidate.notes || ''}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button 
                          variant={selectedCandidates.includes(candidate._id) ? 'default' : 'outline'}
                          className="flex-1 text-xs md:text-sm"
                          onClick={() => toggleCandidateSelection(candidate._id)}
                        >
                          {selectedCandidates.includes(candidate._id) ? (
                            <>
                              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                              <span className="hidden sm:inline">Selected</span>
                              <span className="sm:hidden">Selected</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Select for Comparison</span>
                              <span className="sm:hidden">Select</span>
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-xs md:text-sm"
                          onClick={() => handleViewCandidate(candidate)}
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {getTotalCandidatePages() > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handleCandidatesPageChange(Math.max(1, currentCandidatesPage - 1))}
                          className={currentCandidatesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {[...Array(getTotalCandidatePages())].map((_, index) => {
                        const pageNumber = index + 1;
                        const totalPages = getTotalCandidatePages();
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentCandidatesPage - 1 && pageNumber <= currentCandidatesPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                onClick={() => handleCandidatesPageChange(pageNumber)}
                                isActive={currentCandidatesPage === pageNumber}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentCandidatesPage - 2 ||
                          pageNumber === currentCandidatesPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handleCandidatesPageChange(Math.min(getTotalCandidatePages(), currentCandidatesPage + 1))}
                          className={currentCandidatesPage === getTotalCandidatePages() ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeView === 'approvals' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Pending Approvals</h1>
              <p className="text-sm md:text-base text-gray-600">Review and approve hiring decisions</p>
            </div>
            <Button onClick={fetchApprovals} variant="outline" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Pending Approvals</p>
                    <p className="text-xl md:text-2xl font-bold">{approvals.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Offers Extended</p>
                    <p className="text-xl md:text-2xl font-bold">{approvals.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Awaiting Decision</p>
                    <p className="text-xl md:text-2xl font-bold">{approvals.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Approvals List */}
          {loadingApprovals ? (
            <Card>
              <CardContent className="p-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-3 text-gray-600">Loading approvals...</span>
                </div>
              </CardContent>
            </Card>
          ) : approvals.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base mb-2">No pending approvals</p>
                  <p className="text-xs md:text-sm text-gray-400">
                    All offers have been reviewed
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {approvals.map((approval) => (
                <Card key={approval._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Candidate Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${approval.applicant?.email || 'default'}`}
                          alt={`${approval.applicant?.firstName} ${approval.applicant?.lastName}`}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className="text-xs bg-orange-600">Offer Extended</Badge>
                            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                              {approval.applicant?.firstName} {approval.applicant?.lastName}
                            </h3>
                          </div>
                          
                          {/* Position */}
                          <div className="mb-3">
                            <p className="text-sm md:text-base text-gray-700 font-medium">
                              {approval.job?.title || 'Position not specified'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500">
                              {approval.job?.department || 'Department'} • {approval.job?.location || 'Location'}
                            </p>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                              <span className="truncate">{approval.applicant?.email}</span>
                            </div>
                            {approval.applicant?.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                <span>{approval.applicant.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                              <span>Offer sent {formatDate(approval.updatedAt || approval.createdAt)}</span>
                            </div>
                            {approval.aiMatchScore !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-600 flex-shrink-0" />
                                <span>Match: {Math.round(approval.aiMatchScore)}%</span>
                              </div>
                            )}
                          </div>

                          {/* Notes if any */}
                          {approval.notes && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs md:text-sm text-gray-700">
                              <p className="font-medium mb-1">Notes:</p>
                              <p className="line-clamp-2">{approval.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCandidate(approval)}
                          className="w-full text-xs md:text-sm"
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveApproval(approval)}
                            disabled={approvingApprovalId === approval._id || rejectingApprovalId === approval._id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs md:text-sm"
                          >
                            {approvingApprovalId === approval._id ? (
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectApproval(approval)}
                            disabled={approvingApprovalId === approval._id || rejectingApprovalId === approval._id}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm"
                          >
                            {rejectingApprovalId === approval._id ? (
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateJobForm
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={handleJobCreated}
      />

      <JobDetailsDialog
        isOpen={isJobDetailsOpen}
        onClose={() => setIsJobDetailsOpen(false)}
        jobId={selectedJob?._id}
      />

      <ViewApplicationsDialog
        isOpen={isViewApplicationsOpen}
        onClose={() => setIsViewApplicationsOpen(false)}
        job={selectedJob}
      />

      <CandidateDetailsDialog
        isOpen={isCandidateDetailsOpen}
        onClose={() => setIsCandidateDetailsOpen(false)}
        candidateId={selectedApplication?.applicant?._id}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </DashboardLayout>
  );
}
