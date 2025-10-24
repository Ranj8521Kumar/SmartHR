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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import dashboardService from '../../services/dashboardService';
import CreateJobForm from '../jobs/CreateJobForm';
import JobDetailsDialog from '../jobs/JobDetailsDialog';
import ViewApplicationsDialog from '../jobs/ViewApplicationsDialog';

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

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Requisitions', active: activeView === 'requisitions', onClick: () => setActiveView('requisitions') },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: dashboardData.stats.totalApplications },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <CheckCircle className="h-5 w-5" />, label: 'Approvals', active: activeView === 'approvals', onClick: () => setActiveView('approvals'), badge: dashboardData.stats.pendingApprovals },
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

  if (loading) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-red-600 text-lg">{error}</div>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green">
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

      {activeView === 'candidates' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Candidate Comparison</h1>
              <p className="text-sm md:text-base text-gray-600">Compare and review shortlisted candidates</p>
            </div>
            {selectedCandidates.length > 0 && (
              <Button className="w-full sm:w-auto">
                Compare Selected ({selectedCandidates.length})
              </Button>
            )}
          </div>

          {dashboardData.topCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base">No candidates available for review</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {dashboardData.topCandidates.map((candidate) => (
                <Card 
                  key={candidate._id}
                  className={selectedCandidates.includes(candidate._id) ? 'ring-2 ring-green-600' : ''}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} 
                          alt={candidate.name} 
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0" 
                        />
                        <div>
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 truncate">{candidate.name}</h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{candidate.position}</p>
                          <p className="text-xs text-gray-500">{candidate.experience} experience</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs md:text-sm text-green-600 mb-1">Match Score</div>
                        <div className="text-lg md:text-xl font-bold text-gray-900">{Math.round(candidate.score)}%</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs md:text-sm text-gray-600 mb-2">Key Skills:</p>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {candidate.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {candidate.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{candidate.skills.length - 5} more</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs md:text-sm">Interview Status</Label>
                        <div className="mt-1">
                          <Badge variant={candidate.status === 'interviewed' ? 'default' : 'secondary'} className="text-xs">
                            {candidate.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs md:text-sm">Feedback</Label>
                        <Textarea 
                          placeholder="Add your interview feedback..." 
                          className="mt-1 text-xs md:text-sm min-h-[60px] md:min-h-[80px]" 
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button 
                          variant={selectedCandidates.includes(candidate._id) ? 'default' : 'outline'}
                          className="flex-1 text-xs md:text-sm"
                          onClick={() => toggleCandidateSelection(candidate._id)}
                        >
                          <span className="hidden sm:inline">
                            {selectedCandidates.includes(candidate._id) ? 'Selected' : 'Select for Comparison'}
                          </span>
                          <span className="sm:hidden">
                            {selectedCandidates.includes(candidate._id) ? 'Selected' : 'Select'}
                          </span>
                        </Button>
                        <Button variant="outline" className="flex-1 text-xs md:text-sm">View Resume</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === 'approvals' && (
        <div className="space-y-4 md:space-y-6">
          {/* Header - Mobile Responsive */}
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Pending Approvals</h1>
            <p className="text-sm md:text-base text-gray-600">Review and approve hiring decisions</p>
          </div>

          {dashboardData.pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-8 md:p-12">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-gray-400" />
                  <p className="text-sm md:text-base">No pending approvals</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {dashboardData.pendingApprovals.map((approval) => (
                <Card key={approval._id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="text-xs">{approval.type}</Badge>
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">{approval.title}</h3>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600">
                          <span className="block sm:inline">Requested by {approval.requester}</span>
                          <span className="hidden sm:inline"> • </span>
                          <span className="block sm:inline">{formatDate(approval.date)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="outline" className="text-xs md:text-sm w-full sm:w-auto">
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">Details</span>
                        </Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 text-xs md:text-sm w-full sm:w-auto">
                          Reject
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-xs md:text-sm w-full sm:w-auto">
                          Approve
                        </Button>
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
    </DashboardLayout>
  );
}
