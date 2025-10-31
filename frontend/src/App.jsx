import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HRManagerDashboard from './components/dashboards/HRManagerDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import AIInterviewPage from './components/interviews/AIInterviewPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import OAuthCallback from './components/auth/OAuthCallback';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      // Show logout toast first
      toast.success('Logged out successfully!');
      
      // Small delay to ensure toast is visible before redirect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const renderDashboard = () => {
    if (!user || !user.role) return <AdminDashboard user={user} />;

    const userWithAvatar = {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar
        ? `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${user.updatedAt || Date.now()}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      <HotToaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* Logout Button - only show when authenticated */}
      {isAuthenticated && (
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
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/ai-interview/:link" element={<AIInterviewPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/oauth-callback" element={<OAuthCallback />} />

        {/* Authenticated routes */}
        {isAuthenticated ? (
          <Route path="/" element={renderDashboard()} />
        ) : (
          <Route path="/" element={<LandingPage />} />
        )}
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
