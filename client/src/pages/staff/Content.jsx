import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function StaffContent() {
  const [items, setItems] = useState([]);

  const load = () => api('/content').then(setItems).catch(console.error);
  useEffect(load, []);

  const setStatus = async (id, status) => {
    await api(`/content/${id}/status`, { method: 'PATCH', body: { status } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Content Review</h1>
        <p className="text-rose-600/60 text-sm">Approve or schedule content uploaded by models</p>
      </div>
      <div className="grid gap-4">
        {items.map(c => (
          <div key={c.id} className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-rose-900">{c.title}</div>
              <div className="text-sm text-rose-600/70 mt-1">{c.model_name} · {c.status.replace('_', ' ')}</div>
              {c.release_notes && <p className="text-sm text-rose-700 mt-2">{c.release_notes}</p>}
              {c.scheduled_release && <p className="text-xs text-rose-500 mt-1">Scheduled: {new Date(c.scheduled_release).toLocaleString()}</p>}
              {c.file_path && <a href={c.file_path} target="_blank" rel="noreferrer" className="text-xs text-pink-600 underline mt-1 inline-block">View file</a>}
            </div>
            <div className="flex gap-2">
              {c.status === 'pending_review' && (
                <>
                  <button onClick={() => setStatus(c.id, 'approved')} className="btn btn-primary text-sm">Approve</button>
                  <button onClick={() => setStatus(c.id, 'rejected')} className="btn btn-danger text-sm">Reject</button>
                </>
              )}
              {c.status === 'approved' && (
                <button onClick={() => setStatus(c.id, 'scheduled')} className="btn btn-secondary text-sm">Mark Scheduled</button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="card p-10 text-center text-rose-400">No content uploads yet</div>}
      </div>
    </div>
  );
}
