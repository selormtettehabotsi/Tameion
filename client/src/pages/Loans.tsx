import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Loan, Pagination } from '../types';
import Navbar from '../components/Navbar';
import PaginationBar from '../components/PaginationBar';

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchLoans = (page: number) => {
    setLoading(true);
    api.loans({ page: String(page), limit: '20' })
      .then(r => { setLoans(r.data.loans); setPagination(r.data.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLoans(1); }, []);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <h1 className="font-semibold text-2xl md:text-3xl text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined">library_books</span> My Loans
        </h1>
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-surface-container-highest">
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Title</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Checkout</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Due</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Returned</th>
                  <th className="p-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
                ) : loans.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No loan history.</td></tr>
                ) : loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-surface-bright transition-colors">
                    <td className="p-4 font-medium text-on-surface">{loan.title}</td>
                    <td className="p-4 text-on-surface-variant">{new Date(loan.checkout_date).toLocaleDateString()}</td>
                    <td className="p-4 text-on-surface-variant">{new Date(loan.due_date).toLocaleDateString()}</td>
                    <td className="p-4 text-on-surface-variant">{loan.return_date ? new Date(loan.return_date).toLocaleDateString() : '—'}</td>
                    <td className="p-4">
                      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                        (loan.status === 'overdue' ? 'bg-[#fee2e2] text-[#991b1b]' : loan.status === 'returned' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-[#dcfce7] text-[#166534]')}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={pagination} onPageChange={fetchLoans} />
        </div>
      </main>
    </div>
  );
}
