import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Plus } from 'lucide-react';

export default function StaffAudits() {
  const [audits, setAudits] = useState([]);
  const [models, setModels] = useState([]);
  const [show, setShow] = useState(false);
const [form, setForm] = useState({ model_id: '', chatter_name: '', shift_date: '', notes: '', flags: '' });

  const load = () => {
    api('/audits').then(setAudits).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/audits', { method: 'POST', body: form });
    setShow(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Chatter Audits</h1>
          <p className="text-rose-600/60 text-sm">Review shifts and leave feedback</p>
        </div>
        <button onClick={() => setShow(!show)} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Log Audit</button>
      </div>

      {show && (
        <form onSubmit={create} className="card p-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Model (optional)</label>
            <select className="input" value={form.model_id} onChange={e => setForm({ ...form, model_id: e.target.value })}>
              <option value="">—</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.stage_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Chatter Name</label>
            <input className="input" value={form.chatter_name} onChange={e => setForm({ ...form, chatter_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Shift Date</label>
            <input className="input" type="date" value={form.shift_date} onChange={e => setForm({ ...form, shift_date: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Summary of Performance</label>
            <textarea className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn btn-primary">Save Audit</button>
            <button type="button" onClick={() => setShow(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-left text-xs text-rose-600/70 uppercase">
              <th className="p-4">Chatter</th>
              <th className="p-4">Model</th>
              <th className="p-4">Date</th>
              <th className="p-4">Notes</th>
              <th className="p-4">By</th>
            </tr>
          </thead>
          <tbody>
            {audits.map(a => (
              <tr key={a.id} className="border-b border-rose-50">
                <td className="p-4 font-medium">{a.chatter_name}</td>
                <td className="p-4">{a.model_name || '—'}</td>
                <td className="p-4">{a.shift_date || '—'}</td>
                <td className="p-4 text-rose-700 max-w-xs truncate">{a.notes}</td>
                <td className="p-4">{a.staff_name}</td>
              </tr>
            ))}
            {audits.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-rose-400">No audits logged</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
