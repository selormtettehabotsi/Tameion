import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ReportsData } from '../../types';

function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-sm text-on-surface truncate font-medium">{label}</div>
      <div className="flex-1 bg-surface-container-high rounded-full h-5 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 text-sm text-on-surface-variant text-right">{sub ?? value}</div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-3 mb-2">
        <span className={`material-symbols-outlined text-[22px] ${color}`}>{icon}</span>
        <span className="text-xs tracking-wider font-medium text-on-surface-variant uppercase">{label}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminReports()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-on-surface-variant">Loading reports...</div>;
  if (!data) return <div className="text-error py-20 text-center">Failed to load reports.</div>;

  const totalFines = parseFloat(data.fineStats.total_fines);
  const collected = parseFloat(data.fineStats.collected);
  const outstanding = parseFloat(data.fineStats.outstanding);
  const totalLoans = parseInt(data.overdueRate.total) || 1;
  const overdueCount = parseInt(data.overdueRate.overdue_count);
  const overduePct = ((overdueCount / totalLoans) * 100).toFixed(1);

  const maxCheckouts = Math.max(...data.loansByMonth.map(m => parseInt(m.checkouts)), 1);
  const maxTopBook = Math.max(...data.topBooks.map(b => parseInt(b.borrow_count)), 1);
  const maxGenre = Math.max(...data.genreDistribution.map(g => parseInt(g.count)), 1);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Analytics</p>
        <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Reports</h1>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="payments" label="Total Fines" value={`GHS ${totalFines.toFixed(2)}`} color="text-error" />
        <StatCard icon="check_circle" label="Collected" value={`GHS ${collected.toFixed(2)}`} color="text-primary" />
        <StatCard icon="pending" label="Outstanding" value={`GHS ${outstanding.toFixed(2)}`} color="text-tertiary" />
        <StatCard icon="warning" label="Overdue Rate" value={`${overduePct}%`} color="text-error" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Activity */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="font-semibold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">trending_up</span> Loan Activity (12 months)
          </h2>
          <div className="space-y-2">
            {data.loansByMonth.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No loan data available.</p>
            ) : data.loansByMonth.map(m => (
              <Bar key={m.month} value={parseInt(m.checkouts)} max={maxCheckouts} label={m.month} sub={m.checkouts} />
            ))}
          </div>
        </section>

        {/* Top Borrowed Books */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="font-semibold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">star</span> Most Borrowed Books
          </h2>
          <div className="space-y-2">
            {data.topBooks.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No data available.</p>
            ) : data.topBooks.map((b, i) => (
              <Bar key={b.isbn} value={parseInt(b.borrow_count)} max={maxTopBook} label={`${i + 1}. ${b.title}`} sub={b.borrow_count} />
            ))}
          </div>
        </section>

        {/* Genre Distribution */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="font-semibold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">category</span> Genre Distribution
          </h2>
          <div className="space-y-2">
            {data.genreDistribution.map(g => (
              <Bar key={g.genre} value={parseInt(g.count)} max={maxGenre} label={g.genre} sub={g.count} />
            ))}
          </div>
        </section>

        {/* New Members */}
        <section className="bg-surface-container-lowest rounded-xl border border-surface-container-highest p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <h2 className="font-semibold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">group_add</span> New Members (12 months)
          </h2>
          <div className="space-y-2">
            {data.membersByMonth.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No data available.</p>
            ) : data.membersByMonth.map(m => (
              <Bar key={m.month} value={parseInt(m.count)} max={Math.max(...data.membersByMonth.map(x => parseInt(x.count)), 1)} label={m.month} sub={m.count} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
