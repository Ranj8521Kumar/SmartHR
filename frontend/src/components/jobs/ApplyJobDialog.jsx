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

export default function ApplyJobDialog({ isOpen, onClose, job, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeId, setResumeId] = useState('');
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
      handleFileSelect(file);
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
      handleFileSelect(file);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedResume(null);
    setResumeId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Apply for {job.title}</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600">
              Your application has been successfully submitted. We'll review it and get back to you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-900">{job.title}</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{job.department}</Badge>
                <Badge variant="outline">{job.employmentType}</Badge>
                <Badge variant="outline">{job.location}</Badge>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Resume Section */}
            <div className="space-y-2">
              <Label htmlFor="resume">Resume *</Label>
              
              {!uploadedResume && !isUploading ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your resume here, or click to browse
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Loader2 className="h-10 w-10 text-orange-600 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-gray-600">Uploading resume...</p>
                </div>
              ) : (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile?.name || uploadedResume?.fileName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="coverLetter">
                Cover Letter <span className="text-gray-500">(Optional)</span>
              </Label>
              <Textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this position..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {coverLetter.length} / 2000 characters
              </p>
            </div>

            {/* Required Skills Match */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Make sure your resume highlights these skills
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
