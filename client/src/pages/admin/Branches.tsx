import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Branch } from '../../types';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useToast } from '../../context/ToastContext';
import { Alert, Button, Card, Input } from '../../components/ui';

interface BranchFull extends Branch {
  college?: string;
  location?: string;
}

export default function Branches() {
  const [branches, setBranches] = useState<BranchFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | 'add' | BranchFull>(null);
  const [form, setForm] = useState({ branch_name: '', college: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    api.adminBranches()
      .then(r => setBranches(r.data as BranchFull[]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ branch_name: '', college: '', location: '' }); setErr(''); setModal('add'); };

  const openEdit = (b: BranchFull) => {
    setForm({ branch_name: b.branch_name, college: b.college || '', location: b.location || '' });
    setErr('');
    setModal(b);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = { branch_name: form.branch_name, college: form.college, location: form.location || undefined };
      if (modal === 'add') {
        await api.adminCreateBranch(payload);
        toast('Branch added', 'success');
      } else if (modal) {
        await api.adminUpdateBranch(modal.id, payload);
        toast('Branch updated', 'success');
      }
      setModal(null);
      load();
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
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Infrastructure</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Branch libraries</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            {loading ? 'Loading…' : `${branches.length} ${branches.length === 1 ? 'branch' : 'branches'}`}
          </p>
        </div>
        <Button size="lg" onClick={openAdd}>
          <Icon name="plus" size={18} />Add branch
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-surface-container-high" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <Card flush>
          <EmptyState kind="books" title="No branches yet" description="Add a branch library so books can be assigned to it."
            action={<Button onClick={openAdd}>Add branch</Button>} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
          {branches.map(b => (
            <Card key={b.id} className="flex flex-col gap-sm transition-shadow duration-normal hover:shadow-md">
              <div className="flex items-start justify-between gap-sm">
                <div className="flex min-w-0 items-center gap-sm">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-container text-on-primary-container">
                    <Icon name="landmark" size={20} />
                  </span>
                  <h3 className="truncate text-base font-semibold text-on-surface">{b.branch_name}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(b)} aria-label={`Edit ${b.branch_name}`}>
                  <Icon name="pencil" size={16} />
                </Button>
              </div>
              {b.college && (
                <p className="flex items-center gap-2xs text-xs text-on-surface-variant">
                  <Icon name="graduation-cap" size={14} />{b.college}
                </p>
              )}
              {b.location && (
                <p className="flex items-center gap-2xs text-xs text-on-surface-variant">
                  <Icon name="map-pin" size={14} />{b.location}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add branch' : 'Edit branch'}
        id="branch-form"
      >
        <form onSubmit={handleSave}>
          <div className="space-y-md p-lg">
            {err && <Alert tone="danger" title="Could not save">{err}</Alert>}
            <Input label="Branch name" required value={form.branch_name} onChange={e => setForm({ ...form, branch_name: e.target.value })} />
            <Input label="College" required value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
            <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="flex justify-end gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
