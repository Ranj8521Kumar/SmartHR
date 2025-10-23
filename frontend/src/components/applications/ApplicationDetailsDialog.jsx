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

export default function ApplicationDetailsDialog({ isOpen, onClose, applicationId, onStatusUpdate }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [application, setApplication] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
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
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${application.applicant?.firstName || 'user'}`} 
                  alt="Candidate" 
                  className="w-20 h-20 rounded-full" 
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {application.applicant?.firstName} {application.applicant?.lastName}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Applied for: <span className="font-semibold">{application.job?.title}</span>
                  </p>
                  <Badge variant={getStatusBadgeVariant(application.status)}>
                    {getStatusLabel(application.status)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 mb-2">AI Match Score</div>
                <div className="flex items-center gap-3">
                  <Progress 
                    value={application.aiScore?.overallScore || 0} 
                    className="w-32" 
                  />
                  <span className="text-2xl font-bold text-purple-600">
                    {application.aiScore?.overallScore || 0}%
                  </span>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resume">Resume</TabsTrigger>
                <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium">{application.applicant?.email}</div>
                        </div>
                      </div>
                      {application.applicant?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Phone</div>
                            <div className="font-medium">{application.applicant.phone}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Applied On</div>
                          <div className="font-medium">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Job Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Position</div>
                          <div className="font-medium">{application.job?.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Department</div>
                          <div className="font-medium">{application.job?.department}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-500">Location</div>
                          <div className="font-medium">{application.job?.location}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cover Letter / Notes */}
                {application.coverLetter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {application.coverLetter}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Resume Tab */}
              <TabsContent value="resume" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Resume</CardTitle>
                      {application.resume?.fileUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.resume.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {application.resume ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{application.resume.fileName}</span>
                        </div>
                        {application.resume.isParsed && application.resume.parsedData && (
                          <div className="space-y-3 mt-4">
                            {application.resume.parsedData.skills && (
                              <div>
                                <h4 className="font-semibold mb-2">Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                  {application.resume.parsedData.skills.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {application.resume.parsedData.experience && (
                              <div>
                                <h4 className="font-semibold mb-2">Experience</h4>
                                <p className="text-gray-700">{application.resume.parsedData.experience}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No resume uploaded</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* AI Analysis Tab */}
              <TabsContent value="ai-analysis" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Matching Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {application.aiScore ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Skills Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.skillsMatch || 0} />
                              <span className="font-semibold">{application.aiScore.skillsMatch || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Experience Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.experienceMatch || 0} />
                              <span className="font-semibold">{application.aiScore.experienceMatch || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-2">Qualification Match</div>
                            <div className="flex items-center gap-2">
                              <Progress value={application.aiScore.qualificationMatch || 0} />
                              <span className="font-semibold">{application.aiScore.qualificationMatch || 0}%</span>
                            </div>
                          </div>
                        </div>
                        {application.aiScore.analysis && (
                          <div>
                            <h4 className="font-semibold mb-2">Detailed Analysis</h4>
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {application.aiScore.analysis}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">No AI analysis available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          <div className="w-0.5 h-full bg-gray-300"></div>
                        </div>
                        <div className="pb-8">
                          <div className="font-semibold">Application Submitted</div>
                          <div className="text-sm text-gray-500">
                            {new Date(application.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {application.updatedAt !== application.createdAt && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          </div>
                          <div>
                            <div className="font-semibold">Status Updated</div>
                            <div className="text-sm text-gray-500">
                              {new Date(application.updatedAt).toLocaleString()}
                            </div>
                            <Badge variant={getStatusBadgeVariant(application.status)} className="mt-1">
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

            {/* Status Update Section */}
            {application.status !== 'accepted' && application.status !== 'rejected' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Application Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this status change..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusUpdate('under_review')}
                      disabled={isUpdating || application.status === 'under_review'}
                      variant="outline"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Move to Review
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('shortlisted')}
                      disabled={isUpdating || application.status === 'shortlisted'}
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Shortlist
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isUpdating}
                      variant="destructive"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
