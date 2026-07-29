import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function StaffVoice() {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    api('/voice-notes').then(setNotes).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Voice Notes</h1>
        <p className="text-rose-600/60 text-sm">Submitted by models</p>
      </div>
      <div className="space-y-3">
        {notes.map(n => (
          <div key={n.id} className="card p-5 flex justify-between items-center">
            <div>
              <div className="font-medium text-rose-900">{n.title}</div>
              <div className="text-sm text-rose-600/70">{n.model_name} · {n.status}</div>
              {n.notes && <p className="text-sm mt-1">{n.notes}</p>}
            </div>
            {n.file_path && (
              <audio controls src={n.file_path} className="h-10" />
            )}
          </div>
        ))}
        {notes.length === 0 && <div className="card p-10 text-center text-rose-400">No voice notes yet</div>}
      </div>
    </div>
  );
}
