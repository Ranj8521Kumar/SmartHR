import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Loader2, 
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Trash2
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import resumeService from '../../services/resumeService';

export default function ApplyJobDialog({ isOpen, onClose, job, onSuccess, existingApplications = [] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Existing resumes states
  const [existingResumes, setExistingResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedExistingResume, setSelectedExistingResume] = useState(null);
  const [showResumeSelector, setShowResumeSelector] = useState(false);

  // Check if user has already applied for this job
  useEffect(() => {
    if (isOpen && job && existingApplications.length > 0) {
      const hasApplied = existingApplications.some(
        app => app.job?._id === job._id || app.job === job._id
      );
      setAlreadyApplied(hasApplied);
    }
  }, [isOpen, job, existingApplications]);

  // Fetch existing resumes when dialog opens
  useEffect(() => {
    const fetchResumes = async () => {
      if (isOpen) {
        setLoadingResumes(true);
        try {
          const response = await resumeService.getMyResumes();
          setExistingResumes(response.data || []);
        } catch (err) {
          console.error('Error fetching resumes:', err);
        } finally {
          setLoadingResumes(false);
        }
      }
    };

    fetchResumes();
  }, [isOpen]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCoverLetter('');
      setResumeId('');
      setError(null);
      setSuccess(false);
      setSelectedFile(null);
      setUploadedResume(null);
      setIsUploading(false);
      setSelectedExistingResume(null);
      setShowResumeSelector(false);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Upload immediately
    setIsUploading(true);
    try {
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        setUploadedResume(response.data);
        setResumeId(response.data._id);
      } else {
        setError('Failed to upload resume. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload resume. Please try again.');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelectWithSource(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelectWithSource(file);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedResume(null);
    setResumeId('');
    setSelectedExistingResume(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle selecting an existing resume
  const handleSelectExistingResume = (resume) => {
    setSelectedExistingResume(resume);
    setResumeId(resume._id);
    // Clear any uploaded resume
    setSelectedFile(null);
    setUploadedResume(null);
    setError(null);
    setShowResumeSelector(false); // Close selector after selection
  };

  // Handle uploading new resume (updated to set source)
  const handleFileSelectWithSource = async (file) => {
    // Clear existing resume selection
    setSelectedExistingResume(null);
    await handleFileSelect(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Check if resume is uploaded
    if (!resumeId && !uploadedResume) {
      setError('Please upload a resume to continue');
      setIsSubmitting(false);
      return;
    }

    try {
      const applicationData = {
        job: job._id,
        resume: resumeId || uploadedResume._id,
        coverLetter: coverLetter.trim()
      };

      const response = await applicationService.createApplication(applicationData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) onSuccess(response.data);
          onClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl pr-8">Apply for {job.title}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 sm:py-12 text-center">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Your application has been successfully submitted. We'll review it and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Job Summary */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{job.title}</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant="outline" className="text-xs">{job.department}</Badge>
                <Badge variant="outline" className="text-xs">{job.employmentType}</Badge>
                <Badge variant="outline" className="text-xs">{job.location}</Badge>
              </div>
            </div>

            {/* Already Applied Warning */}
            {alreadyApplied && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-xs sm:text-sm">
                  <strong>You have already applied for this position.</strong> You can view your application status in the "My Applications" section.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Resume Section */}
            <div className="space-y-3">
              <Label htmlFor="resume" className="text-sm sm:text-base">Resume *</Label>
              
              {/* Show "Select Resume" button if user has resumes and nothing is selected yet */}
              {existingResumes.length > 0 && !uploadedResume && !selectedExistingResume && !showResumeSelector && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-dashed hover:border-orange-500 hover:bg-orange-50 text-gray-700"
                    onClick={() => setShowResumeSelector(true)}
                    disabled={loadingResumes}
                  >
                    {loadingResumes ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading resumes...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Select Resume ({existingResumes.length})
                      </>
                    )}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or upload a new resume</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show resume selector when button is clicked */}
              {showResumeSelector && existingResumes.length > 0 && !uploadedResume && !selectedExistingResume && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-gray-600">Select from your uploaded resumes:</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowResumeSelector(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {existingResumes.map((resume) => (
                      <div
                        key={resume._id}
                        onClick={() => handleSelectExistingResume(resume)}
                        className="border-2 border-gray-200 hover:border-orange-500 bg-white rounded-lg p-3 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{resume.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(resume.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or upload a new resume</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show selected existing resume */}
              {selectedExistingResume && !uploadedResume && (
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {selectedExistingResume.fileName}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                          <CheckCircle className="h-3 w-3 text-blue-600 flex-shrink-0" />
                          <span className="text-xs text-blue-600">
                            Resume selected
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload new resume section */}
              {!uploadedResume && !isUploading && !selectedExistingResume && !showResumeSelector ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs sm:text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, DOC, or DOCX up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              ) : isUploading ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 mx-auto mb-2 sm:mb-3 animate-spin" />
                  <p className="text-xs sm:text-sm text-gray-600">Uploading resume...</p>
                </div>
              ) : uploadedResume ? (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {selectedFile?.name || uploadedResume?.fileName}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                          <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-600">
                            Resume uploaded successfully
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="coverLetter" className="text-sm sm:text-base">
                Cover Letter <span className="text-gray-500 text-xs sm:text-sm">(Optional)</span>
              </Label>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this position..."
                rows={4}
                className="resize-none text-sm sm:text-base"
              />
              <p className="text-xs text-gray-500">
                {coverLetter.length} / 2000 characters
              </p>
            </div>

            {/* Required Skills Match */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Required Skills</Label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Make sure your resume highlights these skills
                </p>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto text-sm sm:text-base order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto text-sm sm:text-base order-1 sm:order-2"
                disabled={isSubmitting || alreadyApplied}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    <span className="text-sm sm:text-base">Submitting...</span>
                  </>
                ) : alreadyApplied ? (
                  <span className="text-sm sm:text-base">Already Applied</span>
                ) : (
                  <span className="text-sm sm:text-base">Submit Application</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
