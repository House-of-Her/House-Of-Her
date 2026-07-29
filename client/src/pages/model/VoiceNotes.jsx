import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import { Mic, Square, Upload } from 'lucide-react';

export default function ModelVoice() {
  const [notes, setNotes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [title, setTitle] = useState('');
  const [requestId, setRequestId] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);

  const load = () => {
    api('/voice-notes').then(setNotes).catch(console.error);
    api('/requests').then(r => setRequests(r.filter(x => x.type === 'voice_note' && x.status !== 'completed'))).catch(console.error);
  };
  useEffect(load, []);

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    chunks.current = [];
    mediaRecorder.current.ondataavailable = e => chunks.current.push(e.data);
    mediaRecorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRec = () => {
    mediaRecorder.current?.stop();
    setRecording(false);
  };

  const submit = async () => {
    if (!audioBlob && !title) return;
    const fd = new FormData();
    fd.append('title', title || 'Voice note');
    if (requestId) fd.append('request_id', requestId);
    if (audioBlob) fd.append('audio', audioBlob, 'voice.webm');
    await api('/voice-notes', { method: 'POST', body: fd });
    setAudioBlob(null);
    setTitle('');
    setRequestId('');
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">Voice Notes</h1>
        <p className="text-rose-600/60 text-sm">Record and submit voice notes for fans</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Link to Request (optional)</label>
          <select className="input" value={requestId} onChange={e => setRequestId(e.target.value)}>
            <option value="">None</option>
            {requests.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Birthday message for Mike" />
        </div>

        <div className="flex items-center gap-4">
          {!recording ? (
            <button onClick={startRec} className="btn btn-live flex items-center gap-2">
              <Mic size={18} /> Start Recording
            </button>
          ) : (
            <button onClick={stopRec} className="btn btn-secondary flex items-center gap-2">
              <Square size={18} /> Stop
            </button>
          )}
          {audioBlob && (
            <>
              <audio controls src={URL.createObjectURL(audioBlob)} className="h-10" />
              <button onClick={submit} className="btn btn-primary flex items-center gap-2">
                <Upload size={18} /> Submit Voice Note
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-rose-900">Submitted</h2>
        {notes.map(n => (
          <div key={n.id} className="card p-4 flex justify-between items-center">
            <div>
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-rose-500">{n.status}</div>
            </div>
            {n.file_path && <audio controls src={n.file_path} className="h-9" />}
          </div>
        ))}
      </div>
    </div>
  );
}
