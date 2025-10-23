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
    
    setUpdating(true);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(interview.application._id, newStatus, feedback);
      }
      onClose();
    } catch (error) {
      console.error('Error updating interview status:', error);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Candidate Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidateName}`}
                  alt={candidateName}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {candidateName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{interview.candidate?.email || 'N/A'}</span>
                    </div>
                    {interview.candidate?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{interview.candidate.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Details */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-lg mb-4">Interview Information</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium">{interview.job?.title || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium">{interview.job?.department || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Interview Type:</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${interviewType.color}`}>
                    <TypeIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{interviewType.label}</span>
                  </div>
                </div>
                {interview.scheduledDate && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Date:</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(interview.scheduledDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time:</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {new Date(interview.scheduledDate).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={statusBadgeMap[interview.status] || 'secondary'}>
                    {interview.status?.charAt(0).toUpperCase() + interview.status?.slice(1) || 'Pending'}
                  </Badge>
                </div>
                {interview.rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${i < interview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
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
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold text-lg mb-4">AI Candidate Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {interview.application.aiScore.overallScore}%
                    </div>
                    <div className="text-xs text-gray-600">Overall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {interview.application.aiScore.skillsMatch}%
                    </div>
                    <div className="text-xs text-gray-600">Skills</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {interview.application.aiScore.experienceMatch}%
                    </div>
                    <div className="text-xs text-gray-600">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {interview.application.aiScore.qualificationMatch}%
                    </div>
                    <div className="text-xs text-gray-600">Qualification</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-lg mb-4">Interview Feedback</h4>
              <Textarea
                placeholder="Add interview feedback and notes..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[120px]"
                disabled={interview.status === 'completed'}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          {interview.status !== 'completed' && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={updating}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleStatusUpdate('rejected')}
                disabled={updating}
                className="text-red-600 hover:text-red-700"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                Reject
              </Button>
              <Button 
                onClick={() => handleStatusUpdate('interviewed')}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Mark Complete
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
