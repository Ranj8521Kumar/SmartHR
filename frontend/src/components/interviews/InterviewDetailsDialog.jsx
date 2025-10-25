import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar,
  Clock,
  Video,
  Users as UsersIcon,
  Star,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export default function InterviewDetailsDialog({ isOpen, onClose, interview, onStatusUpdate }) {
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (interview) {
      setFeedback(interview.feedback || '');
    }
  }, [interview]);

  const handleStatusUpdate = async (newStatus) => {
    if (!interview) return;
    
    // Validate application ID exists
    if (!interview.application?._id) {
      console.error('No application ID found in interview:', interview);
      alert('Error: Cannot update interview status - application ID not found');
      return;
    }
    
    setUpdating(true);
    try {
      if (onStatusUpdate) {
        // Map interview actions to application statuses
        let applicationStatus = newStatus;
        if (newStatus === 'completed') {
          applicationStatus = 'interviewed'; // Mark application as interviewed
        } else if (newStatus === 'rejected') {
          applicationStatus = 'rejected'; // Reject the application
        }
        
        console.log('Updating application:', interview.application._id, 'to status:', applicationStatus);
        await onStatusUpdate(interview.application._id, applicationStatus, feedback);
      }
      onClose();
    } catch (error) {
      console.error('Error updating interview status:', error);
      alert(`Failed to update interview status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (!interview) return null;

  const candidateName = interview.candidate 
    ? `${interview.candidate.firstName} ${interview.candidate.lastName}` 
    : 'Unknown Candidate';

  const interviewTypeMap = {
    'phone': { label: 'Phone', icon: Phone, color: 'bg-blue-100 text-blue-600' },
    'video': { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-600' },
    'in-person': { label: 'In-Person', icon: UsersIcon, color: 'bg-green-100 text-green-600' },
    'technical': { label: 'Technical', icon: Briefcase, color: 'bg-orange-100 text-orange-600' },
    'hr': { label: 'HR Round', icon: User, color: 'bg-pink-100 text-pink-600' },
  };

  const interviewType = interviewTypeMap[interview.type] || { 
    label: 'Not Set', 
    icon: Calendar, 
    color: 'bg-gray-100 text-gray-600' 
  };
  const TypeIcon = interviewType.icon;

  const statusBadgeMap = {
    'scheduled': 'default',
    'pending': 'secondary',
    'completed': 'default',
    'cancelled': 'destructive',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Interview Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
          {/* Candidate Info */}
          <Card className="w-full max-w-full overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`}
                  alt={candidateName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto sm:mx-0 shrink-0"
                />
                <div className="flex-1 w-full min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2 text-center sm:text-left break-words">
                    {candidateName}
                  </h3>
                  <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                      <span className="break-all">{interview.candidate?.email || 'N/A'}</span>
                    </div>
                    {interview.candidate?.phone && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span>{interview.candidate.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Details */}
          <Card className="w-full max-w-full overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Interview Information</h4>
              <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 shrink-0">Position:</span>
                  <span className="font-medium text-sm sm:text-base break-words text-right min-w-0">{interview.job?.title || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 shrink-0">Department:</span>
                  <span className="font-medium text-sm sm:text-base break-words text-right min-w-0">{interview.job?.department || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 shrink-0">Interview Type:</span>
                  <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${interviewType.color} shrink-0`}>
                    <TypeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">{interviewType.label}</span>
                  </div>
                </div>
                {interview.scheduledDate && (
                  <>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs sm:text-sm text-gray-600 shrink-0">Date:</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="font-medium text-sm sm:text-base">
                          {new Date(interview.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-xs sm:text-sm text-gray-600 shrink-0">Time:</span>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="font-medium text-sm sm:text-base">
                          {new Date(interview.scheduledDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs sm:text-sm text-gray-600 shrink-0">Status:</span>
                  <Badge variant={statusBadgeMap[interview.status] || 'secondary'} className="shrink-0 text-xs">
                    {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Pending'}
                  </Badge>
                </div>
                {interview.rating && (
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs sm:text-sm text-gray-600 shrink-0">Rating:</span>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${i < interview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Score */}
          {interview.application?.aiScore && (
            <Card className="w-full max-w-full overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">AI Candidate Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-600">
                      {interview.application.aiScore.overallScore}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Overall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {interview.application.aiScore.skillsMatch}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {interview.application.aiScore.experienceMatch}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">
                      {interview.application.aiScore.qualificationMatch}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1">Qualification</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card className="w-full max-w-full overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Interview Feedback</h4>
              <Textarea
                placeholder="Add interview feedback and notes..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
                disabled={interview.status === 'completed'}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          {interview.status !== 'completed' && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={updating} className="w-full sm:w-auto text-sm">
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating}
                className="text-red-600 hover:text-red-700 w-full sm:w-auto text-sm"
              >
                {updating ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" /> : <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />}
                Reject
              </Button>
              <Button 
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="w-full sm:w-auto text-sm"
              >
                {updating ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" /> : <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />}
                Mark Complete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
