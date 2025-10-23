import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { X, Plus, Loader2 } from 'lucide-react';
import jobService from '../../services/jobService';

const departments = ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Other'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager'];
const statusOptions = ['open', 'closed', 'on-hold', 'filled'];

export default function EditJobForm({ isOpen, onClose, job, onJobUpdated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employmentType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    openings: 1,
    deadline: '',
    status: 'open',
    skills: [],
    qualifications: [],
    responsibilities: [],
    benefits: [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [qualificationInput, setQualificationInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  // Populate form when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        department: job.department || '',
        location: job.location || '',
        employmentType: job.employmentType || '',
        experienceLevel: job.experienceLevel || '',
        salaryMin: job.salary?.min?.toString() || '',
        salaryMax: job.salary?.max?.toString() || '',
        openings: job.openings || 1,
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
        status: job.status || 'open',
        skills: job.skills || [],
        qualifications: job.qualifications || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
      });
    }
  }, [job]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = (field, value, setter) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter('');
    }
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        location: formData.location,
        employmentType: formData.employmentType,
        experienceLevel: formData.experienceLevel,
        salary: {
          min: parseInt(formData.salaryMin),
          max: parseInt(formData.salaryMax),
          currency: 'USD'
        },
        openings: parseInt(formData.openings),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        status: formData.status,
        skills: formData.skills,
        qualifications: formData.qualifications,
        responsibilities: formData.responsibilities,
        benefits: formData.benefits,
      };

      const response = await jobService.updateJob(job._id, jobData);
      
      if (response.success) {
        onJobUpdated(response.data);
        handleClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Edit Job Posting</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update the job posting details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
          {/* Basic Information */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Basic Information</h3>
            
            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="title" className="text-xs sm:text-sm">Job Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Full Stack Developer"
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="description" className="text-xs sm:text-sm">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, team, and what you're looking for..."
                rows={4}
                className="text-sm sm:text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="department" className="text-xs sm:text-sm">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange('department', value)}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="location" className="text-xs sm:text-sm">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY / Remote"
                  className="text-sm sm:text-base"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="employmentType" className="text-xs sm:text-sm">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleSelectChange('employmentType', value)}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="experienceLevel" className="text-xs sm:text-sm">Experience Level *</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => handleSelectChange('experienceLevel', value)}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Compensation & Details */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Compensation & Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full overflow-hidden">
              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="salaryMin" className="text-xs sm:text-sm">Minimum Salary (USD) *</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  className="text-sm sm:text-base"
                  placeholder="50000"
                  required
                />
              </div>

              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="salaryMax" className="text-xs sm:text-sm">Maximum Salary (USD) *</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="80000"
                  className="text-sm sm:text-base"
                  required
                />
              </div>

              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="openings" className="text-xs sm:text-sm">Number of Openings *</Label>
                <Input
                  id="openings"
                  name="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={handleInputChange}
                  className="text-sm sm:text-base"
                  required
                />
              </div>

              <div className="w-full max-w-full overflow-hidden">
                <Label htmlFor="status" className="text-xs sm:text-sm">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  required
                >
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-full max-w-full overflow-hidden">
              <Label htmlFor="deadline" className="text-xs sm:text-sm">Application Deadline</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Required Skills</h3>
            <div className="flex gap-2 w-full max-w-full">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g., React, Node.js, TypeScript"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', skillInput, setSkillInput))}
                className="text-sm sm:text-base flex-1 min-w-0"
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => addItem('skills', skillInput, setSkillInput)}
                variant="outline"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 w-full max-w-full overflow-hidden">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 shrink-0"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeItem('skills', index)}
                    className="hover:text-purple-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Qualifications */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Qualifications</h3>
            <div className="flex gap-2 w-full max-w-full">
              <Input
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                placeholder="e.g., Bachelor's degree in Computer Science"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('qualifications', qualificationInput, setQualificationInput))}
                className="text-sm sm:text-base flex-1 min-w-0"
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                onClick={() => addItem('qualifications', qualificationInput, setQualificationInput)}
                variant="outline"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <ul className="space-y-2 w-full max-w-full overflow-hidden">
              {formData.qualifications.map((qual, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm break-words">
                  <span className="flex-1">{qual}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('qualifications', index)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Responsibilities */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Key Responsibilities</h3>
            <div className="flex gap-2 w-full max-w-full">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                placeholder="e.g., Design and implement scalable backend services"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('responsibilities', responsibilityInput, setResponsibilityInput))}
                className="text-sm sm:text-base flex-1 min-w-0"
              />
              <Button
                type="button"
                onClick={() => addItem('responsibilities', responsibilityInput, setResponsibilityInput)}
                size="sm"
                className="shrink-0"
                variant="outline"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <ul className="space-y-2 w-full max-w-full overflow-hidden">
              {formData.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start gap-2 text-xs sm:text-sm break-words">
                  <span className="flex-1">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('responsibilities', index)}
                    className="text-red-500 hover:text-red-700 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Benefits</h3>
            <div className="flex gap-2 w-full max-w-full">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="e.g., Health insurance, 401(k), Remote work"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('benefits', benefitInput, setBenefitInput))}
                className="text-sm sm:text-base flex-1 min-w-0"
              />
              <Button
                type="button"
                onClick={() => addItem('benefits', benefitInput, setBenefitInput)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 w-full max-w-full overflow-hidden">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 shrink-0"
                >
                  {benefit}
                  <button
                    type="button"
                    onClick={() => removeItem('benefits', index)}
                    className="hover:text-green-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="w-full sm:w-auto text-sm">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Job Posting'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
