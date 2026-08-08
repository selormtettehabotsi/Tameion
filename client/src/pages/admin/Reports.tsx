import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ReportsData } from '../../types';
import StatCard from '../../components/StatCard';
import Icon, { type IconName } from '../../components/Icon';
import { Alert, Card } from '../../components/ui';

function Bar({ value, max, label, sub }: { value: number; max: number; label: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-sm">
      <div className="w-32 shrink-0 truncate text-xs font-semibold text-on-surface sm:w-40">{label}</div>
      <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary transition-all duration-normal" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 shrink-0 text-right text-2xs text-on-surface-variant">{sub ?? value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-md flex items-center gap-xs text-base font-semibold text-on-surface">
        <span className="text-primary"><Icon name={icon} size={18} /></span>
        {title}
      </h2>
      <div className="space-y-xs">{children}</div>
    </Card>
  );
}

export default function Reports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.adminReports()
      .then(r => setData(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (failed) return <Alert tone="danger" title="Could not load reports">Refresh the page to try again.</Alert>;

  if (loading || !data) {
    return (
      <div>
        <div className="mb-lg h-10 w-56 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="grid grid-cols-2 gap-md lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-container-high" />
          ))}
        </div>
      </div>
    );
  }

  const totalFines = parseFloat(data.fineStats.total_fines);
  const collected = parseFloat(data.fineStats.collected);
  const outstanding = parseFloat(data.fineStats.outstanding);
  const totalLoans = parseInt(data.overdueRate.total) || 1;
  const overdueCount = parseInt(data.overdueRate.overdue_count);
  const overduePct = ((overdueCount / totalLoans) * 100).toFixed(1);

  const maxCheckouts = Math.max(...data.loansByMonth.map(m => parseInt(m.checkouts)), 1);
  const maxTopBook = Math.max(...data.topBooks.map(b => parseInt(b.borrow_count)), 1);
  const maxGenre = Math.max(...data.genreDistribution.map(g => parseInt(g.count)), 1);
  const maxMembers = Math.max(...data.membersByMonth.map(m => parseInt(m.count)), 1);

  const none = <p className="text-xs text-on-surface-variant">No data yet.</p>;

  return (
    <div>
      <header className="mb-lg">
        <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Analytics</p>
        <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Reports</h1>
        <p className="mt-2xs text-sm text-on-surface-variant">Circulation and revenue trends over the last 12 months.</p>
      </header>

      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total fines" value={`GH₵ ${totalFines.toFixed(2)}`} icon="banknote" />
        <StatCard label="Collected" value={`GH₵ ${collected.toFixed(2)}`} icon="circle-check" tone="success" />
        <StatCard label="Outstanding" value={`GH₵ ${outstanding.toFixed(2)}`} icon="wallet" tone="warning" />
        <StatCard label="Overdue rate" value={`${overduePct}%`} icon="triangle-alert" tone={Number(overduePct) > 10 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Panel title="Loan activity (12 months)" icon="trending-up">
          {data.loansByMonth.length === 0 ? none : data.loansByMonth.map(m => (
            <Bar key={m.month} value={parseInt(m.checkouts)} max={maxCheckouts} label={m.month} sub={m.checkouts} />
          ))}
        </Panel>

        <Panel title="Most borrowed" icon="star">
          {data.topBooks.length === 0 ? none : data.topBooks.map((b, i) => (
            <Bar key={b.isbn} value={parseInt(b.borrow_count)} max={maxTopBook} label={`${i + 1}. ${b.title}`} sub={b.borrow_count} />
          ))}
        </Panel>

        <Panel title="Genre distribution" icon="tag">
          {data.genreDistribution.length === 0 ? none : data.genreDistribution.map(g => (
            <Bar key={g.genre} value={parseInt(g.count)} max={maxGenre} label={g.genre} sub={g.count} />
          ))}
        </Panel>

        <Panel title="New members (12 months)" icon="user-plus">
          {data.membersByMonth.length === 0 ? none : data.membersByMonth.map(m => (
            <Bar key={m.month} value={parseInt(m.count)} max={maxMembers} label={m.month} sub={m.count} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
