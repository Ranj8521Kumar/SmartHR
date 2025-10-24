import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Loader2, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  GraduationCap,
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Progress } from '../ui/progress';
import applicationService from '../../services/applicationService';

export default function ApplicationDetailsDialog({ isOpen, onClose, applicationId, onStatusUpdate, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [application, setApplication] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  // Check if user has permission to update status
  const canUpdateStatus = user && ['hr_recruiter', 'manager', 'admin'].includes(user.role);

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchApplicationDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, applicationId]);

  const fetchApplicationDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await applicationService.getApplicationById(applicationId);
      if (response.success) {
        setApplication(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await applicationService.updateApplicationStatus(
        applicationId,
        newStatus,
        notes
      );
      
      if (response.success) {
        setApplication(response.data);
        setNotes('');
        if (onStatusUpdate) {
          onStatusUpdate(response.data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
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
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interviewed': 'Interviewed',
      'offer_extended': 'Offer Extended',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };
    return labels[status] || status;
  };

  if (!application && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Application Details</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Review candidate information and application status
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : application ? (
          <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:justify-between w-full max-w-full overflow-hidden">
              <div className="flex items-start gap-3 sm:gap-4 w-full lg:w-auto">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${application.applicant?.firstName || 'user'}`} 
                  alt="Candidate" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                    {application.applicant?.firstName} {application.applicant?.lastName}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-2 truncate">
                    Applied for: <span className="font-semibold">{application.job?.title}</span>
                  </p>
                  <Badge variant={getStatusBadgeVariant(application.status)} className="text-xs">
                    {getStatusLabel(application.status)}
                  </Badge>
                </div>
              </div>
              <div className="w-full lg:w-auto lg:text-right">
                <div className="text-xs sm:text-sm text-gray-600 mb-2">AI Match Score</div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Progress 
                    value={application.aiScore?.overallScore || 0} 
                    className="flex-1 sm:flex-none sm:w-32 h-2" 
                  />
                  <span className="text-xl sm:text-2xl font-bold text-purple-600 whitespace-nowrap">
                    {application.aiScore?.overallScore || 0}%
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Overview</TabsTrigger>
                <TabsTrigger value="resume" className="text-xs sm:text-sm px-2 sm:px-3">Resume</TabsTrigger>
                <TabsTrigger value="ai-analysis" className="text-xs sm:text-sm px-2 sm:px-3">AI Analysis</TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs sm:text-sm px-2 sm:px-3">Timeline</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6 w-full max-w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
                  {/* Contact Information */}
                  <Card className="w-full max-w-full overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 overflow-hidden px-4 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm text-gray-500">Email</div>
                          <div className="font-medium text-sm sm:text-base truncate">{application.applicant?.email}</div>
                        </div>
                      </div>
                      {application.applicant?.phone && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm text-gray-500">Phone</div>
                            <div className="font-medium text-sm sm:text-base">{application.applicant.phone}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm text-gray-500">Applied On</div>
                          <div className="font-medium text-sm sm:text-base">
                            {new Date(application.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Details */}
                  <Card className="w-full max-w-full overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 overflow-hidden px-4 sm:px-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm text-gray-500">Position</div>
                          <div className="font-medium text-sm sm:text-base truncate">{application.job?.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm text-gray-500">Department</div>
                          <div className="font-medium text-sm sm:text-base">{application.job?.department}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm text-gray-500">Location</div>
                          <div className="font-medium text-sm sm:text-base">{application.job?.location}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cover Letter / Notes */}
                {application.coverLetter && (
                  <Card className="w-full max-w-full overflow-hidden">
                    <CardHeader className="px-4 sm:px-6">
                      <CardTitle className="text-base sm:text-lg">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-hidden px-4 sm:px-6">
                      <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base break-words overflow-wrap-anywhere">
                        {application.coverLetter}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Resume Tab */}
              <TabsContent value="resume" className="mt-4 sm:mt-6 w-full max-w-full overflow-hidden">
                <Card className="w-full max-w-full overflow-hidden">
                  <CardHeader className="w-full max-w-full overflow-hidden px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
                      <CardTitle className="text-base sm:text-lg">Resume</CardTitle>
                      {application.resume?.fileUrl && (
                        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto shrink-0">
                          <a href={application.resume.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="w-full max-w-full overflow-hidden px-4 sm:px-6">
                    {application.resume ? (
                      <div className="space-y-4 w-full max-w-full overflow-hidden">
                        <div className="flex items-center gap-2 w-full max-w-full min-w-0">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base truncate flex-1 min-w-0 max-w-full">{application.resume.fileName}</span>
                        </div>
                        {application.resume.isParsed && application.resume.parsedData && (
                          <div className="space-y-3 mt-4 w-full max-w-full overflow-hidden">
                            {application.resume.parsedData.skills && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Skills</h4>
                                <div className="flex flex-wrap gap-2 w-full">
                                  {application.resume.parsedData.skills.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs shrink-0">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {application.resume.parsedData.experience && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Experience</h4>
                                <p className="text-gray-700 text-sm sm:text-base break-words overflow-wrap-anywhere">{application.resume.parsedData.experience}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm sm:text-base">No resume uploaded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Analysis Tab */}
              <TabsContent value="ai-analysis" className="mt-4 sm:mt-6 w-full max-w-full overflow-hidden">
                <Card className="w-full max-w-full overflow-hidden">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">AI Matching Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 overflow-hidden px-4 sm:px-6">
                    {application.aiScore ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-full">
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm text-gray-500 mb-2">Skills Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.skillsMatch || 0} className="h-2 flex-1" />
                              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">{application.aiScore.skillsMatch || 0}%</span>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm text-gray-500 mb-2">Experience Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.experienceMatch || 0} className="h-2 flex-1" />
                              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">{application.aiScore.experienceMatch || 0}%</span>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm text-gray-500 mb-2">Qualification Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.qualificationMatch || 0} className="h-2 flex-1" />
                              <span className="font-semibold text-sm sm:text-base whitespace-nowrap">{application.aiScore.qualificationMatch || 0}%</span>
                            </div>
                          </div>
                        </div>
                        {application.aiScore.analysis && (
                          <div className="w-full max-w-full overflow-hidden">
                            <h4 className="font-semibold mb-2 text-sm sm:text-base">Detailed Analysis</h4>
                            <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base break-words overflow-wrap-anywhere">
                              {application.aiScore.analysis}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm sm:text-base">No AI analysis available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4 sm:mt-6 w-full max-w-full overflow-hidden">
                <Card className="w-full max-w-full overflow-hidden">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Application Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden px-4 sm:px-6">
                    <div className="space-y-4 w-full max-w-full overflow-hidden">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full"></div>
                          <div className="w-0.5 h-full bg-gray-300"></div>
                        </div>
                        <div className="pb-8 flex-1">
                          <div className="font-semibold text-sm sm:text-base">Application Submitted</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {new Date(application.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {application.updatedAt !== application.createdAt && (
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm sm:text-base">Status Updated</div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {new Date(application.updatedAt).toLocaleString()}
                            </div>
                            <Badge variant={getStatusBadgeVariant(application.status)} className="mt-1 text-xs">
                              {getStatusLabel(application.status)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Status Update Section - Only for HR, Managers, and Admins */}
            {canUpdateStatus && application.status !== 'accepted' && application.status !== 'rejected' && (
              <Card className="w-full max-w-full overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Update Application Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-hidden px-4 sm:px-6">
                  <div>
                    <Label htmlFor="notes" className="text-sm sm:text-base">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this status change..."
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleStatusUpdate('under_review')}
                      disabled={isUpdating || application.status === 'under_review'}
                      variant="outline"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Move to Review
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('shortlisted')}
                      disabled={isUpdating || application.status === 'shortlisted'}
                      variant="outline"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Shortlist
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                      variant="destructive"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
