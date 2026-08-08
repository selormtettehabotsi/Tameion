import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { DashboardData } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { Alert, Badge, Button, Card, CardHeader, loanTone } from '../components/ui';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.dashboard()
      .then(r => setData(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  if (failed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-shell px-md py-xl md:px-xl">
          <Alert tone="danger" title="Could not load your dashboard">
            Please refresh the page, or try again in a moment.
          </Alert>
        </main>
      </div>
    );
  }

  const overdue = data?.stats.overdueCount ?? 0;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-shell px-md py-xl md:px-xl">
        <header className="mb-lg">
          <h1 className="text-2xl font-bold text-on-surface md:text-3xl">Welcome back, {firstName}.</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            Your loans, holds and fine balance at a glance.
          </p>
        </header>

        {overdue > 0 && (
          <div className="mb-lg">
            <Alert
              tone="danger"
              title={`${overdue} overdue ${overdue === 1 ? 'book' : 'books'}`}
              action={
                <Link to="/loans" className="shrink-0">
                  <Button variant="secondary" size="sm">View loans</Button>
                </Link>
              }
            >
              Fines accrue at GH₵ 1.00 per day per book. Please return them to any branch desk.
            </Alert>
          </div>
        )}

        <section className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total borrowed" value={data?.stats.totalBorrowed ?? 0} icon="book-open" loading={loading} />
          <StatCard label="On loan now" value={data?.stats.currentlyOnLoan ?? 0} icon="clock" tone="info" loading={loading} />
          <StatCard label="Overdue" value={overdue} icon="triangle-alert" tone={overdue > 0 ? 'danger' : 'success'} loading={loading} />
          <StatCard
            label="Fine balance"
            value={`GH₵ ${(data?.fineBalance ?? 0).toFixed(2)}`}
            icon="banknote"
            tone={(data?.fineBalance ?? 0) > 0 ? 'warning' : 'success'}
            loading={loading}
          />
        </section>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <section className="lg:col-span-2">
            <Card flush>
              <CardHeader
                title="Active loans"
                description="Books currently checked out to you"
                action={
                  <Link to="/loans">
                    <Button variant="ghost" size="sm">
                      All loans<Icon name="arrow-right" size={14} />
                    </Button>
                  </Link>
                }
              />
              {loading ? (
                <div className="space-y-xs p-md">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-container-high" />
                  ))}
                </div>
              ) : data && data.activeLoans.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-surface-container-high bg-surface-container-low">
                        <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</th>
                        <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Due</th>
                        <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                        <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Remaining</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high text-sm">
                      {data.activeLoans.map(loan => {
                        const days = loan.days_remaining;
                        return (
                          <tr key={loan.id} className="transition-colors duration-fast hover:bg-surface-bright">
                            <td className="p-sm font-semibold text-on-surface">{loan.title}</td>
                            <td className="p-sm text-xs text-on-surface-variant">{formatDate(loan.due_date)}</td>
                            <td className="p-sm">
                              <Badge tone={loanTone(loan.status)}>
                                {loan.status === 'overdue' ? 'Overdue' : 'Active'}
                              </Badge>
                            </td>
                            <td className={`p-sm text-right text-xs font-semibold ${days != null && days < 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                              {days == null ? '—' : days < 0 ? `${Math.abs(days)} days late` : `${days} days`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  kind="loans"
                  title="No books on loan"
                  description="Browse the catalogue and reserve something to get started."
                  action={<Link to="/catalog"><Button>Browse catalogue</Button></Link>}
                />
              )}
            </Card>
          </section>

          <aside>
            <Card flush>
              <CardHeader title="Pending holds" description="Reserved and waiting for collection" />
              {loading ? (
                <div className="space-y-xs p-md">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-sm bg-surface-container-high" />
                  ))}
                </div>
              ) : data && data.pendingReservations.length > 0 ? (
                <ul className="divide-y divide-surface-container-high">
                  {data.pendingReservations.map(r => (
                    <li key={r.id} className="p-md transition-colors duration-fast hover:bg-surface-bright">
                      <h3 className="text-sm font-semibold text-on-surface">{r.title}</h3>
                      <p className="mt-3xs flex items-center gap-2xs text-2xs text-on-surface-variant">
                        <Icon name="clock" size={13} />
                        Expires {formatDate(r.expiry_date)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  kind="reservations"
                  title="No pending holds"
                  description="Reserve a title and it will appear here."
                />
              )}
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
