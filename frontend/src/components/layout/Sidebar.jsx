import { cn } from '../ui/utils';

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

export default function Sidebar({ items, theme = 'blue' }) {
  const colors = themeColors[theme];

  return (
    <aside className={`${colors.bg} text-white w-64 flex-shrink-0 hidden lg:block`}>
      <nav className="p-4 space-y-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              colors.hover,
              item.active ? colors.active : ''
            )}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
