import { useState } from 'react';
import LandingPage from './components/landing/LandingPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import HRManagerDashboard from './components/dashboards/HRManagerDashboard';
import ManagerDashboard from './components/dashboards/ManagerDashboard';
import EmployeeDashboard from './components/dashboards/EmployeeDashboard';
import { Button } from './components/ui/button';
import { LogOut } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [currentUser] = useState({
    name: 'John Doe',
    email: 'john.doe@company.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  });

  const handleLogin = (role) => {
    setCurrentRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentRole(null);
  };

  const renderDashboard = () => {
    if (!currentRole) return null;

    switch (currentRole) {
      case 'admin':
        return <AdminDashboard user={currentUser} />;
      case 'hr-manager':
        return <HRManagerDashboard user={currentUser} />;
      case 'manager':
        return <ManagerDashboard user={currentUser} />;
      case 'employee':
        return <EmployeeDashboard user={currentUser} />;
      default:
        return <AdminDashboard user={currentUser} />;
    }
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logout Button - Demo */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-white shadow-lg"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Back to Landing
        </Button>
      </div>

      {renderDashboard()}
    </div>
  );
}
