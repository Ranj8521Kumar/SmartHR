import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText, 
  Calendar,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import candidateService from '../../services/candidateService';

export default function CandidateDetailsDialog({ isOpen, onClose, candidateId }) {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCandidateDetails = async () => {
    setLoading(true);
    try {
      const response = await candidateService.getCandidateById(candidateId);
      if (response.success) {
        setCandidate(response.data);
      }
    } catch (error) {
      console.error('Error fetching candidate details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && candidateId) {
      fetchCandidateDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, candidateId]);

  const statusBadgeMap = {
    'submitted': { variant: 'secondary', label: 'Submitted' },
    'under_review': { variant: 'default', label: 'Under Review' },
    'shortlisted': { variant: 'default', label: 'Shortlisted' },
    'interview_scheduled': { variant: 'default', label: 'Interview Scheduled' },
    'interviewed': { variant: 'default', label: 'Interviewed' },
    'offer_extended': { variant: 'default', label: 'Offer Extended' },
    'accepted': { variant: 'default', label: 'Hired' },
    'rejected': { variant: 'destructive', label: 'Rejected' },
    'withdrawn': { variant: 'secondary', label: 'Withdrawn' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : candidate ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="skills">Skills & Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Candidate Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.firstName} ${candidate.lastName}`}
                      alt={`${candidate.firstName} ${candidate.lastName}`}
                      className="w-24 h-24 rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Total Applications</div>
                        <div className="text-xl font-bold">{candidate.totalApplications}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Average Score</div>
                        <div className="text-xl font-bold">{candidate.averageScore || 0}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Highest Score</div>
                        <div className="text-xl font-bold">{candidate.highestScore || 0}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <User className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="w-full px-1">
                        <div className="text-xs text-gray-600 mb-1">Latest Status</div>
                        <Badge 
                          variant={statusBadgeMap[candidate.applications[0]?.status]?.variant || 'secondary'} 
                          className="text-[10px] px-2 py-0.5 leading-tight max-w-full inline-block"
                        >
                          <span className="block truncate">
                            {statusBadgeMap[candidate.applications[0]?.status]?.label || 'Unknown'}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Applications Preview */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4">Recent Applications</h4>
                  <div className="space-y-3">
                    {candidate.applications.slice(0, 3).map((app) => (
                      <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {app.job?.title || 'Unknown Position'}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="w-fit">
                            {statusBadgeMap[app.status]?.label || 'Unknown'}
                          </Badge>
                          {app.aiScore && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Progress value={app.aiScore.overallScore} className="w-24" />
                              <span className="text-sm font-semibold text-purple-600 min-w-[3rem]">
                                {app.aiScore.overallScore}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="applications" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4">All Applications</h4>
                  <div className="space-y-4">
                    {candidate.applications.map((app) => (
                      <div key={app._id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 mb-2">
                              {app.job?.title || 'Unknown Position'}
                            </h5>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{app.job?.department || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="w-fit">
                            {statusBadgeMap[app.status]?.label || 'Unknown'}
                          </Badge>
                        </div>

                        {app.aiScore && (
                          <div className="space-y-2 bg-gray-50 p-4 rounded">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 min-w-[120px]">Overall Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-md">
                                <Progress value={app.aiScore.overallScore} className="flex-1" />
                                <span className="font-semibold text-purple-600 min-w-[3rem] text-right">
                                  {app.aiScore.overallScore}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 min-w-[120px]">Skills Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-md">
                                <Progress value={app.aiScore.skillsMatch} className="flex-1" />
                                <span className="font-semibold text-blue-600 min-w-[3rem] text-right">
                                  {app.aiScore.skillsMatch}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-sm text-gray-600 min-w-[120px]">Experience Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-md">
                                <Progress value={app.aiScore.experienceMatch} className="flex-1" />
                                <span className="font-semibold text-green-600 min-w-[3rem] text-right">
                                  {app.aiScore.experienceMatch}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4">Skills</h4>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No skills information available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-lg mb-4">Application History</h4>
                  <div className="space-y-3">
                    {candidate.applications.map((app, index) => (
                      <div key={app._id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-600" />
                          {index < candidate.applications.length - 1 && (
                            <div className="w-0.5 h-12 bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium text-gray-900">
                            Applied for {app.job?.title || 'Unknown Position'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleString()}
                          </div>
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="mt-2">
                            {statusBadgeMap[app.status]?.label || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Candidate not found</p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
