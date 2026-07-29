import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { LogIn, LogOut, Clock } from 'lucide-react';

export default function StaffShifts() {
  const [shifts, setShifts] = useState([]);
  const [active, setActive] = useState(null);
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    api('/shifts').then(setShifts).catch(console.error);
    api('/shifts/active').then(setActive).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  };
  useEffect(load, []);

  const start = async () => {
    setLoading(true);
    try {
      await api('/shifts/start', { method: 'POST', body: { model_id: modelId || null, notes } });
      setNotes('');
      load();
    } finally {
      setLoading(false);
    }
  };

  const end = async () => {
    setLoading(true);
    try {
      await api('/shifts/end', { method: 'POST' });
      load();
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start, end) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date();
    const mins = Math.round((e - s) / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900 dark:text-rose-100">Shift Control</h1>
        <p className="text-rose-600/60 dark:text-rose-300/60 text-sm">Sign in / out of your chatting shift</p>
      </div>

      <div className={`card p-6 border-2 ${active ? 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-900/20' : 'border-rose-200 dark:border-rose-800'}`}>
        {active ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-lg text-rose-900 dark:text-rose-100 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                You are ON SHIFT
              </div>
              <p className="text-sm text-rose-600/70 dark:text-rose-300/70 mt-1">
                Started {new Date(active.started_at).toLocaleString()} · {formatDuration(active.started_at)}
              </p>
            </div>
            <button onClick={end} disabled={loading} className="btn btn-secondary flex items-center gap-2">
              <LogOut size={18} /> Sign Out of Shift
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="font-semibold text-lg text-rose-900 dark:text-rose-100">Start your shift</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Primary Model (optional)</label>
                <select className="input" value={modelId} onChange={e => setModelId(e.target.value)}>
                  <option value="">Any / General</option>
                  {models.map(m => <option key={m.id} value={m.id}>{m.stage_name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. covering evening for Barbie" />
              </div>
            </div>
            <button onClick={start} disabled={loading} className="btn btn-primary flex items-center gap-2">
              <LogIn size={18} /> Sign In to Shift
            </button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-rose-100 dark:border-rose-800 font-medium text-rose-900 dark:text-rose-100 flex items-center gap-2">
          <Clock size={18} /> Recent Shifts
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 dark:border-rose-800 text-left text-xs text-rose-600/70 uppercase">
              <th className="p-4">Staff</th>
              <th className="p-4">Model</th>
              <th className="p-4">Started</th>
              <th className="p-4">Ended</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map(s => (
              <tr key={s.id} className="border-b border-rose-50 dark:border-rose-900/50">
                <td className="p-4 font-medium">{s.staff_name}</td>
                <td className="p-4">{s.model_name || '—'}</td>
                <td className="p-4 text-xs">{new Date(s.started_at).toLocaleString()}</td>
                <td className="p-4 text-xs">{s.ended_at ? new Date(s.ended_at).toLocaleString() : '—'}</td>
                <td className="p-4">{formatDuration(s.started_at, s.ended_at)}</td>
                <td className="p-4">
                  <span className={`badge ${s.status === 'active' ? 'badge-live' : 'badge-done'}`}>{s.status}</span>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-rose-400">No shifts yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
