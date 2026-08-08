import { useState, useEffect, useRef, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Book, Branch, Pagination } from '../../types';
import { useToast } from '../../context/ToastContext';
import PaginationBar from '../../components/PaginationBar';
import EmptyState from '../../components/EmptyState';
import BookCover from '../../components/BookCover';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { Alert, Badge, Button, Card, Input, Select } from '../../components/ui';

type ModalState = null | { mode: 'add' } | { mode: 'edit'; book: Book } | { mode: 'delete'; book: Book };

const emptyForm = {
  isbn: '', title: '', author: '', publisher: '', genre: '',
  copies_total: 1, shelf_location: '', cover_url: '', branch_id: '',
};

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20', sort: 'title' };
      if (search) params.q = search;
      const [bk, br] = await Promise.all([api.books(params), api.adminBranches()]);
      setBooks(bk.data.books);
      setPagination(bk.data.pagination);
      setBranches(br.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search]);

  const message = (e: unknown, fallback: string) =>
    e instanceof Object && 'message' in e ? String(e.message) : fallback;

  const openAdd = () => { setForm(emptyForm); setErr(''); setModal({ mode: 'add' }); };

  const openEdit = (b: Book) => {
    setForm({
      isbn: b.isbn, title: b.title, author: b.author,
      publisher: b.publisher || '', genre: b.genre || '',
      copies_total: b.copies_total, shelf_location: b.shelf_location || '',
      cover_url: b.cover_url || '', branch_id: b.branch_id ? String(b.branch_id) : '',
    });
    setErr('');
    setModal({ mode: 'edit', book: b });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      // Optional text fields go as null rather than '' so COALESCE keeps the
      // existing value, and cover_url passes the server's https-only check.
      const payload = {
        title: form.title,
        author: form.author,
        publisher: form.publisher || null,
        genre: form.genre || null,
        copies_total: Number(form.copies_total),
        shelf_location: form.shelf_location || null,
        cover_url: form.cover_url.trim() || null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
      };
      if (modal?.mode === 'add') {
        await api.adminCreateBook({ ...payload, isbn: form.isbn });
        toast('Book added', 'success');
      } else if (modal?.mode === 'edit') {
        await api.adminUpdateBook(form.isbn, payload);
        toast('Book updated', 'success');
      }
      setModal(null);
      load(pagination.page);
    } catch (e2) {
      setErr(message(e2, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (modal?.mode !== 'delete') return;
    setSaving(true);
    setErr('');
    try {
      await api.adminDeleteBook(modal.book.isbn);
      setModal(null);
      toast('Book deleted', 'success');
      load(pagination.page);
    } catch (e) {
      setErr(message(e, 'Delete failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await api.adminExportBooks();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'books.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast('Catalogue exported', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await api.adminImportBooks(text);
      toast(res.message || `Imported ${res.data.imported} books`, 'success');
      load(pagination.page);
    } catch (err2) {
      toast(message(err2, 'Import failed'), 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const stock = (b: Book) => {
    if (b.copies_available === 0) return <Badge tone="danger">All out ({b.copies_available}/{b.copies_total})</Badge>;
    if (b.copies_available <= 1) return <Badge tone="warning">Low ({b.copies_available}/{b.copies_total})</Badge>;
    return <Badge tone="success">In stock ({b.copies_available}/{b.copies_total})</Badge>;
  };

  return (
    <div>
      <header className="mb-lg flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Catalogue</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Book inventory</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            {loading ? 'Loading…' : `${pagination.total} ${pagination.total === 1 ? 'title' : 'titles'} catalogued`}
          </p>
        </div>
        <div className="flex flex-wrap gap-xs">
          <Button variant="secondary" onClick={handleExport}>
            <Icon name="download" size={16} />Export
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} />Import
          </Button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleImport} className="hidden" />
          <Button onClick={openAdd}>
            <Icon name="plus" size={16} />Add book
          </Button>
        </div>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(q); }}
        className="mb-lg flex flex-col gap-sm rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <Input label="Search catalogue" icon="search" value={q} onChange={e => setQ(e.target.value)} placeholder="ISBN, title or author" />
        </div>
        <Button type="submit"><Icon name="search" size={16} />Search</Button>
      </form>

      <Card flush>
        {loading ? (
          <div className="space-y-xs p-md">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-sm bg-surface-container-high" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState
            kind="books"
            title="No books found"
            description="Nothing matches this search. Add a title or import a CSV."
            action={<Button onClick={openAdd}>Add a book</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-surface-container-high bg-surface-container-low">
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Title</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant lg:table-cell">ISBN</th>
                    <th scope="col" className="hidden p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant xl:table-cell">Genre</th>
                    <th scope="col" className="p-sm text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Stock</th>
                    <th scope="col" className="p-sm text-right text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high text-sm">
                  {books.map(book => (
                    <tr key={book.isbn} className="transition-colors duration-fast hover:bg-surface-bright">
                      <td className="p-sm">
                        <div className="flex items-center gap-sm">
                          <BookCover
                            isbn={book.isbn}
                            title={book.title}
                            coverUrl={book.cover_url}
                            width={200}
                            height={300}
                            className="h-14 w-10 shrink-0 rounded-xs"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-on-surface">{book.title}</p>
                            <p className="truncate text-2xs text-on-surface-variant">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap p-sm font-mono text-2xs text-on-surface-variant lg:table-cell">{book.isbn}</td>
                      <td className="hidden p-sm text-xs text-on-surface xl:table-cell">{book.genre || '—'}</td>
                      <td className="p-sm">{stock(book)}</td>
                      <td className="p-sm">
                        <div className="flex justify-end gap-2xs">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(book)} aria-label={`Edit ${book.title}`}>
                            <Icon name="pencil" size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setErr(''); setModal({ mode: 'delete', book }); }} aria-label={`Delete ${book.title}`}>
                            <Icon name="trash" size={16} />
                          </Button>
                        </div>
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

      {/* Add / edit */}
      <Modal
        isOpen={modal?.mode === 'add' || modal?.mode === 'edit'}
        onClose={() => setModal(null)}
        title={modal?.mode === 'add' ? 'Add a book' : 'Edit book'}
        id="book-form"
      >
        <form onSubmit={handleSave} className="flex min-h-0 flex-col">
          <div className="space-y-md overflow-y-auto p-lg">
            {err && <Alert tone="danger" title="Could not save">{err}</Alert>}
            <Input
              label="ISBN"
              required
              readOnly={modal?.mode === 'edit'}
              value={form.isbn}
              onChange={e => setForm({ ...form, isbn: e.target.value })}
              className={modal?.mode === 'edit' ? 'cursor-not-allowed bg-surface-container-low' : ''}
            />
            <Input label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Input label="Author" required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
            <Input label="Publisher" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} />
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Input label="Genre" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
              <Select
                label="Branch"
                value={form.branch_id}
                onChange={e => setForm({ ...form, branch_id: e.target.value })}
                options={[{ value: '', label: 'Unassigned' }, ...branches.map(b => ({ value: String(b.id), label: b.branch_name }))]}
              />
            </div>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Input
                label="Total copies"
                type="number"
                min={1}
                value={form.copies_total}
                onChange={e => setForm({ ...form, copies_total: Number(e.target.value) })}
              />
              <Input label="Shelf location" value={form.shelf_location} onChange={e => setForm({ ...form, shelf_location: e.target.value })} />
            </div>
            <Input
              label="Cover image URL"
              type="url"
              value={form.cover_url}
              onChange={e => setForm({ ...form, cover_url: e.target.value })}
              placeholder="https://…  (leave blank for the default artwork)"
            />
          </div>
          <div className="flex justify-end gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal isOpen={modal?.mode === 'delete'} onClose={() => setModal(null)} title="Delete this book?" id="book-delete">
        {modal?.mode === 'delete' && (
          <>
            <div className="p-lg text-center">
              <div className="mx-auto mb-md grid h-12 w-12 place-items-center rounded-full bg-error-container text-error">
                <Icon name="triangle-alert" size={24} />
              </div>
              <p className="text-sm text-on-surface-variant">
                Permanently remove <span className="font-semibold text-on-surface">“{modal.book.title}”</span> from the
                catalogue? Any reservations for it are deleted too. This cannot be undone.
              </p>
              {err && <p role="alert" className="mt-sm text-xs text-error">{err}</p>}
            </div>
            <div className="flex gap-sm border-t border-surface-container-high bg-surface-bright px-lg py-md">
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" className="flex-1" disabled={saving} onClick={handleDelete}>
                {saving ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
