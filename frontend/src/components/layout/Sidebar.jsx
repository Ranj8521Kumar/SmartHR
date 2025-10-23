import { cn } from '../ui/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function Sidebar({ items, theme = 'blue', isCollapsed, onToggle }) {
  const colors = themeColors[theme];

  return (
    <aside 
      className={cn(
        `${colors.bg} text-white flex-shrink-0 hidden lg:block transition-all duration-300 relative flex flex-col`,
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <nav className="p-4 space-y-2 flex-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
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
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Toggle Button at Bottom */}
      <div className="p-4 border-t border-white border-opacity-20">
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
  );
}
