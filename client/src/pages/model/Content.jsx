import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Upload } from 'lucide-react';

export default function ModelContent() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', release_notes: '', scheduled_release: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => api('/content').then(setItems).catch(console.error);
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      await api('/content', { method: 'POST', body: fd });
      setForm({ title: '', description: '', release_notes: '', scheduled_release: '' });
      setFile(null);
      load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Upload Content</h1>
        <p className="text-rose-600/60 text-sm">Upload sets/videos with release notes & preferred date</p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Release Notes (when / how to post)</label>
          <textarea className="input" value={form.release_notes} onChange={e => setForm({ ...form, release_notes: e.target.value })} placeholder="e.g. Post Friday 8pm, caption style casual..." />
        </div>
        <div>
          <label className="label">Preferred Release Date/Time</label>
          <input className="input" type="datetime-local" value={form.scheduled_release} onChange={e => setForm({ ...form, scheduled_release: e.target.value })} />
        </div>
        <div>
          <label className="label">File (photo/video)</label>
          <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} className="text-sm" />
        </div>
        <button type="submit" disabled={uploading} className="btn btn-primary flex items-center gap-2">
          <Upload size={18} /> {uploading ? 'Uploading…' : 'Upload Content'}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold text-rose-900">My Uploads</h2>
        {items.map(c => (
          <div key={c.id} className="card p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{c.title}</div>
              <div className="text-xs text-rose-500">{c.status.replace('_', ' ')}</div>
            </div>
            {c.file_path && <a href={c.file_path} target="_blank" rel="noreferrer" className="text-xs text-pink-600 underline">View</a>}
          </div>
        ))}
      </div>
    </div>
  );
}
