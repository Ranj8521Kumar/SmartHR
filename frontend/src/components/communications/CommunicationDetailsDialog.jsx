import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Mail, 
  Calendar, 
  Briefcase, 
  User,
  Reply,
  Send,
  X
} from 'lucide-react';

const CommunicationDetailsDialog = ({ 
  open, 
  onClose, 
  communication,
  onSendReply 
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);

  if (!communication) return null;

  const getTypeColor = (type) => {
    const colors = {
      'application': 'bg-blue-100 text-blue-800',
      'interview': 'bg-purple-100 text-purple-800',
      'offer': 'bg-green-100 text-green-800',
      'acceptance': 'bg-emerald-100 text-emerald-800',
      'rejection': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'application': 'Application',
      'interview': 'Interview',
      'offer': 'Job Offer',
      'acceptance': 'Accepted',
      'rejection': 'Rejected'
    };
    return labels[type] || type;
  };

  const handleSendReply = () => {
    if (replyText.trim() && onSendReply) {
      onSendReply(communication.id, replyText);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <div className="flex items-start justify-between w-full max-w-full overflow-hidden">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold mb-2 break-words pr-2">
                {communication.subject}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getTypeColor(communication.type)} text-xs`}>
                  {getTypeLabel(communication.type)}
                </Badge>
                {!communication.read && (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">
                    Unread
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 w-full max-w-full overflow-hidden">
          {/* Candidate Information */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3">Contact Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Candidate</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{communication.candidateName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg shrink-0">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Email</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900 break-all">{communication.candidateEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg shrink-0">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Position</p>
                  <p className="font-medium text-sm sm:text-base text-gray-900 break-words">{communication.jobTitle}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Date</p>
                  <p className="font-medium text-xs sm:text-sm text-gray-900">{formatDate(communication.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-2 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Message</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">{communication.message}</p>
            </div>
          </div>

          {/* Interview Type (if applicable) */}
          {communication.interviewType && (
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Interview Type</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {communication.interviewType.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          {/* Reply Section */}
          {!showReplyBox ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setShowReplyBox(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
                variant="outline"
              >
                <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                Reply
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href={`mailto:${communication.candidateEmail}`} className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                  Send Email
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Write Reply</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="resize-none text-sm sm:text-base"
              />
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                  className="w-full sm:w-auto text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommunicationDetailsDialog;
