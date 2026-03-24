import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';

export function BottomNav() {
  const navItems = [
    { to: '/dashboard', icon: 'home', label: 'Home' },
    { to: '/vault', icon: 'inventory_2', label: 'Vault' },
    { to: '/upload', icon: 'add', label: 'Upload', isPrimary: true },
    { to: '/timeline', icon: 'history', label: 'Timeline' },
    { to: '/settings', icon: 'settings', label: 'Settings' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex flex-col items-center gap-1 transition-colors',
              item.isPrimary 
                ? 'relative -top-8' 
                : 'text-slate-400 dark:text-slate-500 hover:text-primary',
              isActive && !item.isPrimary && 'text-primary'
            )}
          >
            {item.isPrimary ? (
              <div className="bg-primary text-white size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white dark:border-slate-900">
                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
