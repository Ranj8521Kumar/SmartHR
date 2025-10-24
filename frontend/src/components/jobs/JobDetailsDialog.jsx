import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Loader2, 
  MapPin, 
  Calendar,
  Briefcase,
  DollarSign,
  Users,
  Eye,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import jobService from '../../services/jobService';

export default function JobDetailsDialog({ isOpen, onClose, jobId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jobId]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobById(jobId);
      if (response.success && response.data) {
        setJob(response.data);
      } else {
        setError('Failed to load job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
      'filled': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary) return 'N/A';
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()} ${salary.currency || 'USD'}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full overflow-x-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">Job Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm md:text-base">{error}</p>
            <Button onClick={fetchJobDetails} className="mt-4">Try Again</Button>
          </div>
        ) : job ? (
          <div className="space-y-4 md:space-y-6">
            {/* Header Section - Mobile Responsive */}
            <div className="border-b pb-4">
              <div className="flex flex-col gap-3 mb-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusColor(job.status) + ' text-xs md:text-sm'}>
                      {job.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs md:text-sm">{job.department}</Badge>
                    <Badge variant="outline" className="text-xs md:text-sm">{job.employmentType}</Badge>
                    <Badge variant="outline" className="text-xs md:text-sm">{job.experienceLevel}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4">
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <MapPin className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{formatSalary(job.salary)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Users className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                  <span>{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  <Calendar className="h-3 w-3 md:h-4 md:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">Deadline: {formatDate(job.deadline)}</span>
                </div>
              </div>
            </div>

            {/* Stats Section - Mobile Responsive */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Applications</p>
                      <p className="text-lg md:text-2xl font-bold">{job.applicationsCount || 0}</p>
                    </div>
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Views</p>
                      <p className="text-lg md:text-2xl font-bold">{job.viewsCount || 0}</p>
                    </div>
                    <Eye className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Posted</p>
                      <p className="text-xs md:text-sm font-semibold">{formatDate(job.createdAt)}</p>
                    </div>
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description - Mobile Responsive */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs md:text-sm text-gray-700 whitespace-pre-line">{job.description}</p>
              </CardContent>
            </Card>

            {/* Responsibilities - Mobile Responsive */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1.5 md:space-y-2">
                    {job.responsibilities.map((resp, index) => (
                      <li key={index} className="text-xs md:text-sm text-gray-700">{resp}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Qualifications - Mobile Responsive */}
            {job.qualifications && job.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Required Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1.5 md:space-y-2">
                    {job.qualifications.map((qual, index) => (
                      <li key={index} className="text-xs md:text-sm text-gray-700">{qual}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills - Mobile Responsive */}
            {job.skills && job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits - Mobile Responsive */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {job.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1 text-xs">
                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posted By - Mobile Responsive */}
            {job.postedBy && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs md:text-sm text-gray-700">
                    {job.postedBy.firstName} {job.postedBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{job.postedBy.email}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
