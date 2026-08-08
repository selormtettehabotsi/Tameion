import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Loan, Pagination } from '../types';
import Navbar from '../components/Navbar';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { Alert, Badge, Button, Card, loanTone } from '../components/ui';

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLoans = (page: number) => {
    setLoading(true);
    api.loans({ page: String(page), limit: '20' })
      .then(r => { setLoans(r.data.loans); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(1); }, []);

  const overdue = loans.filter(l => l.status === 'overdue');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-shell px-md py-xl md:px-xl">
        <header className="mb-lg flex items-center gap-sm">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-primary-container text-on-primary-container">
            <Icon name="book-marked" size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">My loans</h1>
            <p className="text-xs text-on-surface-variant">Everything you have borrowed, past and present.</p>
          </div>
        </header>

        {overdue.length > 0 && (
          <div className="mb-lg">
            <Alert tone="danger" title={`${overdue.length} overdue ${overdue.length === 1 ? 'item' : 'items'} on this page`}>
              {overdue.map(l => l.title).join(', ')}
            </Alert>
          </div>
        )}

        <Card flush>
          {loading ? (
            <div className="space-y-xs p-md">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-sm bg-surface-container-high" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              kind="loans"
              title="No loan history yet"
              description="Once you borrow your first book it will show up here."
              action={<Link to="/catalog"><Button>Browse catalogue</Button></Link>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-surface-container-high bg-surface-container-low">
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Checked out</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Due</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Returned</th>
                      <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high text-sm">
                    {loans.map(loan => (
                      <tr key={loan.id} className="transition-colors duration-fast hover:bg-surface-bright">
                        <td className="p-sm font-semibold text-on-surface">{loan.title}</td>
                        <td className="p-sm text-xs text-on-surface-variant">{formatDate(loan.checkout_date)}</td>
                        <td className="p-sm text-xs text-on-surface-variant">{formatDate(loan.due_date)}</td>
                        <td className="p-sm text-xs text-on-surface-variant">{formatDate(loan.return_date)}</td>
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
              <PaginationBar pagination={pagination} onPageChange={fetchLoans} />
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
