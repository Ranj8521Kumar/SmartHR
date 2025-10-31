import { Bell, Settings, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

const themeColors = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  green: 'bg-green-700',
  orange: 'bg-orange-600'
};

export default function TopNav({
  user,
  theme = 'blue',
  onMenuClick,
  onProfileClick,
  onSettingsClick,
  notifications = [],
  onNotificationClick,
  onViewAllNotifications,
  onMarkAllRead
}) {
  const { logout } = useAuth();
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Construct the full avatar URL - Cloudinary URLs are already full URLs
  // Add cache-busting parameter to force browser to fetch new image
  const userAvatar = user?.avatar && user.avatar !== 'default-avatar.png'
    ? `${user.avatar}${user.avatar.includes('?') ? '&' : '?'}t=${user?.updatedAt || Date.now()}` // Add timestamp to bust cache
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName || 'User'}`;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    // If a profile click handler is provided, use it
    // Otherwise, you could navigate to a profile page or open a profile modal
    if (onProfileClick) {
      onProfileClick();
    } else {
      // Default behavior - could be to navigate to profile page
      console.log('Profile clicked - implement profile navigation');
    }
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      console.log('Settings clicked - implement settings navigation');
    }
  };

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    }
    // Keep dropdown open so user can see all notifications are marked as read
  };

  const handleViewAll = () => {
    if (onViewAllNotifications) {
      onViewAllNotifications();
    }
    setNotificationDropdownOpen(false); // Close dropdown after clicking View All
  };

  const handleNotificationItemClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    setNotificationDropdownOpen(false); // Close dropdown after clicking a notification
  };

  return (
    <header className={`${themeColors[theme]} text-white shadow-md`}>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-white hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className={`${theme === 'blue' ? 'text-blue-600' : theme === 'purple' ? 'text-purple-600' : theme === 'green' ? 'text-green-700' : 'text-orange-600'}`}>
                HR
              </span>
            </div>
            <span className="hidden md:block">HRMS Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu open={notificationDropdownOpen} onOpenChange={setNotificationDropdownOpen}>
            <DropdownMenuTrigger className="relative inline-flex items-center justify-center h-10 w-10 rounded-md text-white hover:bg-white/10 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && onMarkAllRead && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-gray-600 hover:text-gray-700 font-normal"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && onViewAllNotifications && (
                    <button
                      onClick={handleViewAll}
                      className="text-xs text-blue-600 hover:text-blue-700 font-normal"
                    >
                      View All
                    </button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationItemClick(notification)}
                      className={`p-3 hover:bg-gray-100 cursor-pointer border-b ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 rounded-full p-1.5 ${
                          notification.type === 'success' ? 'bg-green-100' :
                          notification.type === 'error' ? 'bg-red-100' :
                          notification.type === 'warning' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {notification.type === 'success' && (
                            <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {notification.type === 'error' && (
                            <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          {notification.type === 'warning' && (
                            <svg className="h-3 w-3 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {notification.type === 'info' && (
                            <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white hover:bg-white/10 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={user?.name || 'User'} />
                <AvatarFallback>{user?.name?.charAt(0) || user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="hidden md:block">{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div>
                  <p>{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
