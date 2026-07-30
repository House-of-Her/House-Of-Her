import { useEffect, useState, Component } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, FolderOpen, Mic, FileText,
  Users, ShieldCheck, LogOut, Bell, Clock, CalendarDays, Moon, Sun
} from 'lucide-react';

const nav = [
  { to: '/staff', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/staff/shifts', icon: Clock, label: 'Shifts' },
  { to: '/staff/requests', icon: ClipboardList, label: 'Requests' },
  { to: '/staff/content', icon: FolderOpen, label: 'Content' },
  { to: '/staff/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/staff/voice', icon: Mic, label: 'Voice Notes' },
  { to: '/staff/audits', icon: ShieldCheck, label: 'Chatter Audits' },
  { to: '/staff/invoices', icon: FileText, label: 'Invoices' },
  { to: '/staff/models', icon: Users, label: 'Models' },
  { to: '/staff/eod', icon: FileText, label: 'EOD Report' },
];

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-xl font-semibold text-rose-700 mb-2">Something went wrong</h2>
          <p className="text-rose-500 mb-4">This page had a problem. Try going back to Overview.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg"
          >
            Go to Overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('hoh_dark') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('hoh_dark', dark ? '1' : '0');
  }, [dark]);

  return (
    <div className="min-h-screen flex bg-rose-50 dark:bg-gray-950">
      <aside className="w-60 bg-white/90 dark:bg-gray-900/95 border-r border-rose-100 dark:border-gray-800 flex flex-col fixed h-full z-20">
        <div className="p-5 border-b border-rose-100 dark:border-gray-800">
          <div className="text-lg font-bold text-rose-700 dark:text-rose-300">House Of Her</div>
          <div className="text-xs text-rose-500/70">Agency OS</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                    : 'text-rose-700/80 hover:bg-rose-50 dark:text-rose-300/80 dark:hover:bg-gray-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-rose-100 dark:border-gray-800 space-y-3">
          <button
            onClick={() => setDark(d => !d)}
            className="w-full flex items-center justify-center gap-2 text-sm text-rose-600 dark:text-rose-300 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-gray-800"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-semibold">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="text-sm flex-1 min-w-0">
              <div className="font-medium text-rose-900 dark:text-rose-100 truncate">{user?.name}</div>
              <div className="text-xs text-rose-500 dark:text-rose-400 capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 text-sm text-rose-600 dark:text-rose-300 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-gray-800 border border-rose-100 dark:border-gray-700"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <header className="h-14 border-b border-rose-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6 md:px-8">
          <div className="text-sm text-rose-600/70 dark:text-rose-300/70">Agency Control Center</div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-800 text-rose-600 dark:text-rose-300">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}