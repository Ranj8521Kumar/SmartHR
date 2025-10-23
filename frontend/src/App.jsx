import LandingPage from './components/landing/LandingPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HRManagerDashboard from './components/dashboards/HRManagerDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderDashboard = () => {
    if (!user || !user.role) return <AdminDashboard user={user} />;

    const userWithAvatar = {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`
    };

    // Map backend role names to dashboard components
    const role = user.role.toLowerCase();
    
    switch (role) {
      case 'admin':
        return <AdminDashboard user={userWithAvatar} />;
      case 'hr_recruiter':
      case 'hr-manager':
      case 'hr':
        return <HRManagerDashboard user={userWithAvatar} />;
      case 'manager':
        return <ManagerDashboard user={userWithAvatar} />;
      case 'employee':
        return <EmployeeDashboard user={userWithAvatar} />;
      default:
        return <EmployeeDashboard user={userWithAvatar} />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logout Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-white shadow-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {renderDashboard()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
