import { ReactNode } from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  sidebarItems: Array<{
    icon: ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
  }>;
  theme?: 'blue' | 'purple' | 'green' | 'orange';
}

export default function DashboardLayout({ 
  children, 
  user, 
  sidebarItems,
  theme = 'blue'
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={sidebarItems} theme={theme} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav user={user} theme={theme} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
