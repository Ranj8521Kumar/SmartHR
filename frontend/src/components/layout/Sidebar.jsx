import { cn } from '../ui/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const themeColors = {
  blue: {
    bg: 'bg-blue-900',
    active: 'bg-blue-700',
    hover: 'hover:bg-blue-800'
  },
  purple: {
    bg: 'bg-purple-900',
    active: 'bg-purple-700',
    hover: 'hover:bg-purple-800'
  },
  green: {
    bg: 'bg-green-900',
    active: 'bg-green-700',
    hover: 'hover:bg-green-800'
  },
  orange: {
    bg: 'bg-orange-900',
    active: 'bg-orange-700',
    hover: 'hover:bg-orange-800'
  }
};

export default function Sidebar({ items, theme = 'blue', isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
  const colors = themeColors[theme];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          `${colors.bg} text-white flex-shrink-0 transition-all duration-300 flex flex-col`,
          // Desktop styles
          'lg:relative',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile styles - overlay sidebar
          'fixed inset-y-0 left-0 z-50 w-64 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white border-opacity-20">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={onMobileClose}
            className="inline-flex items-center justify-center h-10 w-10 rounded-md text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              // Close mobile sidebar when an item is clicked
              if (isMobileOpen) {
                onMobileClose();
              }
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group',
              colors.hover,
              item.active ? colors.active : ''
            )}
            title={isCollapsed ? item.label : ''}
          >
            <div className="flex-shrink-0">
              {item.icon}
            </div>
            {/* Show labels on mobile, hide on desktop when collapsed */}
            <span className={cn(
              'flex-1 text-left',
              'lg:hidden', // Always show on mobile
              !isCollapsed && 'lg:block' // Show on desktop when not collapsed
            )}>
              {item.label}
            </span>
            {/* Show badges on mobile, conditional on desktop */}
            {item.badge && (
              <>
                <span className={cn(
                  'bg-red-500 text-white text-xs px-2 py-1 rounded-full',
                  'lg:hidden', // Always show on mobile
                  !isCollapsed && 'lg:inline-flex' // Show on desktop when not collapsed
                )}>
                  {item.badge}
                </span>
                {isCollapsed && (
                  <span className="hidden lg:flex absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Toggle Button at Bottom - Desktop Only */}
      <div className="hidden lg:block p-4 border-t border-white border-opacity-20">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors bg-white bg-opacity-10 hover:bg-opacity-20',
            colors.hover
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
