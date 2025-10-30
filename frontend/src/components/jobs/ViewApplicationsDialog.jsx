import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import {
  Loader2,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Video
} from 'lucide-react';
import { Progress } from '../ui/progress';
import dashboardService from '../../services/dashboardService';
import applicationService from '../../services/applicationService';
import ApplicationDetailsDialog from '../applications/ApplicationDetailsDialog';
import { useAuth } from '../../hooks/useAuth';

export default function ViewApplicationsDialog({ isOpen, onClose, job, user: propUser }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && job?._id) {
      console.log('Fetching applications for job:', job._id);
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, job?._id]);

  useEffect(() => {
    filterApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, searchQuery, activeTab]);

  const fetchApplications = async () => {
    if (!job?._id) {
      console.error('No job ID available');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching applications for job ID:', job._id);
      const response = await dashboardService.getApplications({ job: job._id });
      
      if (response?.success && Array.isArray(response.data)) {
        console.log('Fetched applications:', response.data.length);
        setApplications(response.data);
      } else {
        console.warn('Invalid response format:', response);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (activeTab !== 'all') {
      const statusMap = {
        'new': ['submitted'],
        'review': ['under_review', 'shortlisted'],
        'interview': ['interview_scheduled', 'interviewed'],
        'offer': ['offer_extended'],
        'hired': ['accepted'],
        'rejected': ['rejected', 'withdrawn']
      };

      if (statusMap[activeTab]) {
        filtered = filtered.filter(app => statusMap[activeTab].includes(app.status));
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.applicant.firstName?.toLowerCase().includes(query) ||
        app.applicant.lastName?.toLowerCase().includes(query) ||
        app.applicant.email?.toLowerCase().includes(query)
      );
    }

    // Sort by AI score in descending order (highest score first)
    filtered = filtered.sort((a, b) => {
      const scoreA = a.aiScore?.overallScore || 0;
      const scoreB = b.aiScore?.overallScore || 0;
      return scoreB - scoreA; // Descending order
    });

    setFilteredApplications(filtered);
  };

  const handleApprove = async (application) => {
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

  const handleReject = async (application) => {
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

  const handleViewDetails = (applicationId) => {
    setSelectedApplicationId(applicationId);
    setIsDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedApplicationId(null);
  };

  const handleApplicationUpdate = async () => {
    await fetchApplications();
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      'submitted': 'default',
      'under_review': 'secondary',
      'shortlisted': 'secondary',
      'interview_scheduled': 'warning',
      'interviewed': 'warning',
      'offer_extended': 'warning',
      'accepted': 'success',
      'rejected': 'destructive',
      'withdrawn': 'secondary'
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'submitted': 'New Application',
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

  const counts = {
    all: applications.length,
    new: applications.filter(a => a.status === 'submitted').length,
    review: applications.filter(a => ['under_review', 'shortlisted'].includes(a.status)).length,
    interview: applications.filter(a => ['interview_scheduled', 'interviewed'].includes(a.status)).length,
    offer: applications.filter(a => a.status === 'offer_extended').length,
    hired: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => ['rejected', 'withdrawn'].includes(a.status)).length,
  };

  if (!job) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full overflow-x-hidden p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl">
              Applications for {job?.title || 'Job'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {job.department} • {applications.length} total applications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
            <div className="relative w-full max-w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm w-full"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full overflow-hidden">
              <TabsList className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 w-full h-auto gap-1">
                <TabsTrigger value="all" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  All ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="new" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  New ({counts.new})
                </TabsTrigger>
                <TabsTrigger value="review" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  Review ({counts.review})
                </TabsTrigger>
                <TabsTrigger value="interview" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  Interview ({counts.interview})
                </TabsTrigger>
                <TabsTrigger value="offer" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  Offer ({counts.offer})
                </TabsTrigger>
                <TabsTrigger value="hired" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  Hired ({counts.hired})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-[10px] sm:text-xs px-1 sm:px-3 min-w-0">
                  Rejected ({counts.rejected})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : filteredApplications.length > 0 ? (
                  <div className="space-y-4 w-full max-w-full overflow-hidden">
                    {filteredApplications.map((app) => {
                      const candidateName = `${app.applicant.firstName} ${app.applicant.lastName}`;
                      const score = app.aiScore?.overallScore || 0;
                      const appliedDate = new Date(app.createdAt).toLocaleDateString();

                      return (
                        <Card key={app._id} className="w-full max-w-full overflow-hidden">
                          <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
                            <div className="flex flex-col lg:flex-row items-start gap-4 w-full max-w-full overflow-hidden">
                              <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full min-w-0 max-w-full">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                                  alt={candidateName} 
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0" 
                                />
                                
                                <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 w-full">
                                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                                      {candidateName}
                                    </h3>
                                    <Badge variant={getStatusBadgeVariant(app.status)} className="w-fit text-xs shrink-0">
                                      {getStatusLabel(app.status)}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm text-gray-600 mb-3 w-full max-w-full">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                      <span className="truncate flex-1 min-w-0">{app.applicant.email}</span>
                                    </div>
                                    {app.applicant.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span>{app.applicant.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                      <span>Applied: {appliedDate}</span>
                                    </div>
                                    {app.resume && (
                                      <div className="flex items-center gap-2 min-w-0">
                                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span className="truncate flex-1 min-w-0">{app.resume.filename}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full max-w-full">
                                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">AI Match Score:</span>
                                    <div className="flex items-center gap-2 flex-1 w-full max-w-full sm:max-w-xs">
                                      <Progress value={score} className="flex-1 h-2" />
                                      <span className="font-semibold text-purple-600 text-sm sm:text-base whitespace-nowrap shrink-0">{score}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full lg:w-auto lg:ml-4 shrink-0">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  title="View Details" 
                                  className="flex-1 lg:flex-none"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDetails(app._id);
                                  }}
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 lg:hidden text-xs">View</span>
                                </Button>

                                {app.status !== 'accepted' && app.status !== 'rejected' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      title="Approve" 
                                      className="flex-1 lg:flex-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApprove(app);
                                      }}
                                      disabled={approvingId === app._id || rejectingId === app._id}
                                    >
                                      {approvingId === app._id ? (
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                      )}
                                      <span className="ml-1 lg:hidden text-xs">Approve</span>
                                    </Button>

                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      title="Reject" 
                                      className="flex-1 lg:flex-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject(app);
                                      }}
                                      disabled={approvingId === app._id || rejectingId === app._id}
                                    >
                                      {rejectingId === app._id ? (
                                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                                      )}
                                      <span className="ml-1 lg:hidden text-xs">Reject</span>
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
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm sm:text-base">No applications found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {selectedApplicationId && (
        <ApplicationDetailsDialog
          isOpen={isDetailsDialogOpen}
          onClose={handleCloseDetails}
          applicationId={selectedApplicationId}
          onStatusUpdate={handleApplicationUpdate}
          user={user}
        />
      )}
    </>
  );
}