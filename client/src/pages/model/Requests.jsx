import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CheckCircle2 } from 'lucide-react';

export default function ModelRequests() {
  const [requests, setRequests] = useState([]);
  const load = () => api('/requests').then(setRequests).catch(console.error);
  useEffect(load, []);

  const complete = async (id) => {
    await api(`/requests/${id}/status`, { method: 'PATCH', body: { status: 'completed' } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">My Requests</h1>
        <p className="text-rose-600/60 text-sm">Customs, content & voice note requests assigned to you</p>
      </div>
      <div className="space-y-3">
        {requests.map(r => (
          <div key={r.id} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-rose-900">{r.title}</div>
                <div className="text-sm text-rose-600/70 mt-1 capitalize">{r.type.replace('_', ' ')} · {r.status.replace('_', ' ')}</div>
                {r.client_name && <div className="text-sm text-rose-700 mt-1">Client: {r.client_name}</div>}
                {r.details && <p className="text-sm text-rose-800 mt-2 bg-rose-50 p-3 rounded-xl">{r.details}</p>}
                {r.price > 0 && <div className="text-sm font-medium text-emerald-700 mt-2">${r.price}</div>}
              </div>
              {r.status !== 'completed' && r.status !== 'cancelled' && (
                <button onClick={() => complete(r.id)} className="btn btn-primary text-sm flex items-center gap-1 whitespace-nowrap">
                  <CheckCircle2 size={16} /> Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {requests.length === 0 && <div className="card p-10 text-center text-rose-400">No requests assigned yet</div>}
      </div>
    </div>
  );
}
