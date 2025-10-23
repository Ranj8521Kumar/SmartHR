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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Posting</DialogTitle>
          <DialogDescription>
            Update the job posting details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Full Stack Developer"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the role, team, and what you're looking for..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange('department', value)}
                  required
                >
                  <SelectTrigger>
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

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., New York, NY / Remote"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleSelectChange('employmentType', value)}
                  required
                >
                  <SelectTrigger>
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

              <div>
                <Label htmlFor="experienceLevel">Experience Level *</Label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) => handleSelectChange('experienceLevel', value)}
                  required
                >
                  <SelectTrigger>
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
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Compensation & Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="salaryMin">Minimum Salary (USD) *</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={handleInputChange}
                  placeholder="50000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="salaryMax">Maximum Salary (USD) *</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={handleInputChange}
                  placeholder="80000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="openings">Number of Openings *</Label>
                <Input
                  id="openings"
                  name="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                  required
                >
                  <SelectTrigger>
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

            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Required Skills</h3>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g., React, Node.js, TypeScript"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('skills', skillInput, setSkillInput))}
              />
              <Button
                type="button"
                onClick={() => addItem('skills', skillInput, setSkillInput)}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
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
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Qualifications</h3>
            <div className="flex gap-2">
              <Input
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                placeholder="e.g., Bachelor's degree in Computer Science"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('qualifications', qualificationInput, setQualificationInput))}
              />
              <Button
                type="button"
                onClick={() => addItem('qualifications', qualificationInput, setQualificationInput)}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-2">
              {formData.qualifications.map((qual, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex-1">{qual}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('qualifications', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Responsibilities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Key Responsibilities</h3>
            <div className="flex gap-2">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                placeholder="e.g., Design and implement scalable backend services"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('responsibilities', responsibilityInput, setResponsibilityInput))}
              />
              <Button
                type="button"
                onClick={() => addItem('responsibilities', responsibilityInput, setResponsibilityInput)}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="space-y-2">
              {formData.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="flex-1">{resp}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('responsibilities', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Benefits</h3>
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="e.g., Health insurance, 401(k), Remote work"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('benefits', benefitInput, setBenefitInput))}
              />
              <Button
                type="button"
                onClick={() => addItem('benefits', benefitInput, setBenefitInput)}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
