import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { AdminLoan, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Alert, Badge, Button, Card, Input, Select, loanTone } from '../../components/ui';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'On loan' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
];

export default function AdminLoans() {
  const [loans, setLoans] = useState<AdminLoan[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ book_isbn: '', member_knust_id: '', due_days: '14' });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (q) params.q = q;
    if (status) params.status = status;
    api.adminLoans(params)
      .then(r => { setLoans(r.data.loans); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const message = (e: unknown, fallback: string) =>
    e instanceof Object && 'message' in e ? String(e.message) : fallback;

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalErr('');
    try {
      await api.adminCheckout({
        book_isbn: form.book_isbn.trim(),
        member_knust_id: form.member_knust_id.trim(),
        due_days: Number(form.due_days),
      });
      setShowCheckout(false);
      setForm({ book_isbn: '', member_knust_id: '', due_days: '14' });
      toast('Book checked out', 'success');
      load(pagination.page);
    } catch (err) {
      setModalErr(message(err, 'Checkout failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (id: number) => {
    setBusyId(id);
    try {
      const res = await api.adminReturn(id);
      toast(
        res.data.fineAmount > 0
          ? `Returned. Fine of GH₵ ${res.data.fineAmount.toFixed(2)} applied.`
          : 'Returned successfully.',
        'success',
      );
      load(pagination.page);
    } catch (err) {
      toast(message(err, 'Return failed'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRenew = async (id: number) => {
    setBusyId(id);
    try {
      const res = await api.adminRenewLoan(id, 14);
      toast(`Renewed — now due ${new Date(res.data.newDueDate).toLocaleDateString('en-GB')}`, 'success');
      load(pagination.page);
    } catch (err) {
      toast(message(err, 'Renewal failed'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const overdueCount = loans.filter(l => l.status === 'overdue').length;

  return (
    <div>
      <header className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Circulation</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Loans desk</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">Check books out, take returns and renew loans.</p>
        </div>
        <Button size="lg" onClick={() => { setShowCheckout(true); setModalErr(''); }}>
          <Icon name="plus" size={18} />
          New checkout
        </Button>
      </header>

      {overdueCount > 0 && (
        <div className="mb-md">
          <Alert tone="warning" title={`${overdueCount} overdue on this page`}>
            Returning an overdue book automatically applies the fine.
          </Alert>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); load(1); }}
        className="mb-lg flex flex-col gap-sm rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input
            label="Search"
            icon="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Patron name, KNUST ID or book title"
          />
        </div>
        <div className="sm:w-48">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} options={STATUS_FILTERS} />
        </div>
        <Button type="submit">
          <Icon name="search" size={16} />
          Search
        </Button>
      </form>

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
            title="No loans match"
            description="Adjust the filters, or check a book out to get started."
            action={<Button onClick={() => setShowCheckout(true)}>New checkout</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Patron</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">KNUST ID</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Book</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Due</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {loans.map(loan => (
                    <tr key={loan.id} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm font-semibold text-on-surface">{loan.member_name}</td>
                      <td className="hidden p-sm font-mono text-2xs text-on-surface-variant lg:table-cell">{loan.knust_id}</td>
                      <td className="p-sm text-xs text-on-surface">{loan.title}</td>
                      <td className="hidden p-sm text-xs text-on-surface-variant md:table-cell">
                        {new Date(loan.due_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-sm">
                        <Badge tone={loanTone(loan.status)}>
                          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-sm">
                        {loan.status !== 'returned' && (
                          <div className="flex justify-end gap-2xs">
                            <Button variant="secondary" size="sm" disabled={busyId === loan.id} onClick={() => handleRenew(loan.id)}>
                              <Icon name="rotate-cw" size={13} />
                              Renew
                            </Button>
                            <Button size="sm" disabled={busyId === loan.id} onClick={() => handleReturn(loan.id)}>
                              <Icon name="check" size={13} />
                              Return
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar pagination={pagination} onPageChange={load} />
          </>
        )}
      </Card>

      <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="New checkout" id="checkout">
        <form onSubmit={handleCheckout}>
          <div className="space-y-md p-lg">
            {modalErr && <Alert tone="danger" title="Checkout failed">{modalErr}</Alert>}
            <Input
              label="Book ISBN"
              required
              value={form.book_isbn}
              onChange={e => setForm({ ...form, book_isbn: e.target.value })}
              placeholder="978-0132350884"
            />
            <Input
              label="Member KNUST ID"
              required
              value={form.member_knust_id}
              onChange={e => setForm({ ...form, member_knust_id: e.target.value })}
              placeholder="STU-2024001"
            />
            <Input
              label="Loan duration (days)"
              type="number"
              min={1}
              max={365}
              required
              value={form.due_days}
              onChange={e => setForm({ ...form, due_days: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
            <Button type="button" variant="ghost" onClick={() => setShowCheckout(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Processing…' : 'Check out'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
