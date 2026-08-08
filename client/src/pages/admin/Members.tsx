import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Member, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Avatar from '../../components/Avatar';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Alert, Badge, Button, Card, Input, Select } from '../../components/ui';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

// Mirrors memberUpdateSchema on the server — keep the two in step.
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const TYPE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'postgraduate', label: 'Postgraduate' },
  { value: 'faculty', label: 'Faculty' },
];

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ account_status: 'active', user_type: 'student' });
  const [saving, setSaving] = useState(false);
  const [modalErr, setModalErr] = useState('');
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '20' };
    if (q) params.q = q;
    if (status) params.status = status;
    api.adminMembers(params)
      .then(r => { setMembers(r.data.members); setPagination(r.data.pagination); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  const handleExport = async () => {
    try {
      const blob = await api.adminExportMembers();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'members.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast('Members exported', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setModalErr('');
    setForm({ account_status: m.account_status, user_type: m.user_type });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setModalErr('');
    try {
      await api.adminUpdateMember(editing.id, form);
      setEditing(null);
      toast('Member updated', 'success');
      load(pagination.page);
    } catch (err) {
      setModalErr(err instanceof Object && 'message' in err ? String(err.message) : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">User management</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Members</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            {loading ? 'Loading…' : `${pagination.total} registered ${pagination.total === 1 ? 'patron' : 'patrons'}`}
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={handleExport}>
          <Icon name="download" size={18} />
          Export CSV
        </Button>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); load(1); }}
        className="mb-lg flex flex-col gap-sm rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input label="Search" icon="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Name, KNUST ID or email" />
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
              <div key={i} className="h-12 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState kind="members" title="No members found" description="Try a different search term or clear the status filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Member</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Email</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">Type</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Fine</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {members.map(m => (
                    <tr key={m.id} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm">
                        <div className="flex items-center gap-sm">
                          <Avatar seed={m.knust_id} name={m.full_name} src={m.has_avatar ? api.memberAvatarUrl(m.id) : m.avatar_url} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-on-surface">{m.full_name}</p>
                            <p className="font-mono text-2xs text-on-surface-variant">{m.knust_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-sm text-xs text-on-surface-variant md:table-cell">{m.email}</td>
                      <td className="hidden p-sm text-xs capitalize text-on-surface lg:table-cell">{m.user_type}</td>
                      <td className="p-sm">
                        <Badge tone={m.account_status === 'active' ? 'success' : 'danger'}>{m.account_status}</Badge>
                      </td>
                      <td className={`p-sm text-right text-xs font-semibold ${Number(m.fine_balance) > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                        GH₵ {Number(m.fine_balance).toFixed(2)}
                      </td>
                      <td className="p-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)} aria-label={`Edit ${m.full_name}`}>
                          <Icon name="pencil" size={16} />
                        </Button>
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

      <Modal isOpen={Boolean(editing)} onClose={() => setEditing(null)} title="Edit member" id="member-edit">
        {editing && (
          <form onSubmit={handleSave}>
            <div className="space-y-md p-lg">
              {modalErr && <Alert tone="danger" title="Update failed">{modalErr}</Alert>}
              <div className="flex items-center gap-sm rounded-md bg-surface-container-low p-sm">
                <Avatar seed={editing.knust_id} name={editing.full_name} src={editing.has_avatar ? api.memberAvatarUrl(editing.id) : editing.avatar_url} size={44} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">{editing.full_name}</p>
                  <p className="font-mono text-2xs text-on-surface-variant">{editing.knust_id}</p>
                </div>
              </div>
              <Select
                label="Account status"
                value={form.account_status}
                onChange={e => setForm({ ...form, account_status: e.target.value })}
                options={STATUS_OPTIONS}
              />
              <Select
                label="Member type"
                value={form.user_type}
                onChange={e => setForm({ ...form, user_type: e.target.value })}
                options={TYPE_OPTIONS}
              />
            </div>
            <div className="flex justify-end gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
