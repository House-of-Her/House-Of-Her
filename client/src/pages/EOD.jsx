import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function EOD() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    report_date: new Date().toISOString().slice(0, 10),
    shift_start: '',
    shift_end: '',
    models_worked: '',
    overall_earnings: '',
    earnings_breakdown: '',
    customs_updates: '',
    important_followups: '',
    problems_issues: '',
    other_notes: ''
  });

  const load = () => {
    setLoading(true);
    api.get('/eod')
      .then(r => setReports(r.data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/eod', {
        ...form,
        overall_earnings: parseFloat(form.overall_earnings) || 0
      });
      setShowForm(false);
      setForm({
        report_date: new Date().toISOString().slice(0, 10),
        shift_start: '',
        shift_end: '',
        models_worked: '',
        overall_earnings: '',
        earnings_breakdown: '',
        customs_updates: '',
        important_followups: '',
        problems_issues: '',
        other_notes: ''
      });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit');
    }
  };

  if (user?.role === 'model') {
    return <div className="p-8 text-center text-gray-500">Models cannot view EOD reports.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-700">EOD Reports</h1>
          <p className="text-sm text-gray-500">End of day handovers for the next chatter</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? 'Cancel' : '+ New EOD Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-pink-100 rounded-xl p-6 mb-8 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required value={form.report_date}
                onChange={e => setForm({...form, report_date: e.target.value})}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start</label>
              <input type="time" value={form.shift_start}
                onChange={e => setForm({...form, shift_start: e.target.value})}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift End</label>
              <input type="time" value={form.shift_end}
                onChange={e => setForm({...form, shift_end: e.target.value})}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Models Worked On</label>
            <input type="text" value={form.models_worked}
              onChange={e => setForm({...form, models_worked: e.target.value})}
              placeholder="e.g. Barbie, Luna"
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Earnings ($)</label>
              <input type="number" step="0.01" value={form.overall_earnings}
                onChange={e => setForm({...form, overall_earnings: e.target.value})}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Earnings Breakdown</label>
              <input type="text" value={form.earnings_breakdown}
                onChange={e => setForm({...form, earnings_breakdown: e.target.value})}
                placeholder="Barbie $120, Luna $80"
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customs Updates</label>
            <textarea rows={2} value={form.customs_updates}
              onChange={e => setForm({...form, customs_updates: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Important Follow-ups</label>
            <textarea rows={2} value={form.important_followups}
              onChange={e => setForm({...form, important_followups: e.target.value})}
              placeholder="Things the next chatter must know"
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problems / Issues</label>
            <textarea rows={2} value={form.problems_issues}
              onChange={e => setForm({...form, problems_issues: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Notes</label>
            <textarea rows={2} value={form.other_notes}
              onChange={e => setForm({...form, other_notes: e.target.value})}
              className="w-full border rounded-lg px-3 py-2" />
          </div>

          <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-medium">
            Submit EOD Report
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500">No EOD reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white border border-pink-100 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-pink-700">{r.chatter_name}</h3>
                  <p className="text-sm text-gray-500">{r.report_date} {r.shift_start && `• ${r.shift_start} - ${r.shift_end || '?'}`}</p>
                </div>
                <span className="text-lg font-bold text-green-600">${r.overall_earnings || 0}</span>
              </div>
              {r.models_worked && <p className="text-sm mb-1"><span className="font-medium">Models:</span> {r.models_worked}</p>}
              {r.earnings_breakdown && <p className="text-sm mb-1"><span className="font-medium">Breakdown:</span> {r.earnings_breakdown}</p>}
              {r.customs_updates && <p className="text-sm mb-1"><span className="font-medium">Customs:</span> {r.customs_updates}</p>}
              {r.important_followups && <p className="text-sm mb-1 bg-yellow-50 p-2 rounded"><span className="font-medium">Follow-ups:</span> {r.important_followups}</p>}
              {r.problems_issues && <p className="text-sm mb-1 text-red-600"><span className="font-medium">Issues:</span> {r.problems_issues}</p>}
              {r.other_notes && <p className="text-sm text-gray-600"><span className="font-medium">Notes:</span> {r.other_notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}