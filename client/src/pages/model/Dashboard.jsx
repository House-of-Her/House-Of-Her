import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Radio, ClipboardList, FolderOpen, CheckCircle } from 'lucide-react';

export default function ModelDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [models, setModels] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);

  const load = () => {
    api('/stats').then(setStats).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  };
  useEffect(load, []);

  const myModel = models.find(m => m.id === user?.model_id);
  const isLive = myModel?.is_live || stats?.is_live;

  const toggleLive = async () => {
    if (!user?.model_id) return;
    setLiveLoading(true);
    try {
      await api(`/models/${user.model_id}/live`, { method: 'PATCH' });
      load();
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Hey {user?.name} 👋</h1>
        <p className="text-rose-600/60 text-sm mt-1">Your House Of Her creator dashboard</p>
      </div>

      {/* Go Live */}
      <div className={`card p-6 border-2 ${isLive ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg text-rose-900 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isLive ? 'You are LIVE' : 'Go Live'}
            </h2>
            <p className="text-sm text-rose-600/70 mt-1">
              {isLive ? 'Chatters have been notified you are live.' : 'Tap to notify the team you are going live.'}
            </p>
          </div>
          <button
            onClick={toggleLive}
            disabled={liveLoading}
            className={`btn px-8 py-3 text-base ${isLive ? 'btn-secondary' : 'btn-live'}`}
          >
            <Radio size={18} className="inline mr-2" />
            {liveLoading ? 'Updating…' : isLive ? 'End Live Session' : 'I\'m Going Live'}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <ClipboardList className="mx-auto text-pink-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-rose-900">{stats?.pending_requests ?? '—'}</div>
          <div className="text-xs text-rose-600/60 uppercase">Open Requests</div>
        </div>
        <div className="card p-5 text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-rose-900">{stats?.completed_requests ?? '—'}</div>
          <div className="text-xs text-rose-600/60 uppercase">Completed</div>
        </div>
        <div className="card p-5 text-center">
          <FolderOpen className="mx-auto text-rose-500 mb-2" size={24} />
          <div className="text-2xl font-bold text-rose-900">{stats?.content_count ?? '—'}</div>
          <div className="text-xs text-rose-600/60 uppercase">Content Uploaded</div>
        </div>
      </div>
    </div>
  );
}
