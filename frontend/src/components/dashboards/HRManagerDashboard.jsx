import { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

const mockApplications = [
  { 
    id: 1, 
    candidate: 'Alex Thompson', 
    position: 'Senior Developer', 
    stage: 'Interview', 
    score: 92,
    applied: '2 days ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  { 
    id: 2, 
    candidate: 'Maria Garcia', 
    position: 'Product Manager', 
    stage: 'Screening', 
    score: 88,
    applied: '1 day ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
  },
  { 
    id: 3, 
    candidate: 'David Kim', 
    position: 'UX Designer', 
    stage: 'Offer', 
    score: 95,
    applied: '5 days ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
  },
];

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

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs') },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: 44 },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <Calendar className="h-5 w-5" />, label: 'Interviews', active: activeView === 'interviews', onClick: () => setActiveView('interviews'), badge: 8 },
    { icon: <Mail className="h-5 w-5" />, label: 'Communications', active: activeView === 'communications', onClick: () => setActiveView('communications') },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
  ];

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
              value="32"
              icon={<Briefcase className="h-6 w-6" />}
              color="purple"
              trend={{ value: 6, isPositive: true }}
            />
            <StatsCard
              title="Active Applications"
              value="156"
              icon={<FileText className="h-6 w-6" />}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Interviews This Week"
              value="24"
              icon={<Calendar className="h-6 w-6" />}
              color="orange"
            />
            <StatsCard
              title="Avg. Time to Hire"
              value="18 days"
              icon={<Clock className="h-6 w-6" />}
              color="green"
              trend={{ value: 3, isPositive: false }}
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
                {kanbanStages.map((stage, index) => (
                  <div key={index} className={`${stage.color} p-4 rounded-lg`}>
                    <div className="flex items-center justify-between mb-3">
                      <span>{stage.name}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stage.applications.map((app) => (
                        <div key={app.id} className="bg-white p-3 rounded shadow-sm">
                          <p className="text-sm mb-1">{app.name}</p>
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Candidates */}
          <Card>
            <CardHeader>
              <CardTitle>Top Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <img src={app.avatar} alt={app.candidate} className="w-12 h-12 rounded-full" />
                      <div>
                        <p>{app.candidate}</p>
                        <p className="text-sm text-gray-500">{app.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className="mb-1">{app.stage}</Badge>
                        <p className="text-xs text-gray-500">{app.applied}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-600 mb-1">{app.score}</div>
                        <Progress value={app.score} className="w-20" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
              <TabsTrigger value="active">Active (32)</TabsTrigger>
              <TabsTrigger value="draft">Drafts (5)</TabsTrigger>
              <TabsTrigger value="closed">Closed (48)</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4 mt-6">
              {[
                { title: 'Senior Full Stack Developer', dept: 'Engineering', apps: 45, days: 12 },
                { title: 'Product Manager', dept: 'Product', apps: 38, days: 8 },
                { title: 'UX/UI Designer', dept: 'Design', apps: 52, days: 15 },
              ].map((job, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{job.dept}</span>
                          <span>•</span>
                          <span>{job.apps} applications</span>
                          <span>•</span>
                          <span>Posted {job.days} days ago</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline">Edit</Button>
                        <Button>View Applications</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardLayout>
  );
}
