import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { StaffMember, Branch, Pagination } from '../../types';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Alert, Badge, Button, Card, Input, Select } from '../../components/ui';

type ModalState = null | { mode: 'add' } | { mode: 'edit'; staff: StaffMember };

const ROLES = [
  { value: 'librarian', label: 'Librarian' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm = { knust_staff_id: '', full_name: '', email: '', password: '', role: 'librarian', branch_id: '' };

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { toast } = useToast();

  const load = (page = 1) => {
    setLoading(true);
    Promise.all([
      api.adminStaff({ page: String(page), limit: '20' }),
      api.adminBranches(),
    ])
      .then(([s, b]) => {
        setStaff(s.data.staff);
        setPagination(s.data.pagination);
        setBranches(b.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setErr(''); setModal({ mode: 'add' }); };

  const openEdit = (s: StaffMember) => {
    setForm({
      knust_staff_id: s.knust_staff_id, full_name: s.full_name, email: s.email,
      password: '', role: s.role, branch_id: s.branch_id ? String(s.branch_id) : '',
    });
    setErr('');
    setModal({ mode: 'edit', staff: s });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      if (modal?.mode === 'add') {
        await api.adminCreateStaff({
          knust_staff_id: form.knust_staff_id,
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          branch_id: form.branch_id ? Number(form.branch_id) : undefined,
        });
        toast('Staff member added', 'success');
      } else if (modal?.mode === 'edit') {
        await api.adminUpdateStaff(modal.staff.id, {
          full_name: form.full_name,
          email: form.email,
          role: form.role as StaffMember['role'],
          branch_id: form.branch_id ? Number(form.branch_id) : null,
        });
        toast('Staff member updated', 'success');
      }
      setModal(null);
      load(pagination.page);
    } catch (e2) {
      setErr(e2 instanceof Object && 'message' in e2 ? String(e2.message) : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <header className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Administration</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Staff</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            {loading ? 'Loading…' : `${pagination.total} with system access`}
          </p>
        </div>
        <Button size="lg" onClick={openAdd}>
          <Icon name="user-plus" size={18} />Add staff
        </Button>
      </header>

      <Card flush>
        {loading ? (
          <div className="space-y-xs p-md">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState kind="members" title="No staff accounts" description="Add a librarian or administrator to get started."
            action={<Button onClick={openAdd}>Add staff</Button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Staff</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant md:table-cell">Email</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Role</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">Branch</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {staff.map(s => (
                    <tr key={s.id} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm">
                        <div className="flex items-center gap-sm">
                          <Avatar seed={s.knust_staff_id} name={s.full_name} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-on-surface">{s.full_name}</p>
                            <p className="font-mono text-2xs text-on-surface-variant">{s.knust_staff_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden p-sm text-xs text-on-surface-variant md:table-cell">{s.email}</td>
                      <td className="p-sm">
                        <Badge tone={s.role === 'admin' ? 'info' : 'neutral'} icon={s.role === 'admin' ? 'shield' : 'id-card'}>
                          {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="hidden p-sm text-xs text-on-surface-variant lg:table-cell">{s.branch_name || '—'}</td>
                      <td className="p-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label={`Edit ${s.full_name}`}>
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

      <Modal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Add staff member' : 'Edit staff member'}
        id="staff-form"
      >
        {modal && (
          <form onSubmit={handleSave}>
            <div className="space-y-md overflow-y-auto p-lg">
              {err && <Alert tone="danger" title="Could not save">{err}</Alert>}
              <Input
                label="Staff ID"
                required
                readOnly={modal.mode === 'edit'}
                value={form.knust_staff_id}
                onChange={e => setForm({ ...form, knust_staff_id: e.target.value })}
                placeholder="LIB-001"
                className={modal.mode === 'edit' ? 'cursor-not-allowed bg-surface-container-low' : ''}
              />
              <Input label="Full name" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              <Input label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              {modal.mode === 'add' && (
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
              )}
              <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} options={ROLES} />
                <Select
                  label="Branch"
                  value={form.branch_id}
                  onChange={e => setForm({ ...form, branch_id: e.target.value })}
                  options={[{ value: '', label: 'None' }, ...branches.map(b => ({ value: String(b.id), label: b.branch_name }))]}
                />
              </div>
            </div>
            <div className="flex justify-end gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
              <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
