import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function ModelInvoices() {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    api('/invoices').then(setInvoices).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-rose-900">My Invoices</h1>
        <p className="text-rose-600/60 text-sm">Payouts and statements</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rose-100 text-left text-xs text-rose-600/70 uppercase">
              <th className="p-4">Period</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Agency Cut</th>
              <th className="p-4">Your Payout</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id} className="border-b border-rose-50">
                <td className="p-4">{i.period_start} → {i.period_end}</td>
                <td className="p-4">${i.amount}</td>
                <td className="p-4">${i.agency_cut}</td>
                <td className="p-4 font-semibold text-emerald-700">${i.model_payout}</td>
                <td className="p-4"><span className="badge badge-progress">{i.status}</span></td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-rose-400">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
