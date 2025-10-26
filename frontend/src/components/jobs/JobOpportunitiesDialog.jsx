import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Loader2,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  Search,
  Filter,
  Heart,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import jobService from '../../services/jobService';

export default function JobOpportunitiesDialog({ isOpen, onClose, onLoginRequired }) {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all open jobs
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(job => job.department === selectedDepartment);
    }

    // Employment type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(job => job.employmentType === selectedType);
    }

    // Experience level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(job => job.experienceLevel === selectedLevel);
    }

    setFilteredJobs(filtered);
    
    // Calculate total pages (minimum 1)
    const pages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    setTotalPages(pages);
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, selectedType, selectedLevel, jobs, itemsPerPage]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all open jobs with a high limit to get all available positions
      const response = await jobService.getJobs({ status: 'open', limit: 1000 });
      if (response.success && response.data) {
        setJobs(response.data);
        setFilteredJobs(response.data);
      } else {
        setError('Failed to load job opportunities');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load job opportunities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  const handleApplyClick = () => {
    // Close dialogs and trigger login required
    setShowDetails(false);
    onClose();
    onLoginRequired();
  };

  const handleSaveClick = () => {
    // Close dialogs and trigger login required
    setShowDetails(false);
    onClose();
    onLoginRequired();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified';
    return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
  };

  // Pagination helpers
  const getPaginatedJobs = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of job list when page changes
      const jobListElement = document.querySelector('[data-job-list]');
      if (jobListElement) {
        jobListElement.scrollTop = 0;
      }
    }
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Get unique values for filters
  const departments = [...new Set(jobs.map(job => job.department))];
  const employmentTypes = [...new Set(jobs.map(job => job.employmentType))];
  const experienceLevels = [...new Set(jobs.map(job => job.experienceLevel))];

  if (showDetails && selectedJob) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setShowDetails(false);
        setSelectedJob(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl break-words">{selectedJob.title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Full details for this job opportunity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Header Info */}
            <div className="border-b pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">{selectedJob.department}</Badge>
                <Badge variant="outline" className="text-xs">{selectedJob.employmentType}</Badge>
                <Badge variant="outline" className="text-xs">{selectedJob.experienceLevel}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{selectedJob.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{formatSalary(selectedJob.salary)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{selectedJob.openings} opening{selectedJob.openings !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">Deadline: {formatDate(selectedJob.deadline)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Job Description</h3>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line break-words">{selectedJob.description}</p>
            </div>

            {/* Responsibilities */}
            {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Key Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 break-words">
                  {selectedJob.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {selectedJob.qualifications && selectedJob.qualifications.length > 0 && (
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Required Qualifications</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 break-words">
                  {selectedJob.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.benefits.map((benefit, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{benefit}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                className="flex-1" 
                onClick={() => handleApplyClick()}
                size="sm"
              >
                Apply Now
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleSaveClick()}
              >
                <Heart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Job</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedJob(null);
                }}
              >
                Back to List
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen && !showDetails} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] w-[95vw] sm:w-full overflow-hidden flex flex-col p-0">
        <div className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Job Opportunities</DialogTitle>
            <DialogDescription className="text-sm">
              Explore open positions and find your next career opportunity
            </DialogDescription>
          </DialogHeader>

          {/* Filters and Search - Fixed */}
          <div className="space-y-4 px-4 sm:px-6 pb-4 border-b overflow-x-hidden shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by job title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="text-xs sm:text-sm">
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {experienceLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
            <span>
              {filteredJobs.length} {filteredJobs.length === 1 ? 'opportunity' : 'opportunities'} available
            </span>
            {(searchTerm || selectedDepartment !== 'all' || selectedType !== 'all' || selectedLevel !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('all');
                  setSelectedType('all');
                  setSelectedLevel('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Job List - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 min-h-0" data-job-list>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchJobs}>Try Again</Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No job opportunities found matching your criteria.</p>
              {(searchTerm || selectedDepartment !== 'all' || selectedType !== 'all' || selectedLevel !== 'all') && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDepartment('all');
                    setSelectedType('all');
                    setSelectedLevel('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {getPaginatedJobs().map((job) => (
                <Card
                  key={job._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(job)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">{job.title}</h3>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs">{job.department}</Badge>
                          <Badge variant="outline" className="text-xs">{job.employmentType}</Badge>
                          <Badge variant="outline" className="text-xs">{job.experienceLevel}</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{formatSalary(job.salary)}</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">Deadline: {formatDate(job.deadline)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words">
                          {job.description}
                        </p>
                      </div>

                      <div className="flex flex-row sm:flex-row gap-2 justify-start sm:justify-end">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyClick();
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          Apply Now
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveClick();
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(job);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls - Fixed */}
        {!isLoading && !error && filteredJobs.length > 0 && (
          <div className="border-t pt-3 px-3 sm:px-4 pb-3 sm:pb-4 shrink-0 bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm text-gray-600">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-16 sm:w-20 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">per page</span>
              </div>

              {/* Page info and navigation */}
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                <span className="text-xs sm:text-sm text-gray-600 text-center whitespace-nowrap hidden sm:inline">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length}
                </span>
                
                <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4 flex-shrink-0">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Current Page Indicator */}
                  <div className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-primary text-primary-foreground rounded-md min-w-[1.75rem] sm:min-w-[2rem] text-center">
                    {currentPage}
                  </div>
                  
                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
