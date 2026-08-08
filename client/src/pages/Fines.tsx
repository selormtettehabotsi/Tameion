import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { FinesData } from '../types';
import Navbar from '../components/Navbar';

export default function Fines() {
  const [data, setData] = useState<FinesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.fines().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <h1 className="font-semibold text-2xl md:text-3xl text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">payments</span> My Fines
        </h1>
        {data && (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase">Outstanding Balance</p>
              <p className={'font-bold text-3xl mt-1 ' + (data.balance > 0 ? 'text-error' : 'text-primary')}>GH₵ {data.balance.toFixed(2)}</p>
            </div>
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">account_balance_wallet</span>
          </div>
        )}
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-highest">
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Book</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Days Overdue</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Rate/Day</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Amount</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
                ) : !data || data.transactions.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No fine transactions.</td></tr>
                ) : data.transactions.map(t => (
                  <tr key={t.id} className="hover:bg-surface-bright transition-colors">
                    <td className="p-4 font-medium text-on-surface">{t.title}</td>
                    <td className="p-4 text-on-surface-variant">{t.days_overdue}</td>
                    <td className="p-4 text-on-surface-variant">GH₵ {Number(t.rate_per_day).toFixed(2)}</td>
                    <td className="p-4 font-medium text-on-surface">GH₵ {Number(t.amount).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' + (t.settled ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[#991b1b]')}>
                        {t.settled ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
