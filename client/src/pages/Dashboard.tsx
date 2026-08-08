import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { DashboardData } from '../types';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20 text-on-surface-variant">Loading...</div></div>;
  if (!data) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20 text-error">Failed to load dashboard.</div></div>;

  const card = 'bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between';
  const stats = [
    { label: 'Total Borrowed', value: data.stats.totalBorrowed, icon: 'menu_book', color: 'text-outline' },
    { label: 'Currently on Loan', value: data.stats.currentlyOnLoan, icon: 'schedule', color: 'text-secondary' },
    { label: 'Overdue', value: data.stats.overdueCount, icon: 'error', color: 'text-error' },
    { label: 'Fine Balance', value: 'GH₵ ' + (data.fineBalance ?? 0).toFixed(2), icon: 'payments', color: 'text-on-surface-variant' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <header className="mb-8">
          <h1 className="font-semibold text-2xl md:text-4xl text-on-background mb-2">Welcome back.</h1>
          <p className="text-base text-on-surface-variant">Here is your current library status and recent activity.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(s => (
            <div key={s.label} className={card}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs tracking-wider font-medium text-on-surface-variant uppercase">{s.label}</span>
                <span className={'material-symbols-outlined ' + s.color}>{s.icon}</span>
              </div>
              <div className={'font-bold text-4xl ' + (s.label === 'Overdue' && data.stats.overdueCount > 0 ? 'text-error' : 'text-on-background')}>
                {s.value}
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <h2 className="font-semibold text-xl text-on-background mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">library_books</span> Active Loans
            </h2>
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-container-highest">
                    <th className="p-4 text-xs tracking-wider font-semibold text-on-surface-variant">Book Title</th>
                    <th className="p-4 text-xs tracking-wider font-semibold text-on-surface-variant">Due Date</th>
                    <th className="p-4 text-xs tracking-wider font-semibold text-on-surface-variant">Status</th>
                    <th className="p-4 text-xs tracking-wider font-semibold text-on-surface-variant text-right">Days Remaining</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.activeLoans.map(loan => (
                    <tr key={loan.id} className="border-b border-surface-container-highest hover:bg-surface-bright transition-colors">
                      <td className="p-4 text-on-background font-medium">{loan.title}</td>
                      <td className="p-4 text-on-surface-variant">{new Date(loan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="p-4">
                        <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                          (loan.status === 'overdue' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#dcfce7] text-[#166534]')}>
                          {loan.status === 'overdue' ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className={'p-4 text-right ' + (loan.status === 'overdue' ? 'text-error font-semibold' : 'text-on-surface-variant')}>
                        {loan.days_remaining != null ? (loan.days_remaining < 0 ? loan.days_remaining : loan.days_remaining) + ' Days' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.activeLoans.length === 0 && <p className="p-6 text-sm text-on-surface-variant text-center">No active loans.</p>}
            </div>
          </section>

          <aside className="lg:col-span-1">
            <h2 className="font-semibold text-xl text-on-background mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined">bookmarks</span> Pending Reservations
            </h2>
            <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
              {data.pendingReservations.length === 0 ? (
                <p className="p-6 text-sm text-on-surface-variant text-center">No pending reservations.</p>
              ) : (
                data.pendingReservations.map((r, i) => (
                  <div key={r.id} className={'p-4 hover:bg-surface-bright transition-colors cursor-default' + (i < data.pendingReservations.length - 1 ? ' border-b border-surface-container-highest' : '')}>
                    <h3 className="font-semibold text-base text-on-background">{r.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">Expires {new Date(r.expiry_date).toLocaleDateString()}</p>
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant mt-2">
                      <span className="material-symbols-outlined text-xs">info</span>
                      <span>Status: {r.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
