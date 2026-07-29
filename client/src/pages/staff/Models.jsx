import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Plus, Radio, Trash2 } from 'lucide-react';

export default function StaffModels() {
  const [models, setModels] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ stage_name: '', real_name: '', platforms: 'OnlyFans', email: '', password: 'model123' });

  const load = () => api('/models').then(setModels).catch(console.error);
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api('/models', { method: 'POST', body: form });
    setShow(false);
    setForm({ stage_name: '', real_name: '', platforms: 'OnlyFans', email: '', password: 'model123' });
    load();
  };

  const toggleLive = async (id) => {
    await api(⁠ /models/${id}/live ⁠, { method: 'PATCH' });
    load();
  };

  const deleteModel = async (id, name) => {
    if (!confirm(⁠ Are you sure you want to permanently delete ${name}? This cannot be undone. ⁠)) return;
    await api(⁠ /models/${id} ⁠, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-rose-900 dark:text-rose-100">Models</h1>
          <p className="text-rose-600/60 dark:text-rose-300/60 text-sm">Manage creators & live status</p>
        </div>
        <button onClick={() => setShow(!show)} className="btn btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Model
        </button>
      </div>

      {show && (
        <form onSubmit={create} className="card p-6 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Stage Name</label>
            <input className="input" value={form.stage_name} onChange={e => setForm({ ...form, stage_name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Real Name</label>
            <input className="input" value={form.real_name} onChange={e => setForm({ ...form, real_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Platforms</label>
            <input className="input" value={form.platforms} onChange={e => setForm({ ...form, platforms: e.target.value })} />
          </div>
          <div>
            <label className="label">Login Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Temp Password</label>
            <input className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" className="btn btn-primary">Create Model + Login</button>
            <button type="button" onClick={() => setShow(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map(m => (
          <div key={m.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-lg text-rose-900 dark:text-rose-100">{m.stage_name}</div>
              {m.is_live ? <span className="badge badge-live">LIVE</span> : <span className="badge badge-pending">Offline</span>}
            </div>
            <p className="text-sm text-rose-600/70 dark:text-rose-300/70">{m.platforms}</p>
            {m.notes && <p className="text-xs text-rose-500 mt-2">{m.notes}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => toggleLive(m.id)} className={⁠ btn flex-1 text-sm flex items-center justify-center gap-2 ${m.is_live ? 'btn-secondary' : 'btn-live'} ⁠}>
                <Radio size={16} /> {m.is_live ? 'End Live' : 'Set Live'}
              </button>
              <button onClick={() => deleteModel(m.id, m.stage_name)} className="btn btn-danger text-sm flex items-center gap-1">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
