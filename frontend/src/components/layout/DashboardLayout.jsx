import TopNav from './TopNav';
import Sidebar from './Sidebar';

export default function DashboardLayout({ 
  children, 
  user, 
  sidebarItems,
  theme = 'blue'
}) {
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
