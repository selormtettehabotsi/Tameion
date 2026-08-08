import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { FinesData } from '../types';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { Alert, Badge, Card } from '../components/ui';

export default function Fines() {
  const [data, setData] = useState<FinesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fines().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const balance = data?.balance ?? 0;
  const unpaid = data?.transactions.filter(t => !t.settled).length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-shell px-md py-xl md:px-xl">
        <header className="mb-lg flex items-center gap-sm">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-container text-on-primary-container">
            <Icon name="wallet" size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">My fines</h1>
            <p className="text-xs text-on-surface-variant">Charges accrue at GH₵ 1.00 per day per overdue book.</p>
          </div>
        </header>

        <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-3">
          <Card className="sm:col-span-2">
            <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Outstanding balance</p>
            {loading ? (
              <div className="mt-xs h-10 w-40 animate-pulse rounded-sm bg-surface-container-high" />
            ) : (
              <p className={`mt-2xs text-4xl font-bold ${balance > 0 ? 'text-error' : 'text-success'}`}>
                GH₵ {balance.toFixed(2)}
              </p>
            )}
            <p className="mt-xs text-xs text-on-surface-variant">
              {balance > 0
                ? 'Settle at any branch circulation desk to clear your record.'
                : 'Your account is clear — thank you.'}
            </p>
          </Card>
          <Card>
            <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Unpaid charges</p>
            <p className="mt-2xs text-4xl font-bold text-on-surface">{loading ? '—' : unpaid}</p>
          </Card>
        </div>

        {!loading && balance > 0 && (
          <div className="mb-lg">
            <Alert tone="warning" title="Borrowing may be restricted">
              Accounts with an outstanding balance can be suspended by library staff until the fine is cleared.
            </Alert>
          </div>
        )}

        <Card flush>
          {loading ? (
            <div className="space-y-xs p-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-container-high" />
              ))}
            </div>
          ) : !data || data.transactions.length === 0 ? (
            <EmptyState
              kind="reservations"
              title="No fines on record"
              description="Return your books on time and it stays that way."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Book</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Days overdue</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Rate/day</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Amount</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {data.transactions.map(t => (
                    <tr key={t.id} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm font-semibold text-on-surface">{t.title}</td>
                      <td className="p-sm text-xs text-on-surface-variant">{t.days_overdue}</td>
                      <td className="p-sm text-xs text-on-surface-variant">GH₵ {Number(t.rate_per_day).toFixed(2)}</td>
                      <td className="p-sm text-xs font-semibold text-on-surface">GH₵ {Number(t.amount).toFixed(2)}</td>
                      <td className="p-sm">
                        <Badge tone={t.settled ? 'success' : 'danger'}>{t.settled ? 'Paid' : 'Unpaid'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
