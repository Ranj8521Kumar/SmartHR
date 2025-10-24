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
  const [formError, setFormError] = useState('');
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
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
