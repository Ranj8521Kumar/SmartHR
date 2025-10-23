import { useState } from 'react';
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

const mockUsers = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'HR Manager', status: 'active', lastLogin: '2 hours ago' },
  { id: 2, name: 'Michael Chen', email: 'michael.c@company.com', role: 'Manager', status: 'active', lastLogin: '1 day ago' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@company.com', role: 'Employee', status: 'active', lastLogin: '3 hours ago' },
  { id: 4, name: 'James Wilson', email: 'james.w@company.com', role: 'Manager', status: 'inactive', lastLogin: '5 days ago' },
  { id: 5, name: 'Lisa Anderson', email: 'lisa.a@company.com', role: 'Employee', status: 'active', lastLogin: '30 minutes ago' },
];

const applicationStats = [
  { name: 'Jan', applications: 120 },
  { name: 'Feb', applications: 190 },
  { name: 'Mar', applications: 280 },
  { name: 'Apr', applications: 350 },
  { name: 'May', applications: 420 },
  { name: 'Jun', applications: 380 },
];

const statusData = [
  { name: 'Pending', value: 45, color: '#f59e0b' },
  { name: 'Reviewing', value: 30, color: '#3b82f6' },
  { name: 'Interviewed', value: 20, color: '#8b5cf6' },
  { name: 'Offered', value: 15, color: '#10b981' },
  { name: 'Rejected', value: 40, color: '#ef4444' },
];

export default function AdminDashboard({ user }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const sidebarItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard', active: activeView === 'dashboard', onClick: () => setActiveView('dashboard') },
    { icon: <Users className="h-5 w-5" />, label: 'Users', active: activeView === 'users', onClick: () => setActiveView('users') },
    { icon: <Briefcase className="h-5 w-5" />, label: 'Jobs', active: activeView === 'jobs', onClick: () => setActiveView('jobs'), badge: 12 },
    { icon: <FileText className="h-5 w-5" />, label: 'Applications', active: activeView === 'applications', onClick: () => setActiveView('applications'), badge: 45 },
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
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserCheck className="h-4 w-4 mr-2" />
              {row.status === 'active' ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
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
              value="1,284"
              icon={<Users className="h-6 w-6" />}
              color="blue"
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Active Jobs"
              value="47"
              icon={<Briefcase className="h-6 w-6" />}
              color="green"
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Total Applications"
              value="2,543"
              icon={<FileText className="h-6 w-6" />}
              color="purple"
              trend={{ value: 23, isPositive: true }}
            />
            <StatsCard
              title="System Health"
              value="98.5%"
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
                  <LineChart data={applicationStats}>
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
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
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
                {[
                  { action: 'User sarah.j@company.com created new job posting', time: '5 minutes ago', type: 'success' },
                  { action: 'Application #2543 submitted for Senior Developer', time: '15 minutes ago', type: 'info' },
                  { action: 'Failed login attempt from unknown IP', time: '1 hour ago', type: 'warning' },
                  { action: 'Database backup completed successfully', time: '2 hours ago', type: 'success' },
                ].map((log, index) => (
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

          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@company.com" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hr-manager">HR Manager</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">Create User</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={mockUsers}
                columns={userColumns}
                searchable
                searchPlaceholder="Search users..."
              />
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
                  <BarChart data={applicationStats}>
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
                  {[
                    { dept: 'Engineering', open: 12, hired: 8, color: 'bg-blue-500' },
                    { dept: 'Marketing', open: 5, hired: 3, color: 'bg-purple-500' },
                    { dept: 'Sales', open: 8, hired: 6, color: 'bg-green-500' },
                    { dept: 'HR', open: 2, hired: 1, color: 'bg-orange-500' },
                  ].map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                        <span>{dept.dept}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {dept.open} open • {dept.hired} hired
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
