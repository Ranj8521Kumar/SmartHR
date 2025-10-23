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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold mb-2">
                {communication.subject}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getTypeColor(communication.type)}>
                  {getTypeLabel(communication.type)}
                </Badge>
                {!communication.read && (
                  <Badge variant="destructive" className="text-xs">
                    Unread
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Candidate Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Candidate</p>
                  <p className="font-medium text-gray-900">{communication.candidateName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900 break-all">{communication.candidateEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Position</p>
                  <p className="font-medium text-gray-900">{communication.jobTitle}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-900">{formatDate(communication.date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Message</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{communication.message}</p>
            </div>
          </div>

          {/* Interview Type (if applicable) */}
          {communication.interviewType && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Interview Type</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {communication.interviewType.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          {/* Reply Section */}
          {!showReplyBox ? (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowReplyBox(true)}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Reply className="h-4 w-4" />
                Reply
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${communication.candidateEmail}`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Write Reply</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
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
