import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { AdminDashboardData } from '../../types';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-on-surface-variant">Loading...</p>;
  if (!data) return <p className="text-error">Failed to load dashboard.</p>;

  const card = 'bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between';

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Library Overview</h1>
        <p className="text-sm text-on-surface-variant mt-1">High-level metrics and recent activities across all branches.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs tracking-wider font-medium text-on-surface-variant">Total Members</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <div className="font-bold text-4xl text-on-surface">{data.totalMembers.toLocaleString()}</div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs tracking-wider font-medium text-on-surface-variant">Total Catalog</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">library_books</span>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div>
              <div className="font-bold text-4xl text-on-surface">{data.totalBooks.toLocaleString()}</div>
              <div className="text-xs tracking-wider font-medium text-on-surface-variant mt-1">Books</div>
            </div>
            <div className="pb-1">
              <div className="font-semibold text-xl text-on-surface-variant">{data.totalCopies.toLocaleString()}</div>
              <div className="text-xs tracking-wider font-medium text-outline mt-1">Copies</div>
            </div>
          </div>
        </div>
        <div className="bg-error-container border border-error/20 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs tracking-wider font-medium text-on-error-container">Overdue Loans</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-lowest/50 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="font-bold text-4xl text-error">{data.overdueLoans}</div>
          {data.overdueLoans > 0 && <div className="mt-2 text-xs tracking-wider font-medium text-on-error-container">Requires immediate action</div>}
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs tracking-wider font-medium text-on-surface-variant">Outstanding Fines</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div className="font-bold text-4xl text-on-surface">GH₵ {Number(data.totalFinesOutstanding).toFixed(0)}</div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <h3 className="font-semibold text-xl text-on-surface mb-4">Books by Branch</h3>
            <ul className="space-y-2 text-xs tracking-wider font-medium text-on-surface-variant">
              {data.booksByBranch.map((b, i) => {
                const max = Math.max(...data.booksByBranch.map(x => Number(x.book_count)));
                const pct = max > 0 ? (Number(b.book_count) / max) * 100 : 0;
                return (
                  <li key={i} className="space-y-1">
                    <div className="flex justify-between"><span>{b.branch_name}</span><span>{b.book_count} books</span></div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: pct + '%' }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-2 bg-surface-container-lowest border border-surface-container-high rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-surface-container-high flex justify-between items-center bg-surface-bright">
            <h3 className="font-semibold text-xl text-on-surface">Recent Loan Activity</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-xs tracking-wider font-medium text-on-surface-variant border-b border-surface-container-high">
                  <th className="p-4 font-medium">Patron</th>
                  <th className="p-4 font-medium">KNUST ID</th>
                  <th className="p-4 font-medium">Book Title</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface">
                {data.recentLoans.map(loan => (
                  <tr key={loan.id} className="border-b border-surface-container-low hover:bg-surface-bright transition-colors">
                    <td className="p-4 font-medium">{loan.member_name}</td>
                    <td className="p-4 text-on-surface-variant font-mono text-sm">{loan.knust_id}</td>
                    <td className="p-4">{loan.title}</td>
                    <td className="p-4">
                      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                        (loan.status === 'overdue' ? 'bg-error-container text-error' :
                         loan.status === 'returned' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                         'bg-surface-container-high text-on-surface-variant')}>
                        <span className={'w-2 h-2 rounded-full mr-2 ' +
                          (loan.status === 'overdue' ? 'bg-error' : loan.status === 'returned' ? 'bg-tertiary' : 'bg-secondary')} />
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.recentLoans.length === 0 && <p className="p-6 text-sm text-on-surface-variant text-center">No recent activity.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
