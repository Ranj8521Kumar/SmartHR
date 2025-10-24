import { useState, useEffect } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import StatsCard from '../shared/StatsCard';
import DataTable from '../shared/DataTable';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  BarChart3, 
  ScrollText,
  Settings,
  UserCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import userService from '../../services/userService';
import jobService from '../../services/jobService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Job filters
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicationTrends, setApplicationTrends] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  
  // Form data for creating/editing users
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    department: ''
  });

  // Form data for creating/editing jobs
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    employmentType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    skills: '',
    qualifications: '',
    responsibilities: '',
    openings: 1,
    deadline: ''
  });

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
  };

  // Helper function to transform application trends
  const transformApplicationTrends = (applications) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = {};
    
    applications.forEach(app => {
      const date = new Date(app.createdAt);
      const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
    });

    // Get last 6 months
    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      result.push({
        name: monthNames[d.getMonth()],
        applications: monthlyCounts[key] || 0
      });
    }
    
    return result;
  };

  // Helper function to transform status data
  const transformStatusData = (statusArray) => {
    const colorMap = {
      'submitted': '#f59e0b',
      'under_review': '#3b82f6',
      'shortlisted': '#8b5cf6',
      'interview_scheduled': '#6366f1',
      'interviewed': '#8b5cf6',
      'offer_extended': '#10b981',
      'accepted': '#10b981',
      'rejected': '#ef4444',
      'withdrawn': '#6b7280'
    };

    const nameMap = {
      'submitted': 'Pending',
      'under_review': 'Reviewing',
      'shortlisted': 'Shortlisted',
      'interview_scheduled': 'Interview Scheduled',
      'interviewed': 'Interviewed',
      'offer_extended': 'Offered',
      'accepted': 'Accepted',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
    };

    return statusArray.map(item => ({
      name: nameMap[item._id] || item._id,
      value: item.count,
      color: colorMap[item._id] || '#6b7280'
    }));
  };

  // Fetch dashboard analytics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getDashboardAnalytics();
        setDashboardData(response.data);
        
        // Transform application trends data for chart
        if (response.data.recentApplications) {
          const last6Months = transformApplicationTrends(response.data.recentApplications);
          setApplicationTrends(last6Months);
        }
        
        // Transform status data for pie chart
        if (response.data.applicationsByStatus) {
          const statusData = transformStatusData(response.data.applicationsByStatus);
          setStatusDistribution(statusData);
        }
        
        // Fetch real system logs
        try {
          const logsResponse = await dashboardService.getSystemLogs({ limit: 4 });
          if (logsResponse.data && logsResponse.data.length > 0) {
            const logs = logsResponse.data.map(log => ({
              action: log.message,
              time: getTimeAgo(log.createdAt),
              type: log.level === 'error' ? 'warning' : log.level === 'info' ? 'success' : 'info'
            }));
            setRecentLogs(logs);
          } else {
            // Fallback to recent applications as activity if no logs
            if (response.data.recentApplications) {
              const logs = response.data.recentApplications.slice(0, 4).map(app => ({
                action: `Application #${app._id.slice(-4)} submitted for ${app.job?.title || 'Unknown Job'}`,
                time: getTimeAgo(app.createdAt),
                type: 'info'
              }));
              setRecentLogs(logs);
            }
          }
        } catch (logError) {
          console.error('Failed to fetch logs, using fallback:', logError);
          // Fallback to recent applications
          if (response.data.recentApplications) {
            const logs = response.data.recentApplications.slice(0, 4).map(app => ({
              action: `Application #${app._id.slice(-4)} submitted for ${app.job?.title || 'Unknown Job'}`,
              time: getTimeAgo(app.createdAt),
              type: 'info'
            }));
            setRecentLogs(logs);
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch users when users view is active
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeView === 'users') {
        try {
          setUsersLoading(true);
          const response = await userService.getUsers({ limit: 100 });
          const transformedUsers = response.data.map(u => ({
            id: u._id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            role: u.role,
            status: u.isActive ? 'active' : 'inactive',
            lastLogin: u.lastLogin ? getTimeAgo(u.lastLogin) : 'Never'
          }));
          setUsers(transformedUsers);
        } catch (error) {
          console.error('Failed to fetch users:', error);
        } finally {
          setUsersLoading(false);
        }
      }
    };

    fetchUsers();
  }, [activeView]);

  // Fetch jobs when jobs view is active
  useEffect(() => {
    const fetchJobs = async () => {
      if (activeView === 'jobs') {
        try {
          setJobsLoading(true);
          // Don't pass status parameter - backend will return all jobs for admin users
          const response = await jobService.getJobs({ limit: 100 });
          setJobs(response.data || []);
        } catch (error) {
          console.error('Failed to fetch jobs:', error);
        } finally {
          setJobsLoading(false);
        }
      }
    };

    fetchJobs();
  }, [activeView]);

  // Filtered jobs based on status and type filters
  const filteredJobs = jobs.filter(job => {
    const statusMatch = jobStatusFilter === 'all' || job.status === jobStatusFilter;
    const typeMatch = jobTypeFilter === 'all' || job.employmentType === jobTypeFilter;
    return statusMatch && typeMatch;
  });

  // Handle form input changes
  const handleFormChange = (field, value) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  // Handle create user
  const handleCreateUser = async () => {
    try {
      setFormError('');
      
      // Validate form
      if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password || !userForm.role) {
        setFormError('Please fill in all required fields');
        return;
      }

      // Prepare user data
      const userData = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        password: userForm.password,
        role: userForm.role
      };

      // Only include department if it has a value
      if (userForm.department) {
        userData.department = userForm.department;
      }

      // Create user
      await userService.createUser(userData);
      
      // Reset form and close dialog
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        department: ''
      });
      setIsCreateUserOpen(false);
      
      // Refresh users list
      const response = await userService.getUsers({ limit: 100 });
      const transformedUsers = response.data.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLogin ? getTimeAgo(u.lastLogin) : 'Never'
      }));
      setUsers(transformedUsers);
      
      // Show success message (you can implement toast notifications)
      alert('User created successfully!');
    } catch (error) {
      console.error('Failed to create user:', error);
      setFormError(error.message || 'Failed to create user');
    }
  };

  // Handle edit user
  const handleEditUser = (userId) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      const nameParts = userToEdit.name.split(' ');
      setUserForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: userToEdit.email,
        password: '', // Don't populate password
        role: userToEdit.role,
        department: ''
      });
      setSelectedUser(userToEdit);
      setIsEditUserOpen(true);
    }
  };

  // Handle update user
  const handleUpdateUser = async () => {
    try {
      setFormError('');
      
      if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.role) {
        setFormError('Please fill in all required fields');
        return;
      }

      // Prepare update data (don't send password if empty)
      const updateData = {
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        email: userForm.email,
        role: userForm.role
      };

      // Only include department if it has a value
      if (userForm.department) {
        updateData.department = userForm.department;
      }

      // Only include password if it's provided
      if (userForm.password) {
        updateData.password = userForm.password;
      }

      console.log('Updating user:', selectedUser.id, 'with data:', updateData);
      await userService.updateUser(selectedUser.id, updateData);
      
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        department: ''
      });
      setSelectedUser(null);
      setIsEditUserOpen(false);
      
      // Refresh users list
      const response = await userService.getUsers({ limit: 100 });
      const transformedUsers = response.data.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLogin ? getTimeAgo(u.lastLogin) : 'Never'
      }));
      setUsers(transformedUsers);
      
      alert('User updated successfully!');
    } catch (error) {
      console.error('Failed to update user:', error);
      setFormError(error.message || 'Failed to update user');
    }
  };

  // Handle toggle user status
  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? false : true;
      await userService.updateUser(userId, { isActive: newStatus });
      
      // Refresh users list
      const response = await userService.getUsers({ limit: 100 });
      const transformedUsers = response.data.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLogin ? getTimeAgo(u.lastLogin) : 'Never'
      }));
      setUsers(transformedUsers);
      
      alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      
      // Refresh users list
      const response = await userService.getUsers({ limit: 100 });
      const transformedUsers = response.data.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: u.lastLogin ? getTimeAgo(u.lastLogin) : 'Never'
      }));
      setUsers(transformedUsers);
      
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  // Job handlers
  const handleJobFormChange = (field, value) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const handleCreateJob = async () => {
    try {
      setFormError('');
      
      if (!jobForm.title || !jobForm.description || !jobForm.department || !jobForm.location || 
          !jobForm.employmentType || !jobForm.experienceLevel || !jobForm.salaryMin || !jobForm.salaryMax) {
        setFormError('Please fill in all required fields');
        return;
      }

      const jobData = {
        title: jobForm.title,
        description: jobForm.description,
        department: jobForm.department,
        location: jobForm.location,
        employmentType: jobForm.employmentType,
        experienceLevel: jobForm.experienceLevel,
        salary: {
          min: Number(jobForm.salaryMin),
          max: Number(jobForm.salaryMax),
          currency: 'USD'
        },
        skills: jobForm.skills ? jobForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        qualifications: jobForm.qualifications ? jobForm.qualifications.split(',').map(q => q.trim()).filter(Boolean) : [],
        responsibilities: jobForm.responsibilities ? jobForm.responsibilities.split(',').map(r => r.trim()).filter(Boolean) : [],
        openings: Number(jobForm.openings) || 1,
        deadline: jobForm.deadline || undefined
      };

      await jobService.createJob(jobData);
      
      setJobForm({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: '',
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
        skills: '',
        qualifications: '',
        responsibilities: '',
        openings: 1,
        deadline: ''
      });
      setIsCreateJobOpen(false);
      
      // Refresh jobs list
      const response = await jobService.getJobs({ limit: 100 });
      setJobs(response.data || []);
      
      alert('Job created successfully!');
    } catch (error) {
      console.error('Failed to create job:', error);
      setFormError(error.message || 'Failed to create job');
    }
  };

  const handleEditJob = (jobId) => {
    const jobToEdit = jobs.find(j => j._id === jobId);
    if (jobToEdit) {
      setJobForm({
        title: jobToEdit.title,
        description: jobToEdit.description,
        department: jobToEdit.department,
        location: jobToEdit.location,
        employmentType: jobToEdit.employmentType,
        experienceLevel: jobToEdit.experienceLevel,
        salaryMin: jobToEdit.salary?.min || '',
        salaryMax: jobToEdit.salary?.max || '',
        skills: jobToEdit.skills?.join(', ') || '',
        qualifications: jobToEdit.qualifications?.join(', ') || '',
        responsibilities: jobToEdit.responsibilities?.join(', ') || '',
        openings: jobToEdit.openings || 1,
        deadline: jobToEdit.deadline ? new Date(jobToEdit.deadline).toISOString().split('T')[0] : ''
      });
      setSelectedJob(jobToEdit);
      setIsEditJobOpen(true);
    }
  };

  const handleUpdateJob = async () => {
    try {
      setFormError('');
      
      if (!jobForm.title || !jobForm.description || !jobForm.department || !jobForm.location || 
          !jobForm.employmentType || !jobForm.experienceLevel || !jobForm.salaryMin || !jobForm.salaryMax) {
        setFormError('Please fill in all required fields');
        return;
      }

      const jobData = {
        title: jobForm.title,
        description: jobForm.description,
        department: jobForm.department,
        location: jobForm.location,
        employmentType: jobForm.employmentType,
        experienceLevel: jobForm.experienceLevel,
        salary: {
          min: Number(jobForm.salaryMin),
          max: Number(jobForm.salaryMax),
          currency: 'USD'
        },
        skills: jobForm.skills ? jobForm.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        qualifications: jobForm.qualifications ? jobForm.qualifications.split(',').map(q => q.trim()).filter(Boolean) : [],
        responsibilities: jobForm.responsibilities ? jobForm.responsibilities.split(',').map(r => r.trim()).filter(Boolean) : [],
        openings: Number(jobForm.openings) || 1,
        deadline: jobForm.deadline || undefined
      };

      await jobService.updateJob(selectedJob._id, jobData);
      
      setJobForm({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: '',
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
        skills: '',
        qualifications: '',
        responsibilities: '',
        openings: 1,
        deadline: ''
      });
      setSelectedJob(null);
      setIsEditJobOpen(false);
      
      // Refresh jobs list
      const response = await jobService.getJobs({ limit: 100 });
      setJobs(response.data || []);
      
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Failed to update job:', error);
      setFormError(error.message || 'Failed to update job');
    }
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    try {
      console.log('Toggle job status called with:', { jobId, currentStatus });
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';
      console.log('New status will be:', newStatus);
      
      const result = await jobService.updateJob(jobId, { status: newStatus });
      console.log('Update result:', result);
      
      // Refresh jobs list
      const response = await jobService.getJobs({ limit: 100 });
      console.log('Fetched jobs after update:', response.data?.length);
      setJobs(response.data || []);
      
      alert(`Job ${newStatus === 'open' ? 'opened' : 'closed'} successfully!`);
    } catch (error) {
      console.error('Failed to toggle job status:', error);
      alert('Failed to update job status: ' + error.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      await jobService.deleteJob(jobId);
      
      // Refresh jobs list
      const response = await jobService.getJobs({ limit: 100 });
      setJobs(response.data || []);
      
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job');
    }
  };

  // Reset form when dialogs close
  const handleCloseCreateDialog = (open) => {
    setIsCreateUserOpen(open);
    if (!open) {
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        department: ''
      });
      setFormError('');
    }
  };

  const handleCloseEditDialog = (open) => {
    setIsEditUserOpen(open);
    if (!open) {
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        department: ''
      });
      setSelectedUser(null);
      setFormError('');
    }
  };

  const handleCloseCreateJobDialog = (open) => {
    setIsCreateJobOpen(open);
    if (!open) {
      setJobForm({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: '',
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
        skills: '',
        qualifications: '',
        responsibilities: '',
        openings: 1,
        deadline: ''
      });
      setFormError('');
    }
  };

  const handleCloseEditJobDialog = (open) => {
    setIsEditJobOpen(open);
    if (!open) {
      setJobForm({
        title: '',
        description: '',
        department: '',
        location: '',
        employmentType: '',
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
        skills: '',
        qualifications: '',
        responsibilities: '',
        openings: 1,
        deadline: ''
      });
      setSelectedJob(null);
      setFormError('');
    }
  };

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Users className="h-5 w-5" />, label: 'Users', active: activeView === 'users', onClick: () => setActiveView('users') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs'), badge: dashboardData?.summary?.openJobs || 0 },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: dashboardData?.summary?.pendingApplications || 0 },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', active: activeView === 'analytics', onClick: () => setActiveView('analytics') },
    { icon: <ScrollText className="h-5 w-5" />, label: 'Logs', active: activeView === 'logs', onClick: () => setActiveView('logs') },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', active: activeView === 'settings', onClick: () => setActiveView('settings') },
  ];

  const userColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      accessor: (row) => (
        <Badge variant="outline">{row.role}</Badge>
      )
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {row.status === 'active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
          {row.status}
        </Badge>
      )
    },
    { header: 'Last Login', accessor: 'lastLogin' },
    { 
      header: 'Actions', 
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-gray-100 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditUser(row.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleUserStatus(row.id, row.status)}>
              <UserCheck className="h-4 w-4 mr-2" />
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(row.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  const jobColumns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Department', accessor: 'department' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Type', 
      accessor: (row) => (
        <Badge variant="outline">{row.employmentType}</Badge>
      )
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <Badge variant={row.status === 'open' ? 'default' : 'secondary'}>
          {row.status}
        </Badge>
      )
    },
    { 
      header: 'Applications', 
      accessor: (row) => (
        <span className="text-sm">{row.applicationsCount || 0}</span>
      )
    },
    { 
      header: 'Actions', 
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 px-2 rounded-md hover:bg-gray-100 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditJob(row._id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleJobStatus(row._id, row.status)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {row.status === 'open' ? 'Close' : 'Open'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteJob(row._id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ];

  return (
    <DashboardLayout user={user} sidebarItems={sidebarItems} theme="blue">
      {loading && activeView === 'dashboard' ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      ) : (
        <>
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">System overview and management</p>
              </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              value={dashboardData?.summary?.totalUsers?.toString() || '0'}
              icon={<Users className="h-6 w-6" />}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Active Jobs"
              value={dashboardData?.summary?.openJobs?.toString() || '0'}
              icon={<Briefcase className="h-6 w-6" />}
              color="green"
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Total Applications"
              value={dashboardData?.summary?.totalApplications?.toString() || '0'}
              icon={<FileText className="h-6 w-6" />}
              color="purple"
              trend={{ value: 23, isPositive: true }}
            />
            <StatsCard
              title="Active Users"
              value={dashboardData?.summary?.activeUsers?.toString() || '0'}
              icon={<CheckCircle2 className="h-6 w-6" />}
              color="green"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={applicationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === 'success' ? 'bg-green-500' : 
                        log.type === 'warning' ? 'bg-yellow-500' : 
                        'bg-blue-500'
                      }`} />
                      <span className="text-sm">{log.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage system users and permissions</p>
            </div>
            <Button onClick={() => setIsCreateUserOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <Dialog open={isCreateUserOpen} onOpenChange={handleCloseCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      placeholder="John" 
                      value={userForm.firstName}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Doe" 
                      value={userForm.lastName}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={userForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={userForm.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={userForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr_recruiter">HR Recruiter</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Select value={userForm.department} onValueChange={(value) => handleFormChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreateUser}>Create User</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditUserOpen} onOpenChange={handleCloseEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input 
                      id="editFirstName" 
                      placeholder="John" 
                      value={userForm.firstName}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input 
                      id="editLastName" 
                      placeholder="Doe" 
                      value={userForm.lastName}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input 
                    id="editEmail" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={userForm.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
                  <Input 
                    id="editPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    value={userForm.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select value={userForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr_recruiter">HR Recruiter</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editDepartment">Department (Optional)</Label>
                  <Select value={userForm.department} onValueChange={(value) => handleFormChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleUpdateUser}>Update User</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              {usersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                </div>
              ) : (
                <DataTable
                  data={users}
                  columns={userColumns}
                  searchable
                  searchPlaceholder="Search users..."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'jobs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">Job Management</h1>
              <p className="text-gray-600">Manage job postings and openings</p>
            </div>
            <Button onClick={() => setIsCreateJobOpen(true)}>
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>

          {/* Filter Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="statusFilter">Filter by Status</Label>
                  <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                    <SelectTrigger id="statusFilter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="typeFilter">Filter by Type</Label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger id="typeFilter">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setJobStatusFilter('all');
                    setJobTypeFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
            </CardContent>
          </Card>

          <Dialog open={isCreateJobOpen} onOpenChange={handleCloseCreateJobDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post New Job</DialogTitle>
                <DialogDescription>Create a new job posting</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input 
                    id="jobTitle" 
                    placeholder="e.g. Senior Software Engineer" 
                    value={jobForm.title}
                    onChange={(e) => handleJobFormChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="jobDescription">Description *</Label>
                  <textarea 
                    id="jobDescription" 
                    placeholder="Job description..."
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={jobForm.description}
                    onChange={(e) => handleJobFormChange('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobDepartment">Department *</Label>
                    <Select value={jobForm.department} onValueChange={(value) => handleJobFormChange('department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jobLocation">Location *</Label>
                    <Input 
                      id="jobLocation" 
                      placeholder="e.g. New York, Remote" 
                      value={jobForm.location}
                      onChange={(e) => handleJobFormChange('location', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select value={jobForm.employmentType} onValueChange={(value) => handleJobFormChange('employmentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="experienceLevel">Experience Level *</Label>
                    <Select value={jobForm.experienceLevel} onValueChange={(value) => handleJobFormChange('experienceLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                        <SelectItem value="Mid Level">Mid Level</SelectItem>
                        <SelectItem value="Senior Level">Senior Level</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salaryMin">Min Salary *</Label>
                    <Input 
                      id="salaryMin" 
                      type="number" 
                      placeholder="50000" 
                      value={jobForm.salaryMin}
                      onChange={(e) => handleJobFormChange('salaryMin', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="salaryMax">Max Salary *</Label>
                    <Input 
                      id="salaryMax" 
                      type="number" 
                      placeholder="80000" 
                      value={jobForm.salaryMax}
                      onChange={(e) => handleJobFormChange('salaryMax', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="openings">Openings</Label>
                    <Input 
                      id="openings" 
                      type="number" 
                      placeholder="1" 
                      value={jobForm.openings}
                      onChange={(e) => handleJobFormChange('openings', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input 
                    id="skills" 
                    placeholder="JavaScript, React, Node.js" 
                    value={jobForm.skills}
                    onChange={(e) => handleJobFormChange('skills', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="qualifications">Qualifications (comma separated)</Label>
                  <Input 
                    id="qualifications" 
                    placeholder="Bachelor's degree, 3+ years experience" 
                    value={jobForm.qualifications}
                    onChange={(e) => handleJobFormChange('qualifications', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="responsibilities">Responsibilities (comma separated)</Label>
                  <Input 
                    id="responsibilities" 
                    placeholder="Develop features, Code reviews, Mentoring" 
                    value={jobForm.responsibilities}
                    onChange={(e) => handleJobFormChange('responsibilities', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    value={jobForm.deadline}
                    onChange={(e) => handleJobFormChange('deadline', e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreateJob}>Post Job</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditJobOpen} onOpenChange={handleCloseEditJobDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Job</DialogTitle>
                <DialogDescription>Update job posting details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formError}
                  </div>
                )}
                <div>
                  <Label htmlFor="editJobTitle">Job Title *</Label>
                  <Input 
                    id="editJobTitle" 
                    placeholder="e.g. Senior Software Engineer" 
                    value={jobForm.title}
                    onChange={(e) => handleJobFormChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editJobDescription">Description *</Label>
                  <textarea 
                    id="editJobDescription" 
                    placeholder="Job description..."
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    value={jobForm.description}
                    onChange={(e) => handleJobFormChange('description', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editJobDepartment">Department *</Label>
                    <Select value={jobForm.department} onValueChange={(value) => handleJobFormChange('department', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editJobLocation">Location *</Label>
                    <Input 
                      id="editJobLocation" 
                      placeholder="e.g. New York, Remote" 
                      value={jobForm.location}
                      onChange={(e) => handleJobFormChange('location', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editEmploymentType">Employment Type *</Label>
                    <Select value={jobForm.employmentType} onValueChange={(value) => handleJobFormChange('employmentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editExperienceLevel">Experience Level *</Label>
                    <Select value={jobForm.experienceLevel} onValueChange={(value) => handleJobFormChange('experienceLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                        <SelectItem value="Mid Level">Mid Level</SelectItem>
                        <SelectItem value="Senior Level">Senior Level</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editSalaryMin">Min Salary *</Label>
                    <Input 
                      id="editSalaryMin" 
                      type="number" 
                      placeholder="50000" 
                      value={jobForm.salaryMin}
                      onChange={(e) => handleJobFormChange('salaryMin', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editSalaryMax">Max Salary *</Label>
                    <Input 
                      id="editSalaryMax" 
                      type="number" 
                      placeholder="80000" 
                      value={jobForm.salaryMax}
                      onChange={(e) => handleJobFormChange('salaryMax', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editOpenings">Openings</Label>
                    <Input 
                      id="editOpenings" 
                      type="number" 
                      placeholder="1" 
                      value={jobForm.openings}
                      onChange={(e) => handleJobFormChange('openings', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editSkills">Skills (comma separated)</Label>
                  <Input 
                    id="editSkills" 
                    placeholder="JavaScript, React, Node.js" 
                    value={jobForm.skills}
                    onChange={(e) => handleJobFormChange('skills', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editQualifications">Qualifications (comma separated)</Label>
                  <Input 
                    id="editQualifications" 
                    placeholder="Bachelor's degree, 3+ years experience" 
                    value={jobForm.qualifications}
                    onChange={(e) => handleJobFormChange('qualifications', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editResponsibilities">Responsibilities (comma separated)</Label>
                  <Input 
                    id="editResponsibilities" 
                    placeholder="Develop features, Code reviews, Mentoring" 
                    value={jobForm.responsibilities}
                    onChange={(e) => handleJobFormChange('responsibilities', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editDeadline">Application Deadline</Label>
                  <Input 
                    id="editDeadline" 
                    type="date" 
                    value={jobForm.deadline}
                    onChange={(e) => handleJobFormChange('deadline', e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleUpdateJob}>Update Job</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              {jobsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading jobs...</p>
                  </div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No jobs found matching your filters</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setJobStatusFilter('all');
                      setJobTypeFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <DataTable
                  data={filteredJobs}
                  columns={jobColumns}
                  searchable
                  searchPlaceholder="Search jobs..."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">System-wide metrics and insights</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applicationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.jobsByDepartment?.map((dept, index) => {
                    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                          <span>{dept._id || 'Unknown'}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {dept.openPositions || 0} open • {dept.count || 0} total
                        </div>
                      </div>
                    );
                  })}
                  {(!dashboardData?.jobsByDepartment || dashboardData.jobsByDepartment.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      No department data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
        </>
      )}
    </DashboardLayout>
  );
}
