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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Manager Dashboard</h1>
              <p className="text-gray-600">
                Department hiring overview - {user.department || 'All Departments'}
                {lastUpdated && (
                  <span className="ml-3 text-sm text-gray-500">
                    • Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Open Positions"
              value={dashboardData.stats.openPositions.toString()}
              icon={<Briefcase className="h-6 w-6" />}
              color="green"
            />
            <StatsCard
              title="Applications"
              value={dashboardData.stats.totalApplications.toString()}
              icon={<FileText className="h-6 w-6" />}
              color="blue"
              trend={{ 
                value: Math.abs(dashboardData.stats.applicationTrend), 
                isPositive: dashboardData.stats.applicationTrend >= 0 
              }}
            />
            <StatsCard
              title="Interviews Scheduled"
              value={dashboardData.stats.interviewsScheduled.toString()}
              icon={<Users className="h-6 w-6" />}
              color="purple"
            />
            <StatsCard
              title="Pending Approvals"
              value={dashboardData.stats.pendingApprovals.toString()}
              icon={<Clock className="h-6 w-6" />}
              color="orange"
            />
          </div>

          {/* Active Requisitions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Job Requisitions</CardTitle>
                <Button onClick={handleNewRequisition}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Requisition
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData.activeRequisitions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active requisitions found
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.activeRequisitions.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-gray-900">{req.title}</h3>
                          <Badge variant={req.status === 'open' ? 'default' : 'secondary'}>
                            {req.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{req.applicants} applicants</span>
                          <span>•</span>
                          <span>{req.interviews} interviews</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewJobDetails(req)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleReviewCandidates(req)}
                        >
                          Review Candidates
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hiring Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Department Hiring Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.hiringProgress.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hiring progress data available
                </div>
              ) : (
                <div className="space-y-6">
                  {dashboardData.hiringProgress.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span>{item.role}</span>
                        <span className="text-sm text-gray-600">{item.current}/{item.target} filled</span>
                      </div>
                      <Progress value={item.progress} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'candidates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Candidate Comparison</h1>
              <p className="text-gray-600">Compare and review shortlisted candidates</p>
            </div>
            {selectedCandidates.length > 0 && (
              <Button>
                Compare Selected ({selectedCandidates.length})
              </Button>
            )}
          </div>

          {dashboardData.topCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No candidates available for review</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardData.topCandidates.map((candidate) => (
                <Card 
                  key={candidate._id}
                  className={selectedCandidates.includes(candidate._id) ? 'ring-2 ring-green-600' : ''}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.name}`} 
                          alt={candidate.name} 
                          className="w-16 h-16 rounded-full" 
                        />
                        <div>
                          <h3 className="text-gray-900 mb-1">{candidate.name}</h3>
                          <p className="text-sm text-gray-600">{candidate.position}</p>
                          <p className="text-sm text-gray-500">{candidate.experience} experience</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 mb-1">Match Score</div>
                        <div className="text-gray-900">{Math.round(candidate.score)}%</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Key Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                        {candidate.skills.length > 5 && (
                          <Badge variant="outline">+{candidate.skills.length - 5} more</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Interview Status</Label>
                        <div className="mt-1">
                          <Badge variant={candidate.status === 'interviewed' ? 'default' : 'secondary'}>
                            {candidate.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label>Feedback</Label>
                        <Textarea placeholder="Add your interview feedback..." className="mt-1" />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant={selectedCandidates.includes(candidate._id) ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => toggleCandidateSelection(candidate._id)}
                        >
                          {selectedCandidates.includes(candidate._id) ? 'Selected' : 'Select for Comparison'}
                        </Button>
                        <Button variant="outline" className="flex-1">View Resume</Button>
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
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">Pending Approvals</h1>
            <p className="text-gray-600">Review and approve hiring decisions</p>
          </div>

          {dashboardData.pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No pending approvals</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dashboardData.pendingApprovals.map((approval) => (
                <Card key={approval._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{approval.type}</Badge>
                          <h3 className="text-gray-900">{approval.title}</h3>
                        </div>
                        <div className="text-sm text-gray-600">
                          Requested by {approval.requester} • {formatDate(approval.date)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">View Details</Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700">Reject</Button>
                        <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
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
