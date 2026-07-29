import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Plus } from 'lucide-react';

export default function StaffInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [models, setModels] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ model_id: '', amount: '', agency_cut: '', period_start: '', period_end: '', notes: '' });

  const load = () => {
    api('/invoices').then(setInvoices).catch(console.error);
    api('/models').then(setModels).catch(console.error);
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/invoices', { method: 'POST', body: { ...form, amount: Number(form.amount), agency_cut: Number(form.agency_cut) || 0 } });
    setShow(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Invoices</h1>
          <p className="text-rose-600/60 text-sm">Create and track model payouts</p>
        </div>
        <button onClick={() => setShow(!show)} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> New Invoice</button>
      </div>

      {show && (
        <form onSubmit={create} className="card p-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Model</label>
            <select className="input" value={form.model_id} onChange={e => setForm({ ...form, model_id: e.target.value })} required>
              <option value="">Select</option>
              {models.map(m => <option key={m.id} value={m.id}>{m.stage_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Gross Amount ($)</label>
            <input className="input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div>
            <label className="label">Agency Cut ($)</label>
            <input className="input" type="number" value={form.agency_cut} onChange={e => setForm({ ...form, agency_cut: e.target.value })} />
          </div>
          <div>
            <label className="label">Period Start</label>
            <input className="input" type="date" value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} />
          </div>
          <div>
            <label className="label">Period End</label>
            <input className="input" type="date" value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn btn-primary">Create & Send</button>
            <button type="button" onClick={() => setShow(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-left text-xs text-rose-600/70 uppercase">
              <th className="p-4">Model</th>
              <th className="p-4">Period</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Cut</th>
              <th className="p-4">Payout</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-rose-50">
                <td className="p-4 font-medium">{i.model_name}</td>
                <td className="p-4 text-xs">{i.period_start} → {i.period_end}</td>
                <td className="p-4">${i.amount}</td>
                <td className="p-4">${i.agency_cut}</td>
                <td className="p-4 font-semibold text-emerald-700">${i.model_payout}</td>
                <td className="p-4"><span className="badge badge-progress">{i.status}</span></td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-rose-400">No invoices</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
