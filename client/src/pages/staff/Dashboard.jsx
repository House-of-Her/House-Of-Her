import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Users, Radio, ClipboardList, FolderOpen, ShieldCheck, Activity } from 'lucide-react';

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [models, setModels] = useState([]);

  useEffect(() => {
    api('/stats').then(setStats).catch(console.error);
    api('/activity').then(setActivity).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Models', value: stats?.total_models ?? '—', icon: Users, color: 'from-pink-500 to-rose-500' },
    { label: 'Live Now', value: stats?.live_now ?? '—', icon: Radio, color: 'from-rose-500 to-red-500' },
    { label: 'Open Requests', value: stats?.pending_requests ?? '—', icon: ClipboardList, color: 'from-pink-400 to-pink-600' },
    { label: 'Pending Content', value: stats?.pending_content ?? '—', icon: FolderOpen, color: 'from-rose-400 to-rose-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Overview</h1>
        <p className="text-rose-600/60 text-sm mt-1">House Of Her control center</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card p-5 flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center shadow-sm`}>
              <c.icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-rose-900">{c.value}</div>
              <div className="text-xs text-rose-600/60 uppercase tracking-wide">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-rose-900 mb-4 flex items-center gap-2">
            <Radio size={18} className="text-rose-500" /> Live Models
          </h2>
          <div className="space-y-3">
            {models.filter(m => m.is_live).length === 0 && (
              <p className="text-sm text-rose-500/60">No models currently live</p>
            )}
            {models.filter(m => m.is_live).map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-medium text-rose-900">{m.stage_name}</span>
                </div>
                <span className="badge badge-live">LIVE</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-rose-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" /> Recent Activity
          </h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {activity.length === 0 && <p className="text-sm text-rose-500/60">No activity yet</p>}
            {activity.slice(0, 12).map(a => (
              <div key={a.id} className="text-sm flex gap-3 py-2 border-b border-rose-50 last:border-0">
                <span className="text-rose-400 text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-rose-800"><strong>{a.actor_name}</strong> — {a.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
