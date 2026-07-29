import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CalendarDays } from 'lucide-react';

export default function StaffCalendar() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api('/calendar').then(setItems).catch(console.error);
  }, []);

  // Group by date
  const byDate = {};
  items.forEach(item => {
    if (!item.scheduled_release) return;
    const d = item.scheduled_release.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(item);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900 dark:text-rose-100 flex items-center gap-2">
          <CalendarDays size={24} /> Content Calendar
        </h1>
        <p className="text-rose-600/60 dark:text-rose-300/60 text-sm">Scheduled releases from model uploads</p>
      </div>

      {dates.length === 0 && (
        <div className="card p-10 text-center text-rose-400">No scheduled content yet. Models can set a preferred release date when uploading.</div>
      )}

      <div className="space-y-6">
        {dates.map(date => (
          <div key={date}>
            <h2 className="font-semibold text-rose-800 dark:text-rose-200 mb-3">
              {new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <div className="space-y-2">
              {byDate[date].map(item => (
                <div key={item.id} className="card p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-rose-900 dark:text-rose-100">{item.title}</div>
                    <div className="text-sm text-rose-600/70 dark:text-rose-300/70">
                      {item.model_name} · {new Date(item.scheduled_release).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.status}
                    </div>
                  </div>
                  <span className={`badge ${item.status === 'scheduled' || item.status === 'approved' ? 'badge-progress' : 'badge-pending'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
