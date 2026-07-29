import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, FolderOpen, Mic, FileText, LogOut, Radio
} from 'lucide-react';

const nav = [
  { to: '/model', icon: LayoutDashboard, label: 'My Dashboard', end: true },
  { to: '/model/requests', icon: ClipboardList, label: 'My Requests' },
  { to: '/model/content', icon: FolderOpen, label: 'Upload Content' },
  { to: '/model/voice', icon: Mic, label: 'Voice Notes' },
  { to: '/model/invoices', icon: FileText, label: 'Invoices' },
];

export default function ModelLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white/90 border-r border-rose-100 flex flex-col fixed h-full z-20">
        <div className="p-5 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold shadow-glow-pink">H</div>
            <div>
              <div className="font-semibold text-rose-900">House Of Her</div>
              <div className="text-xs text-rose-500">Creator Portal</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : 'text-rose-800/70 hover:bg-rose-50'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-rose-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center font-semibold">
              {user?.name?.charAt(0)}
            </div>
            <div className="text-sm">
              <div className="font-medium text-rose-900">{user?.name}</div>
              <div className="text-xs text-rose-500">Model</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary w-full text-sm flex items-center justify-center gap-2">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-56">
        <header className="h-14 border-b border-rose-100 bg-white/70 backdrop-blur sticky top-0 z-10 flex items-center px-8">
          <div className="text-sm text-rose-600/70 flex items-center gap-2">
            <Radio size={16} className="text-rose-500" /> Creator Dashboard
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
