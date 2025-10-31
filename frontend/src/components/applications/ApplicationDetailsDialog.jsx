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
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
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
  Clock,
  Video,
  Copy,
  ExternalLink,
  Gift
} from 'lucide-react';
import { Progress } from '../ui/progress';
import toast from 'react-hot-toast';
import applicationService from '../../services/applicationService';
import interviewService from '../../services/interviewService';

export default function ApplicationDetailsDialog({ isOpen, onClose, applicationId, onStatusUpdate, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [application, setApplication] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [aiInterviewDuration, setAiInterviewDuration] = useState(30);
  const [aiInterviewScheduledDate, setAiInterviewScheduledDate] = useState('');
  const [isSchedulingAI, setIsSchedulingAI] = useState(false);
  const [aiInterviewLink, setAiInterviewLink] = useState(null);

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
        
        // Extract AI interview link from the latest AI interview if available
        const aiInterviews = response.data.interviews?.filter(interview => 
          interview.type === 'ai_video' && interview.aiInterview?.uniqueLink
        );
        
        if (aiInterviews && aiInterviews.length > 0) {
          // Get the most recent AI interview link
          const latestAIInterview = aiInterviews[aiInterviews.length - 1];
          const baseUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
          const fullLink = latestAIInterview.aiInterview.uniqueLink.startsWith('http') 
            ? latestAIInterview.aiInterview.uniqueLink 
            : `${baseUrl}/ai-interview/${latestAIInterview.aiInterview.uniqueLink}`;
          setAiInterviewLink(fullLink);
        }
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

  const handleScheduleAIInterview = async () => {
    // Validate scheduled date
    if (!aiInterviewScheduledDate) {
      toast.error('Please select a date and time for the interview');
      return;
    }

    const scheduledDateTime = new Date(aiInterviewScheduledDate);
    const now = new Date();

    if (scheduledDateTime < now) {
      toast.error('Scheduled date must be in the future');
      return;
    }

    setIsSchedulingAI(true);
    setError(null);
    try {
      const response = await interviewService.scheduleAIInterview(applicationId, {
        duration: aiInterviewDuration,
        scheduledDate: aiInterviewScheduledDate,
        notes: notes || 'AI Video Interview scheduled'
      });

      if (response.success) {
        // Set the interview link from the response
        setAiInterviewLink(response.data.uniqueLink);
        setNotes('');
        
        // Fetch updated application data in the background to update local state only
        applicationService.getApplicationById(applicationId).then(updatedApp => {
          if (updatedApp.success) {
            setApplication(updatedApp.data);
            // Don't call onStatusUpdate here to avoid triggering parent dashboard reload
          }
        }).catch(err => {
          console.error('Error refreshing application data:', err);
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSchedulingAI(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Interview link copied!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy link');
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
            <div className="flex flex-col lg:flex-row items-start gap-4 lg:justify-between w-full max-w-full overflow-hidden pr-2">
              <div className="flex items-start gap-3 sm:gap-4 w-full lg:flex-1 min-w-0">
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
              {user?.role !== 'employee' && (
                <div className="w-full lg:w-auto lg:min-w-[180px] lg:text-right flex-shrink-0">
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">AI Match Score</div>
                  <div className="flex items-center gap-2 sm:gap-3 lg:justify-end">
                    <Progress
                      value={application.aiScore?.overallScore || 0}
                      className="flex-1 lg:w-24 h-2"
                    />
                    <span className="text-xl sm:text-2xl font-bold text-purple-600 whitespace-nowrap flex-shrink-0 min-w-[60px] text-right">
                      {application.aiScore?.overallScore || 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Tabs defaultValue="overview" className="w-full overflow-hidden">
              <TabsList className={`grid w-full ${user?.role === 'employee' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} h-auto gap-1`}>
                <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Overview</TabsTrigger>
                <TabsTrigger value="resume" className="text-xs sm:text-sm px-2 sm:px-3">Resume</TabsTrigger>
                {user?.role !== 'employee' && (
                  <TabsTrigger value="ai-analysis" className="text-xs sm:text-sm px-2 sm:px-3">AI Analysis</TabsTrigger>
                )}
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

                {/* AI Interview Link - Show for employees when interview is scheduled */}
                {!canUpdateStatus && application.status === 'interview_scheduled' && aiInterviewLink && (
                  <Card className="w-full max-w-full overflow-hidden border-2 border-purple-200">
                    <CardHeader className="px-4 sm:px-6 bg-gradient-to-r from-purple-50 to-purple-100">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Video className="h-5 w-5 text-purple-600" />
                        AI Video Interview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4 sm:px-6 pt-4">
                      <p className="text-sm text-gray-700">
                        You have been scheduled for an AI video interview. Click the link below to start your interview.
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <ExternalLink className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-purple-800">Interview Link</p>
                          <p className="text-xs text-purple-600 truncate">{aiInterviewLink}</p>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(aiInterviewLink)}
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => window.open(aiInterviewLink, '_blank')}
                          variant="default"
                          size="sm"
                          className="flex-shrink-0 text-xs bg-purple-600 hover:bg-purple-700"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-xs text-blue-800 font-medium mb-1">💡 Interview Tips:</p>
                        <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                          <li>Ensure you have a stable internet connection</li>
                          <li>Find a quiet environment with good lighting</li>
                          <li>Make sure your camera and microphone are working</li>
                          <li>Read the job description before starting</li>
                        </ul>
                      </div>
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
                            {application.resume.parsedData.skills && Array.isArray(application.resume.parsedData.skills) && application.resume.parsedData.skills.length > 0 && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Skills</h4>
                                <div className="flex flex-wrap gap-2 w-full">
                                  {application.resume.parsedData.skills.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs shrink-0">
                                      {typeof skill === 'string' ? skill : skill.name || 'N/A'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {application.resume.parsedData.experience && Array.isArray(application.resume.parsedData.experience) && application.resume.parsedData.experience.length > 0 && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Experience</h4>
                                <div className="space-y-3">
                                  {application.resume.parsedData.experience.map((exp, idx) => (
                                    <div key={idx} className="border-l-2 border-purple-200 pl-4">
                                      <h5 className="font-semibold text-sm sm:text-base">{exp.position || 'Position'}</h5>
                                      <p className="text-sm text-gray-600">{exp.company || 'Company'}</p>
                                      {(exp.startDate || exp.endDate) && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {exp.startDate || 'Start'} - {exp.current ? 'Present' : (exp.endDate || 'End')}
                                        </p>
                                      )}
                                      {exp.description && (
                                        <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                                      )}
                                      {exp.responsibilities && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                                        <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                                          {exp.responsibilities.map((resp, ridx) => (
                                            <li key={ridx}>{resp}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {application.resume.parsedData.education && Array.isArray(application.resume.parsedData.education) && application.resume.parsedData.education.length > 0 && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Education</h4>
                                <div className="space-y-3">
                                  {application.resume.parsedData.education.map((edu, idx) => (
                                    <div key={idx} className="border-l-2 border-blue-200 pl-4">
                                      <h5 className="font-semibold text-sm sm:text-base">{edu.degree || 'Degree'}</h5>
                                      <p className="text-sm text-gray-600">{edu.institution || 'Institution'}</p>
                                      {edu.field && <p className="text-sm text-gray-600">{edu.field}</p>}
                                      {(edu.startDate || edu.endDate) && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {edu.startDate || 'Start'} - {edu.endDate || 'End'}
                                        </p>
                                      )}
                                      {edu.gpa && <p className="text-sm text-gray-700 mt-1">GPA: {edu.gpa}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {application.resume.parsedData.summary && (
                              <div className="w-full max-w-full overflow-hidden">
                                <h4 className="font-semibold mb-2 text-sm sm:text-base">Summary</h4>
                                <p className="text-gray-700 text-sm sm:text-base break-words overflow-wrap-anywhere">
                                  {application.resume.parsedData.summary}
                                </p>
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
              {user?.role !== 'employee' && (
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
              )}

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="mt-4 sm:mt-6 w-full max-w-full overflow-hidden">
                <Card className="w-full max-w-full overflow-hidden">
                  <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="text-base sm:text-lg">Application Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-hidden px-4 sm:px-6">
                    <div className="space-y-4 w-full max-w-full overflow-hidden">
                      {/* Initial submission */}
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full"></div>
                          {(application.timeline && application.timeline.length > 0) && (
                            <div className="w-0.5 h-full bg-gray-300"></div>
                          )}
                        </div>
                        <div className="pb-8 flex-1">
                          <div className="font-semibold text-sm sm:text-base">Application Submitted</div>
                          <div className="text-xs sm:text-sm text-gray-500">
                            {new Date(application.createdAt).toLocaleString()}
                          </div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Submitted
                          </Badge>
                        </div>
                      </div>

                      {/* Timeline events from the timeline array */}
                      {application.timeline && application.timeline.length > 0 && application.timeline.map((event, index) => (
                        <div key={index} className="flex gap-3 sm:gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-600 rounded-full"></div>
                            {index < application.timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-300"></div>
                            )}
                          </div>
                          <div className={`flex-1 ${index < application.timeline.length - 1 ? 'pb-8' : ''}`}>
                            <div className="font-semibold text-sm sm:text-base">
                              Status Changed to {getStatusLabel(event.status)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">
                              {new Date(event.date).toLocaleString()}
                            </div>
                            {event.updatedBy && (
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                Updated by: {event.updatedBy.firstName} {event.updatedBy.lastName}
                              </div>
                            )}
                            <Badge variant={getStatusBadgeVariant(event.status)} className="mt-1 text-xs">
                              {getStatusLabel(event.status)}
                            </Badge>
                            {event.notes && (
                              <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <span className="font-medium">Note: </span>
                                {event.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Show a message if no timeline events exist */}
                      {(!application.timeline || application.timeline.length === 0) && (
                        <div className="text-center py-4 text-sm text-gray-500">
                          No status updates yet
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
                    
                    {/* Show Shortlist button only if not yet interview scheduled */}
                    {!['interview_scheduled', 'interviewed', 'offer_extended'].includes(application.status) && (
                      <Button
                        onClick={() => handleStatusUpdate('shortlisted')}
                        disabled={isUpdating || application.status === 'shortlisted'}
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Shortlist
                      </Button>
                    )}
                    
                    {/* Show Offer button when interview is scheduled or completed */}
                    {['interview_scheduled', 'interviewed'].includes(application.status) && (
                      <Button
                        onClick={() => handleStatusUpdate('offer_extended')}
                        disabled={isUpdating || application.status === 'offer_extended'}
                        variant="outline"
                        className="w-full sm:w-auto text-xs sm:text-sm bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Extend Offer
                      </Button>
                    )}
                    
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

                  {/* AI Interview Scheduling Section */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">AI Video Interview</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="scheduledDate" className="text-sm">Scheduled Date & Time:</Label>
                          <Input
                            id="scheduledDate"
                            type="datetime-local"
                            value={aiInterviewScheduledDate}
                            onChange={(e) => setAiInterviewScheduledDate(e.target.value)}
                            className="text-sm"
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="duration" className="text-sm">Duration (minutes):</Label>
                          <Select
                            value={aiInterviewDuration.toString()}
                            onValueChange={(value) => setAiInterviewDuration(parseInt(value))}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue placeholder="30" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="35">35</SelectItem>
                            <SelectItem value="40">40</SelectItem>
                            <SelectItem value="45">45</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="55">55</SelectItem>
                            <SelectItem value="60">60</SelectItem>
                            <SelectItem value="65">65</SelectItem>
                            <SelectItem value="70">70</SelectItem>
                            <SelectItem value="75">75</SelectItem>
                            <SelectItem value="80">80</SelectItem>
                            <SelectItem value="85">85</SelectItem>
                            <SelectItem value="90">90</SelectItem>
                            <SelectItem value="95">95</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="105">105</SelectItem>
                            <SelectItem value="110">110</SelectItem>
                            <SelectItem value="115">115</SelectItem>
                            <SelectItem value="120">120</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                      </div>
                      <Button
                        onClick={handleScheduleAIInterview}
                        disabled={isSchedulingAI}
                        variant="default"
                        className="w-full sm:w-auto text-xs sm:text-sm"
                      >
                        {isSchedulingAI ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        Schedule AI Interview
                      </Button>
                      {aiInterviewLink && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded">
                          <ExternalLink className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-800">Interview Link Generated</p>
                            <p className="text-xs text-green-600 truncate">{aiInterviewLink}</p>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(aiInterviewLink)}
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
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
