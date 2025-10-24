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
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import JobDetailsDialog from '../jobs/JobDetailsDialog';
import ApplyJobDialog from '../jobs/ApplyJobDialog';
import ApplicationDetailsDialog from '../applications/ApplicationDetailsDialog';

const statusColors = {
  'Interview Scheduled': 'bg-purple-100 text-purple-800',
  'Under Review': 'bg-blue-100 text-blue-800',
  'Application Submitted': 'bg-gray-100 text-gray-800',
  'Offer Received': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'pending': 'bg-gray-100 text-gray-800',
  'reviewed': 'bg-blue-100 text-blue-800',
  'shortlisted': 'bg-purple-100 text-purple-800',
  'interview_scheduled': 'bg-purple-100 text-purple-800',
  'offered': 'bg-green-100 text-green-800',
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

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      setJobsError(null);
      try {
        const params = {
          status: 'open',
        };
        
        if (searchQuery) params.search = searchQuery;
        if (departmentFilter !== 'all') params.department = departmentFilter;
        if (typeFilter !== 'all') params.employmentType = typeFilter;
        
        const response = await jobService.getJobs(params);
        setJobs(response.data || []);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobsError(error.message || 'Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };

    if (activeView === 'browse' || activeView === 'saved') {
      fetchJobs();
    }
  }, [activeView, searchQuery, departmentFilter, typeFilter]);

  // Fetch applications from API
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

    if (activeView === 'applications') {
      fetchApplications();
    }
  }, [activeView]);

  const sidebarItems = [
    { icon: <Search className="h-5 w-5" />, label: 'Browse Jobs', active: activeView === 'browse', onClick: () => setActiveView('browse') },
    { icon: <Bookmark className="h-5 w-5" />, label: 'Saved Jobs', active: activeView === 'saved', onClick: () => setActiveView('saved'), badge: savedJobs.length },
    { icon: <FileText className="h-5 w-5" />, label: 'My Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: applications.length },
    { icon: <User className="h-5 w-5" />, label: 'Profile', active: activeView === 'profile', onClick: () => setActiveView('profile') },
    { icon: <Bell className="h-5 w-5" />, label: 'Notifications', active: activeView === 'notifications', onClick: () => setActiveView('notifications'), badge: 2 },
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

  // Filter jobs for saved view
  const displayJobs = activeView === 'saved' 
    ? jobs.filter(job => savedJobs.includes(job._id))
    : jobs;

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
          {!loadingJobs && !jobsError && displayJobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">
                  {activeView === 'saved' 
                    ? 'You haven\'t saved any jobs yet. Browse available positions and save your favorites!'
                    : 'No jobs match your current filters. Try adjusting your search criteria.'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Job Listings */}
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
                      <Button 
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={() => handleApplyJob(job)}
                      >
                        Apply Now
                      </Button>
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
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">Track your application progress</p>
          </div>

          {/* Loading State */}
          {loadingApplications && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading applications...</span>
            </div>
          )}

          {/* Error State */}
          {applicationsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-800">Error: {applicationsError}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!loadingApplications && !applicationsError && applications.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't applied to any jobs yet. Start browsing and apply to positions that interest you!
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

          {/* Applications List */}
          {!loadingApplications && !applicationsError && applications.length > 0 && (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Applications ({applications.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Active ({applications.filter(app => !['rejected', 'withdrawn'].includes(app.status)).length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived ({applications.filter(app => ['rejected', 'withdrawn'].includes(app.status)).length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="space-y-4 mt-6">
                {applications.map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-gray-900">{app.job?.title || 'Position'}</h3>
                            <Badge className={statusColors[app.status] || statusColors['pending']}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
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
                        >
                          View Details
                        </Button>
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
                            <div className={`w-8 h-8 rounded-full ${['reviewed', 'shortlisted', 'interview_scheduled', 'offered'].includes(app.status) ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-3 h-3 rounded-full ${['reviewed', 'shortlisted', 'interview_scheduled', 'offered'].includes(app.status) ? 'bg-blue-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-sm">Review</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-300" />
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${['interview_scheduled', 'offered'].includes(app.status) ? 'bg-purple-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-3 h-3 rounded-full ${['interview_scheduled', 'offered'].includes(app.status) ? 'bg-purple-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-sm">Interview</span>
                          </div>
                          <div className="flex-1 h-px bg-gray-300" />
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${app.status === 'offered' ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center`}>
                              <div className={`w-3 h-3 rounded-full ${app.status === 'offered' ? 'bg-green-600' : 'bg-gray-400'}`} />
                            </div>
                            <span className="text-sm">Offer</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="active" className="space-y-4 mt-6">
                {applications.filter(app => !['rejected', 'withdrawn'].includes(app.status)).map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-gray-900">{app.job?.title || 'Position'}</h3>
                            <Badge className={statusColors[app.status] || statusColors['pending']}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
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
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="archived" className="space-y-4 mt-6">
                {applications.filter(app => ['rejected', 'withdrawn'].includes(app.status)).map((app) => (
                  <Card key={app._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-gray-900">{app.job?.title || 'Position'}</h3>
                            <Badge className={statusColors[app.status] || statusColors['pending']}>
                              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
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
      />

      <ApplicationDetailsDialog
        isOpen={isApplicationDetailsOpen}
        onClose={() => setIsApplicationDetailsOpen(false)}
        applicationId={selectedApplication?._id}
      />
    </DashboardLayout>
  );
}
