import { useEffect, useState } from 'react';
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
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('hoh_dark') === '1');
  const [toast, setToast] = useState(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('hoh_dark', dark ? '1' : '0');
  }, [dark]);

  // Real-time SSE
  useEffect(() => {
    const token = localStorage.getItem('hoh_token');
    if (!token) return;
    const es = new EventSource(`/api/events?token=${token}`); // note: simple; in prod pass via header or cookie
    // Because EventSource can't set Authorization easily, we use a simple poll fallback + manual
    // Better: use fetch stream or reconnect with query. For MVP we poll notifications.
    return () => es.close();
  }, []);

  // Poll notifications for unread count + toast on new live events
  useEffect(() => {
    const check = () => {
      fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('hoh_token')}` }
      }).then(r => r.json()).then(data => {
        const unreadCount = data.filter(n => !n.read).length;
        setUnread(unreadCount);
      }).catch(() => {});
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex bg-rose-50 dark:bg-gray-950">
      <aside className="w-60 bg-white/90 dark:bg-gray-900/95 border-r border-rose-100 dark:border-gray-800 flex flex-col fixed h-full z-20">
        <div className="p-5 border-b border-rose-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center font-bold shadow-glow-pink">H</div>
            <div>
              <div className="font-semibold text-rose-900 dark:text-rose-100">House Of Her</div>
              <div className="text-xs text-rose-500 dark:text-rose-400">Management</div>
            </div>
          </div>
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
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                    : 'text-rose-800/70 dark:text-rose-200/70 hover:bg-rose-50 dark:hover:bg-gray-800'
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
              {user?.name?.charAt(0)}
            </div>
            <div className="text-sm flex-1 min-w-0">
              <div className="font-medium text-rose-900 dark:text-rose-100 truncate">{user?.name}</div>
              <div className="text-xs text-rose-500 dark:text-rose-400 capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <header className="h-14 border-b border-rose-100 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6 md:px-8">
          <div className="text-sm text-rose-600/70 dark:text-rose-300/70">Agency Control Center</div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-gray-800 text-rose-600 dark:text-rose-300 relative">
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 border border-rose-200 dark:border-gray-700 shadow-xl rounded-2xl px-5 py-4 z-50 max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
