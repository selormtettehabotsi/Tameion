import { useState, useEffect, useRef, type FormEvent } from 'react';
import { api } from '../../lib/api';
import type { Book, Branch } from '../../types';
import { useToast } from '../../context/ToastContext';

type Modal = null | { mode: 'add' } | { mode: 'edit'; book: Book } | { mode: 'delete'; book: Book };

export default function AdminBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [form, setForm] = useState({ isbn: '', title: '', author: '', publisher: '', genre: '', copies_total: 1, shelf_location: '', branch_id: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [bk, br] = await Promise.all([api.books(), api.adminBranches()]);
      setBooks(bk.data.books);
      setBranches(br.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ isbn: '', title: '', author: '', publisher: '', genre: '', copies_total: 1, shelf_location: '', branch_id: '' }); setErr(''); setModal({ mode: 'add' }); };
  const openEdit = (b: Book) => { setForm({ isbn: b.isbn, title: b.title, author: b.author, publisher: b.publisher || '', genre: b.genre || '', copies_total: b.copies_total, shelf_location: b.shelf_location || '', branch_id: b.branch_id ? String(b.branch_id) : '' }); setErr(''); setModal({ mode: 'edit', book: b }); };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const d = { ...form, copies_total: Number(form.copies_total), branch_id: form.branch_id ? Number(form.branch_id) : undefined };
      if (modal?.mode === 'add') await api.adminCreateBook(d as any);
      else if (modal?.mode === 'edit') await api.adminUpdateBook(form.isbn, d as any);
      setModal(null); load();
    } catch (e: any) { setErr(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (modal?.mode !== 'delete') return;
    setSaving(true);
    try { await api.adminDeleteBook(modal.book.isbn); setModal(null); load(); }
    catch (e: any) { setErr(e.message || 'Delete failed'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    try {
      const blob = await api.adminExportBooks();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'books.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast('Export failed', 'error'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const res = await api.adminImportBooks(text);
      toast(res.message || `Imported ${res.data.imported} books`, 'success');
      load();
    } catch (err: any) { toast(err.message || 'Import failed', 'error'); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const filtered = q ? books.filter(b => [b.isbn, b.title, b.author].some(f => f?.toLowerCase().includes(q.toLowerCase()))) : books;

  const statusBadge = (b: Book) => {
    if (b.copies_available === 0) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#fee2e2] text-[#991b1b] text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#991b1b]" />Checked Out (0/{b.copies_total})</span>;
    if (b.copies_available <= 1) return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#fef9c3] text-[#854d0e] text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#854d0e]" />Low ({b.copies_available}/{b.copies_total})</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#dcfce7] text-[#166534] text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />Available ({b.copies_available}/{b.copies_total})</span>;
  };

  const inp = 'w-full px-3 py-2 bg-surface-container-lowest rounded-md border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm text-on-surface';

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-wider font-medium text-on-surface-variant uppercase mb-1">Catalog Management</p>
          <h1 className="font-semibold text-2xl md:text-3xl text-on-surface">Book Inventory</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="bg-surface border border-outline-variant hover:bg-surface-container-low text-on-surface font-medium text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">upload</span> Import CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          <button onClick={openAdd} className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span> Add New Book
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface-container-lowest p-4 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest mb-6">
        <div className="relative w-full lg:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by ISBN, Title, Author..." className={inp + ' pl-10'} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-surface-container-highest">
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">ISBN</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase w-1/3">Title</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase">Author</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase hidden lg:table-cell">Genre</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-center">Status</th>
                <th className="py-3 px-4 text-xs tracking-wider font-medium text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No books found.</td></tr>
              ) : filtered.map(book => (
                <tr key={book.isbn} className="hover:bg-surface transition-colors group">
                  <td className="py-3 px-4 text-on-surface-variant font-mono text-xs whitespace-nowrap">{book.isbn}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-on-surface truncate">{book.title}</p>
                    <p className="text-on-surface-variant lg:hidden">{book.author}</p>
                  </td>
                  <td className="py-3 px-4 text-on-surface whitespace-nowrap">{book.author}</td>
                  <td className="py-3 px-4 text-on-surface hidden lg:table-cell">{book.genre || '—'}</td>
                  <td className="py-3 px-4 text-center">{statusBadge(book)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(book)} aria-label={`Edit ${book.title}`} className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-md transition-colors">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                      </button>
                      <button onClick={() => { setErr(''); setModal({ mode: 'delete', book }); }} aria-label={`Delete ${book.title}`} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-surface-bright border-t border-surface-container-highest px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">Showing <span className="font-medium text-on-surface">{filtered.length}</span> of <span className="font-medium text-on-surface">{books.length}</span> books</p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <div role="dialog" aria-modal="true" aria-labelledby="book-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] border border-surface-container-highest flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-container-highest flex justify-between items-center bg-surface-bright">
              <h2 id="book-modal-title" className="font-semibold text-xl text-on-surface">{modal.mode === 'add' ? 'Add New Book' : 'Edit Book Details'}</h2>
              <button onClick={() => setModal(null)} aria-label="Close dialog" className="text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {err && <div role="alert" className="bg-error-container text-on-error-container p-3 rounded-lg text-sm">{err}</div>}
              <div>
                <label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">ISBN Number</label>
                <input type="text" required value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} readOnly={modal.mode === 'edit'} className={inp + (modal.mode === 'edit' ? ' bg-surface-container-low cursor-not-allowed' : '')} />
                {modal.mode === 'edit' && <p className="mt-1 text-[11px] text-on-surface-variant">ISBN cannot be edited directly.</p>}
              </div>
              <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Book Title</label><input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inp} /></div>
              <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Author(s)</label><input type="text" required value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className={inp} /></div>
              <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Publisher</label><input type="text" value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} className={inp} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Genre</label><input type="text" value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} className={inp} /></div>
                <div>
                  <label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Branch</label>
                  <select value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} className={inp}>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Total Copies</label><input type="number" min={1} value={form.copies_total} onChange={e => setForm({ ...form, copies_total: Number(e.target.value) })} className={inp} /></div>
                <div><label className="block text-xs tracking-wider font-medium text-on-surface-variant mb-1">Shelf Location</label><input type="text" value={form.shelf_location} onChange={e => setForm({ ...form, shelf_location: e.target.value })} className={inp} /></div>
              </div>
            </form>
            <div className="px-6 py-4 border-t border-surface-container-highest bg-surface-bright flex justify-end gap-3">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 font-medium text-on-surface-variant hover:bg-surface-container-low rounded-md transition-colors">Cancel</button>
              <button type="submit" onClick={handleSave} disabled={saving} className="px-4 py-2 font-medium bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary rounded-md shadow-sm transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal?.mode === 'delete' && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4 text-error">
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">warning</span>
              </div>
              <h2 id="delete-modal-title" className="font-semibold text-xl text-on-surface mb-2">Delete Book Record?</h2>
              <p className="text-sm text-on-surface-variant">Are you sure you want to delete <span className="font-medium text-on-surface">"{modal.book.title}"</span>? This action cannot be undone.</p>
              {err && <p role="alert" className="text-sm text-error mt-2">{err}</p>}
            </div>
            <div className="px-6 py-4 bg-surface-bright border-t border-surface-container-highest flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 font-medium bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-low rounded-md transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 px-4 py-2 font-medium bg-error hover:bg-[#991b1b] text-on-error rounded-md shadow-sm transition-colors disabled:opacity-50">{saving ? 'Deleting...' : 'Delete Record'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
