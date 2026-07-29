import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Plus, CheckCircle2 } from 'lucide-react';

const statusClass = {
  pending: 'badge-pending',
  in_progress: 'badge-progress',
  completed: 'badge-done',
  cancelled: 'badge-pending'
};

export default function StaffRequests() {
  const [requests, setRequests] = useState([]);
  const [models, setModels] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ model_id: '', type: 'custom', title: '', details: '', client_name: '', price: '', priority: 'normal' });

  const load = () => {
    api('/requests').then(setRequests).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  };

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/requests', { method: 'POST', body: { ...form, price: Number(form.price) || 0 } });
    setShowForm(false);
    setForm({ model_id: '', type: 'custom', title: '', details: '', client_name: '', price: '', priority: 'normal' });
    load();
  };

  const setStatus = async (id, status) => {
    await api(`/requests/${id}/status`, { method: 'PATCH', body: { status } });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Requests & Customs</h1>
          <p className="text-rose-600/60 text-sm">Create and track custom & content requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Model</label>
              <select className="input" value={form.model_id} onChange={e => setForm({ ...form, model_id: e.target.value })} required>
                <option value="">Select model</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.stage_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="custom">Custom</option>
                <option value="content">Content</option>
                <option value="voice_note">Voice Note</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <label className="label">Client / Fan</label>
              <input className="input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input className="input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Details</label>
              <textarea className="input min-h-[80px]" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary">Create Request</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-left text-rose-600/70 text-xs uppercase tracking-wide">
              <th className="p-4">Model</th>
              <th className="p-4">Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Client</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b border-rose-50 hover:bg-rose-50/50">
                <td className="p-4 font-medium text-rose-900">{r.model_name}</td>
                <td className="p-4">{r.title}</td>
                <td className="p-4 capitalize">{r.type.replace('_', ' ')}</td>
                <td className="p-4">{r.client_name || '—'}</td>
                <td className="p-4">${r.price || 0}</td>
                <td className="p-4"><span className={`badge ${statusClass[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                <td className="p-4">
                  {r.status !== 'completed' && (
                    <button onClick={() => setStatus(r.id, 'completed')} className="btn btn-secondary text-xs flex items-center gap-1">
                      <CheckCircle2 size={14} /> Complete
                    </button>
                  )}
                  {r.status === 'pending' && (
                    <button onClick={() => setStatus(r.id, 'in_progress')} className="btn btn-secondary text-xs ml-2">Start</button>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-rose-400">No requests yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
