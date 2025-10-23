import { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const mockJobs = [
  {
    id: 1,
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120k - $160k',
    posted: '2 days ago',
    description: 'We are looking for an experienced Full Stack Developer to join our growing team.',
    requirements: ['5+ years React', 'Node.js', 'AWS'],
    saved: false
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'Full-time',
    salary: '$130k - $170k',
    posted: '1 week ago',
    description: 'Join our product team to shape the future of our platform.',
    requirements: ['3+ years PM experience', 'Agile', 'Data-driven'],
    saved: true
  },
  {
    id: 3,
    title: 'UX Designer',
    department: 'Design',
    location: 'New York, NY',
    type: 'Contract',
    salary: '$80k - $100k',
    posted: '3 days ago',
    description: 'Create beautiful and intuitive user experiences.',
    requirements: ['Figma', 'User Research', 'Prototyping'],
    saved: false
  },
];

const mockApplications = [
  { id: 1, position: 'Senior Developer', status: 'Interview Scheduled', date: '2024-01-15', company: 'TechCorp' },
  { id: 2, position: 'Product Manager', status: 'Under Review', date: '2024-01-10', company: 'StartupXYZ' },
  { id: 3, position: 'Team Lead', status: 'Application Submitted', date: '2024-01-05', company: 'BigTech Inc' },
];

const statusColors = {
  'Interview Scheduled': 'bg-purple-100 text-purple-800',
  'Under Review': 'bg-blue-100 text-blue-800',
  'Application Submitted': 'bg-gray-100 text-gray-800',
  'Offer Received': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
};

export default function EmployeeDashboard({ user }) {
  const [activeView, setActiveView] = useState('browse');
  const [savedJobs, setSavedJobs] = useState([2]);
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarItems = [
    { icon: <Search className="h-5 w-5" />, label: 'Browse Jobs', active: activeView === 'browse', onClick: () => setActiveView('browse') },
    { icon: <Bookmark className="h-5 w-5" />, label: 'Saved Jobs', active: activeView === 'saved', onClick: () => setActiveView('saved'), badge: savedJobs.length },
    { icon: <FileText className="h-5 w-5" />, label: 'My Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: 3 },
    { icon: <User className="h-5 w-5" />, label: 'Profile', active: activeView === 'profile', onClick: () => setActiveView('profile') },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', active: activeView === 'notifications', onClick: () => setActiveView('notifications'), badge: 2 },
  ];

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => 
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  return (
    <DashboardLayout user={user} sidebarItems={sidebarItems} theme="orange">
      {activeView === 'browse' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">Browse Jobs</h1>
            <p className="text-gray-600">Find your next opportunity</p>
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Job Listings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{job.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Badge variant="secondary">{job.department}</Badge>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSaveJob(job.id)}
                    >
                      <Bookmark 
                        className={`h-5 w-5 ${savedJobs.includes(job.id) ? 'fill-orange-600 text-orange-600' : ''}`}
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{job.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      Posted {job.posted}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, index) => (
                        <Badge key={index} variant="outline">{req}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                      Apply Now
                    </Button>
                    <Button variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeView === 'applications' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">Track your application progress</p>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Applications (3)</TabsTrigger>
              <TabsTrigger value="active">Active (2)</TabsTrigger>
              <TabsTrigger value="archived">Archived (1)</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 mt-6">
              {mockApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-900">{app.position}</h3>
                          <Badge className={statusColors[app.status]}>
                            {app.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {app.company} • Applied on {app.date}
                        </div>
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-green-600" />
                          </div>
                          <span className="text-sm">Applied</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${app.status !== 'Application Submitted' ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <div className={`w-3 h-3 rounded-full ${app.status !== 'Application Submitted' ? 'bg-blue-600' : 'bg-gray-400'}`} />
                          </div>
                          <span className="text-sm">Review</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${app.status === 'Interview Scheduled' ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <div className={`w-3 h-3 rounded-full ${app.status === 'Interview Scheduled' ? 'bg-purple-600' : 'bg-gray-400'}`} />
                          </div>
                          <span className="text-sm">Interview</span>
                        </div>
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                          </div>
                          <span className="text-sm">Offer</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {activeView === 'profile' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your profile and resume</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <Input defaultValue={user.name} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <Input defaultValue={user.email} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <Input placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Location</label>
                    <Input placeholder="City, State" />
                  </div>
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">Drop your resume here or</p>
                  <Button variant="outline" size="sm">Browse Files</Button>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC up to 10MB</p>
                </div>
                {/* Current Resume */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm">resume.pdf</p>
                        <p className="text-xs text-gray-500">Uploaded 2 days ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Delete</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
