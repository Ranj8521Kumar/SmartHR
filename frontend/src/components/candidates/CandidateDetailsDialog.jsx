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
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Candidate Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-600" />
          </div>
        ) : candidate ? (
          <Tabs defaultValue="overview" className="w-full max-w-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="skills" className="hidden sm:inline-flex">Skills & Profile</TabsTrigger>
              <TabsTrigger value="skills" className="sm:hidden">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 sm:space-y-4 mt-4 w-full max-w-full overflow-hidden">
              {/* Candidate Info */}
              <Card className="w-full max-w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.firstName} ${candidate.lastName}`}
                      alt={`${candidate.firstName} ${candidate.lastName}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto sm:mx-0 shrink-0"
                    />
                    <div className="flex-1 w-full min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center sm:text-left break-words">
                        {candidate.firstName} {candidate.lastName}
                      </h3>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="break-all">{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 w-full max-w-full overflow-hidden">
                <Card className="w-full max-w-full overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Total Applications</div>
                        <div className="text-lg sm:text-xl font-bold">{candidate.totalApplications}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full max-w-full overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Average Score</div>
                        <div className="text-lg sm:text-xl font-bold">{candidate.averageScore || 0}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full max-w-full overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Highest Score</div>
                        <div className="text-lg sm:text-xl font-bold">{candidate.highestScore || 0}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="w-full max-w-full overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <div className="w-full px-1">
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1">Latest Status</div>
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
              <Card className="w-full max-w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Recent Applications</h4>
                  <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
                    {candidate.applications.slice(0, 3).map((app) => (
                      <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-3 w-full max-w-full overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {app.job?.title || 'Unknown Position'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="w-fit text-xs">
                            {statusBadgeMap[app.status]?.label || 'Unknown'}
                          </Badge>
                          {app.aiScore && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Progress value={app.aiScore.overallScore} className="w-20 sm:w-24" />
                              <span className="text-xs sm:text-sm font-semibold text-purple-600 min-w-[3rem]">
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

            <TabsContent value="applications" className="space-y-3 sm:space-y-4 mt-4 w-full max-w-full overflow-hidden">
              <Card className="w-full max-w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">All Applications</h4>
                  <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
                    {candidate.applications.map((app) => (
                      <div key={app._id} className="border rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 sm:mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 sm:mb-2 break-words">
                              {app.job?.title || 'Unknown Position'}
                            </h5>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">{app.job?.department || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="w-fit text-xs shrink-0">
                            {statusBadgeMap[app.status]?.label || 'Unknown'}
                          </Badge>
                        </div>

                        {app.aiScore && (
                          <div className="space-y-2 bg-gray-50 p-3 sm:p-4 rounded w-full max-w-full overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm text-gray-600 min-w-[100px] sm:min-w-[120px]">Overall Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
                                <Progress value={app.aiScore.overallScore} className="flex-1" />
                                <span className="font-semibold text-purple-600 min-w-[3rem] text-right text-xs sm:text-sm">
                                  {app.aiScore.overallScore}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm text-gray-600 min-w-[100px] sm:min-w-[120px]">Skills Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
                                <Progress value={app.aiScore.skillsMatch} className="flex-1" />
                                <span className="font-semibold text-blue-600 min-w-[3rem] text-right text-xs sm:text-sm">
                                  {app.aiScore.skillsMatch}%
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-xs sm:text-sm text-gray-600 min-w-[100px] sm:min-w-[120px]">Experience Match</span>
                              <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
                                <Progress value={app.aiScore.experienceMatch} className="flex-1" />
                                <span className="font-semibold text-green-600 min-w-[3rem] text-right text-xs sm:text-sm">
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

            <TabsContent value="skills" className="space-y-3 sm:space-y-4 mt-4 w-full max-w-full overflow-hidden">
              <Card className="w-full max-w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Skills</h4>
                  {candidate.skills && candidate.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 w-full max-w-full overflow-hidden">
                      {candidate.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm shrink-0">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">No skills information available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="w-full max-w-full overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <h4 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Application History</h4>
                  <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden">
                    {candidate.applications.map((app, index) => (
                      <div key={app._id} className="flex items-start gap-2 sm:gap-3 w-full max-w-full overflow-hidden">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-purple-600" />
                          {index < candidate.applications.length - 1 && (
                            <div className="w-0.5 h-10 sm:h-12 bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 pb-3 sm:pb-4 min-w-0">
                          <div className="font-medium text-sm sm:text-base text-gray-900 break-words">
                            Applied for {app.job?.title || 'Unknown Position'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                            {new Date(app.createdAt).toLocaleString()}
                          </div>
                          <Badge variant={statusBadgeMap[app.status]?.variant || 'secondary'} className="mt-1 sm:mt-2 text-xs">
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
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <p className="text-sm sm:text-base">Candidate not found</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
