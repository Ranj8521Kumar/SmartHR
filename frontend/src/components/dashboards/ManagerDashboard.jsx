import { useState } from 'react';
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
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

const mockRequisitions = [
  { id: 1, title: 'Senior Developer', status: 'approved', applicants: 12, interviews: 3 },
  { id: 2, title: 'Business Analyst', status: 'pending', applicants: 8, interviews: 0 },
  { id: 3, title: 'Team Lead', status: 'approved', applicants: 15, interviews: 5 },
];

const mockCandidates = [
  { 
    id: 1, 
    name: 'Alice Johnson', 
    position: 'Senior Developer',
    experience: '5 years',
    skills: ['React', 'Node.js', 'AWS'],
    score: 92,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
  },
  { 
    id: 2, 
    name: 'Bob Smith', 
    position: 'Senior Developer',
    experience: '7 years',
    skills: ['Angular', 'Python', 'Docker'],
    score: 88,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
  },
];

export default function ManagerDashboard({ user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Requisitions', active: activeView === 'requisitions', onClick: () => setActiveView('requisitions') },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: 35 },
    { icon: <Users className="h-5 w-5" />, label: 'Candidates', active: activeView === 'candidates', onClick: () => setActiveView('candidates') },
    { icon: <CheckCircle className="h-5 w-5" />, label: 'Approvals', active: activeView === 'approvals', onClick: () => setActiveView('approvals'), badge: 3 },
  ];

  const toggleCandidateSelection = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout user={user} sidebarItems={sidebarItems} theme="green">
      {activeView === 'dashboard' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">Manager Dashboard</h1>
            <p className="text-gray-600">Department hiring overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Open Positions"
              value="8"
              icon={<Briefcase className="h-6 w-6" />}
              color="green"
            />
            <StatsCard
              title="Applications"
              value="47"
              icon={<FileText className="h-6 w-6" />}
              color="blue"
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="Interviews Scheduled"
              value="12"
              icon={<Users className="h-6 w-6" />}
              color="purple"
            />
            <StatsCard
              title="Pending Approvals"
              value="3"
              icon={<Clock className="h-6 w-6" />}
              color="orange"
            />
          </div>

          {/* Active Requisitions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Job Requisitions</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Requisition
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRequisitions.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-gray-900">{req.title}</h3>
                        <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
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
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button size="sm">Review Candidates</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hiring Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Department Hiring Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { role: 'Senior Developer', current: 3, target: 5, progress: 60 },
                  { role: 'Business Analyst', current: 1, target: 2, progress: 50 },
                  { role: 'Team Lead', current: 0, target: 1, progress: 80 },
                ].map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span>{item.role}</span>
                      <span className="text-sm text-gray-600">{item.current}/{item.target} filled</span>
                    </div>
                    <Progress value={item.progress} />
                  </div>
                ))}
              </div>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockCandidates.map((candidate) => (
              <Card 
                key={candidate.id}
                className={selectedCandidates.includes(candidate.id) ? 'ring-2 ring-green-600' : ''}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={candidate.avatar} alt={candidate.name} className="w-16 h-16 rounded-full" />
                      <div>
                        <h3 className="text-gray-900 mb-1">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.position}</p>
                        <p className="text-sm text-gray-500">{candidate.experience} experience</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 mb-1">Match Score</div>
                      <div className="text-gray-900">{candidate.score}%</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Key Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Interview Rating</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Feedback</Label>
                      <Textarea placeholder="Add your interview feedback..." className="mt-1" />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant={selectedCandidates.includes(candidate.id) ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => toggleCandidateSelection(candidate.id)}
                      >
                        {selectedCandidates.includes(candidate.id) ? 'Selected' : 'Select for Comparison'}
                      </Button>
                      <Button variant="outline" className="flex-1">View Resume</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeView === 'approvals' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">Pending Approvals</h1>
            <p className="text-gray-600">Review and approve hiring decisions</p>
          </div>

          <div className="space-y-4">
            {[
              { type: 'Job Posting', title: 'Senior Developer', requester: 'HR Team', date: '2 days ago' },
              { type: 'Offer Letter', title: 'Alice Johnson - Senior Developer', requester: 'Sarah Johnson', date: '1 day ago' },
              { type: 'Budget Approval', title: 'New Team Lead Position', requester: 'Finance', date: '3 hours ago' },
            ].map((approval, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{approval.type}</Badge>
                        <h3 className="text-gray-900">{approval.title}</h3>
                      </div>
                      <div className="text-sm text-gray-600">
                        Requested by {approval.requester} • {approval.date}
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
        </div>
      )}
    </DashboardLayout>
  );
}
