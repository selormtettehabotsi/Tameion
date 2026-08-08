import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { AdminDashboardData } from '../../types';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { Alert, Badge, Button, Card, CardHeader, loanTone } from '../../components/ui';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.adminDashboard()
      .then(r => setData(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (failed) {
    return <Alert tone="danger" title="Could not load the dashboard">Refresh the page to try again.</Alert>;
  }

  const overdue = data?.overdueLoans ?? 0;
  const maxBranch = Math.max(1, ...(data?.booksByBranch ?? []).map(b => Number(b.book_count)));

  return (
    <div>
      <header className="mb-lg">
        <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Overview</p>
        <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Library at a glance</h1>
        <p className="mt-2xs text-sm text-on-surface-variant">
          Live circulation, catalogue and membership figures across every branch.
        </p>
      </header>

      {overdue > 0 && (
        <div className="mb-lg">
          <Alert
            tone="danger"
            title={`${overdue} overdue ${overdue === 1 ? 'loan needs' : 'loans need'} chasing`}
            action={
              <Link to="/admin/loans" className="shrink-0">
                <Button variant="secondary" size="sm">Open loans desk</Button>
              </Link>
            }
          >
            Overdue items continue to accrue fines at GH₵ 1.00 per day.
          </Alert>
        </div>
      )}

      <section className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total books" value={loading ? 0 : data!.totalBooks.toLocaleString()} icon="book-open" loading={loading}
          hint={data ? `${data.totalCopies.toLocaleString()} copies on shelf` : undefined} />
        <StatCard label="Borrowed now" value={loading ? 0 : data!.activeLoans.toLocaleString()} icon="calendar" tone="info" loading={loading}
          hint={data ? `${data.pendingReservations} holds pending` : undefined} />
        <StatCard label="Overdue" value={overdue} icon="triangle-alert" tone={overdue > 0 ? 'danger' : 'success'} loading={loading}
          hint={overdue > 0 ? 'Requires action' : 'All clear'} />
        <StatCard label="Active members" value={loading ? 0 : data!.activeMembers.toLocaleString()} icon="users" tone="success" loading={loading}
          hint={data ? `${data.totalMembers.toLocaleString()} registered` : undefined} />
      </section>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <section className="space-y-lg">
          <Card>
            <h3 className="mb-md text-base font-semibold text-on-surface">Outstanding fines</h3>
            <p className="text-3xl font-bold text-on-surface">
              GH₵ {loading ? '—' : Number(data!.totalFinesOutstanding).toFixed(2)}
            </p>
            <Link to="/admin/fines" className="mt-md inline-block">
              <Button variant="ghost" size="sm">
                Manage fines<Icon name="arrow-right" size={14} />
              </Button>
            </Link>
          </Card>

          <Card>
            <h3 className="mb-md text-base font-semibold text-on-surface">Books by branch</h3>
            {loading ? (
              <div className="space-y-sm">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-sm bg-surface-container-high" />
                ))}
              </div>
            ) : data!.booksByBranch.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No branches configured yet.</p>
            ) : (
              <ul className="space-y-sm">
                {data!.booksByBranch.map((b, i) => (
                  <li key={i} className="space-y-2xs">
                    <div className="flex justify-between text-xs">
                      <span className="truncate font-semibold text-on-surface">{b.branch_name}</span>
                      <span className="shrink-0 text-on-surface-variant">{b.book_count} titles</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-normal"
                        style={{ width: `${(Number(b.book_count) / maxBranch) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section className="lg:col-span-2">
          <Card flush>
            <CardHeader
              title="Recent circulation"
              description="The last ten checkouts"
              action={
                <Link to="/admin/loans">
                  <Button variant="ghost" size="sm">
                    All loans<Icon name="arrow-right" size={14} />
                  </Button>
                </Link>
              }
            />
            {loading ? (
              <div className="space-y-xs p-md">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-container-high" />
                ))}
              </div>
            ) : data!.recentLoans.length === 0 ? (
              <EmptyState kind="loans" title="No circulation yet" description="Checkouts will appear here as they happen." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-container-high bg-surface-container-low">
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Patron</th>
                      <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant sm:table-cell">KNUST ID</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-sm">
                    {data!.recentLoans.map(loan => (
                      <tr key={loan.id} className="transition-colors duration-fast hover:bg-surface-bright">
                        <td className="p-sm font-semibold text-on-surface">{loan.member_name}</td>
                        <td className="hidden p-sm font-mono text-2xs text-on-surface-variant sm:table-cell">{loan.knust_id}</td>
                        <td className="p-sm text-xs text-on-surface">{loan.title}</td>
                        <td className="p-sm">
                          <Badge tone={loanTone(loan.status)}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
