import { useState } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import ProfileDialog from '../profile/ProfileDialog';

export default function DashboardLayout({ 
  children, 
  user, 
  sidebarItems,
  theme = 'blue',
  onSettingsClick,
  notifications = [],
  onNotificationClick,
  onViewAllNotifications,
  onMarkAllRead
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        items={sidebarItems} 
        theme={theme} 
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          user={user} 
          theme={theme}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onProfileClick={() => setIsProfileDialogOpen(true)}
          onSettingsClick={onSettingsClick}
          notifications={notifications}
          onNotificationClick={onNotificationClick}
          onViewAllNotifications={onViewAllNotifications}
          onMarkAllRead={onMarkAllRead}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Profile Dialog */}
      <ProfileDialog 
        isOpen={isProfileDialogOpen} 
        onClose={() => setIsProfileDialogOpen(false)} 
      />
    </div>
  );
}
