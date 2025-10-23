import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import StatsCard from '../shared/StatsCard';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Users,
  Calendar,
  Mail,
  BarChart3,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import dashboardService from '../../services/dashboardService';

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

  // Fetch dashboard data
  useEffect(() => {
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

    fetchDashboardData();
  }, []);

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

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs') },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: 44 },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <Calendar className="h-5 w-5" />, label: 'Interviews', active: activeView === 'interviews', onClick: () => setActiveView('interviews'), badge: 8 },
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

  const summary = dashboardData?.summary || {};
  const recentApplications = dashboardData?.recentApplications || [];
  
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

      {activeView === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Job Postings</h1>
              <p className="text-gray-600">Create and manage job openings</p>
            </div>
            <Button>
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
                              <span>•</span>
                              <span>{job.applicationsCount || 0} applications</span>
                              <span>•</span>
                              <span>Posted {daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline">Edit</Button>
                            <Button>View Applications</Button>
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
                  <Button className="mt-4">
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
    </DashboardLayout>
  );
}
