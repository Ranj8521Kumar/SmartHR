import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  FileText
} from 'lucide-react';
import { Progress } from '../ui/progress';
import dashboardService from '../../services/dashboardService';

export default function ViewApplicationsDialog({ isOpen, onClose, job }) {
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen && job) {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, job]);

  useEffect(() => {
    filterApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications, searchQuery, activeTab]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      // Fetch applications for this specific job
      const response = await dashboardService.getApplications({ job: job._id });
      
      if (response.success && response.data) {
        setApplications(response.data);
      } else {
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

    // Filter by status
    if (activeTab !== 'all') {
      const statusMap = {
        'new': ['submitted'],
        'review': ['under_review', 'shortlisted'],
        'interview': ['interview_scheduled', 'interviewed'],
        'offer': ['offer_extended'],
        'hired': ['accepted'],
        'rejected': ['rejected', 'withdrawn']
      };
      filtered = filtered.filter(app => statusMap[activeTab]?.includes(app.status));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.applicant.firstName.toLowerCase().includes(query) ||
        app.applicant.lastName.toLowerCase().includes(query) ||
        app.applicant.email.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

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

  const getStatusCounts = () => {
    return {
      all: applications.length,
      new: applications.filter(a => a.status === 'submitted').length,
      review: applications.filter(a => ['under_review', 'shortlisted'].includes(a.status)).length,
      interview: applications.filter(a => ['interview_scheduled', 'interviewed'].includes(a.status)).length,
      offer: applications.filter(a => a.status === 'offer_extended').length,
      hired: applications.filter(a => a.status === 'accepted').length,
      rejected: applications.filter(a => ['rejected', 'withdrawn'].includes(a.status)).length,
    };
  };

  const counts = getStatusCounts();

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applications for {job.title}</DialogTitle>
          <DialogDescription>
            {job.department} • {applications.length} total applications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="new">New ({counts.new})</TabsTrigger>
              <TabsTrigger value="review">Review ({counts.review})</TabsTrigger>
              <TabsTrigger value="interview">Interview ({counts.interview})</TabsTrigger>
              <TabsTrigger value="offer">Offer ({counts.offer})</TabsTrigger>
              <TabsTrigger value="hired">Hired ({counts.hired})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              ) : filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map((app) => {
                    const candidateName = `${app.applicant.firstName} ${app.applicant.lastName}`;
                    const score = app.aiScore?.overallScore || 0;
                    const appliedDate = new Date(app.createdAt).toLocaleDateString();

                    return (
                      <Card key={app._id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Avatar */}
                              <img 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`} 
                                alt={candidateName} 
                                className="w-16 h-16 rounded-full" 
                              />
                              
                              {/* Details */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {candidateName}
                                  </h3>
                                  <Badge variant={getStatusBadgeVariant(app.status)}>
                                    {getStatusLabel(app.status)}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{app.applicant.email}</span>
                                  </div>
                                  {app.applicant.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      <span>{app.applicant.phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Applied: {appliedDate}</span>
                                  </div>
                                  {app.resume && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span>{app.resume.filename}</span>
                                    </div>
                                  )}
                                </div>

                                {/* AI Score */}
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">AI Match Score:</span>
                                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                                    <Progress value={score} className="flex-1" />
                                    <span className="font-semibold text-purple-600">{score}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 ml-4">
                              <Button size="sm" variant="outline" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {app.status !== 'accepted' && app.status !== 'rejected' && (
                                <>
                                  <Button size="sm" variant="outline" title="Approve">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button size="sm" variant="outline" title="Reject">
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
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No applications found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
