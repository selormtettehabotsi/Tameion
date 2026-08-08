import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Book, Branch, Pagination } from '../types';
import Navbar from '../components/Navbar';
import PaginationBar from '../components/PaginationBar';
import BookCover from '../components/BookCover';

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('');
  const [branch, setBranch] = useState('');
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState('');

  const fetchBooks = async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (q) params.q = q;
      if (genre) params.genre = genre;
      if (branch) params.branch = branch;
      if (available) params.available = 'true';
      if (sort) params.sort = sort;
      const res = await api.books(params);
      setBooks(res.data.books);
      setGenres(res.data.filters.genres);
      setBranches(res.data.filters.branches);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBooks(1); }, [genre, branch, available, sort]);

  const handleSearch = (e: FormEvent) => { e.preventDefault(); fetchBooks(1); };

  const sel = 'appearance-none bg-surface border border-outline-variant rounded-md pl-3 pr-8 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary hover:bg-surface-container-low transition-colors cursor-pointer';

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        {/* Hero Search */}
        <section className="mb-8 relative overflow-hidden rounded-2xl shadow-lg" style={{minHeight: '220px'}}>
          <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1400&q=80&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-[#003318]/60" />
          <div className="relative p-8 md:p-12 flex-grow w-full md:max-w-2xl">
            <h1 className="font-bold text-3xl md:text-5xl text-white mb-2 tracking-tight">Library Catalog</h1>
            <p className="text-base text-white/80 mb-6">Search our extensive collection of academic and recreational resources.</p>
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input type="text" value={q} onChange={e => setQ(e.target.value)}
                className="w-full pl-12 pr-24 py-4 rounded-lg border-0 bg-white/95 dark:bg-surface focus:ring-2 focus:ring-white/40 transition-all text-base placeholder-on-surface-variant/70 text-on-surface shadow-lg"
                placeholder="Search books, authors, or ISBNs..." />
              <button type="submit" className="absolute inset-y-2 right-2 px-5 bg-primary text-on-primary text-xs tracking-wider font-medium rounded-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant text-xs tracking-wider font-medium">
              <span className="material-symbols-outlined text-[18px]">filter_list</span> Filters:
            </div>
            <div className="relative">
              <select value={genre} onChange={e => setGenre(e.target.value)} className={sel}>
                <option value="">All Genres</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
              </div>
            </div>
            <div className="relative">
              <select value={branch} onChange={e => setBranch(e.target.value)} className={sel}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={String(b.id)}>{b.branch_name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" checked={available} onChange={e => setAvailable(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-5 bg-surface-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </div>
              <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Available Only</span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant text-xs tracking-wider font-medium">Sort by:</span>
            <div className="relative">
              <select value={sort} onChange={e => setSort(e.target.value)} className={sel}>
                <option value="">Relevance</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="author_asc">Author (A-Z)</option>
                <option value="newest">Newest First</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">sort</span>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-4 flex justify-between items-center px-2">
          <p className="text-sm text-on-surface-variant">Showing <span className="font-semibold text-on-surface">{books.length}</span> of <span className="font-semibold text-on-surface">{pagination.total}</span> results</p>
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <article key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden animate-pulse">
                <div className="h-48 bg-surface-container-high border-b border-outline-variant" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-surface-container-high rounded w-3/4" />
                  <div className="h-4 bg-surface-container-high rounded w-1/2" />
                  <div className="h-4 bg-surface-container-high rounded w-1/3" />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map(book => (
              <Link to={'/books/' + book.isbn} key={book.isbn}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="h-40 bg-surface-container-low relative overflow-hidden flex items-center justify-center border-b border-outline-variant">
                  <BookCover isbn={book.isbn} title={book.title} className="w-full h-full group-hover:scale-105 transition-transform" />
                  {book.genre && (
                    <div className="absolute top-3 left-3 bg-tertiary-container text-on-tertiary-container text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-sm shadow-sm">
                      {book.genre}
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="font-semibold text-base text-on-surface leading-tight line-clamp-2 group-hover:text-primary transition-colors">{book.title}</h2>
                  <p className="text-sm text-on-surface-variant mt-1 mb-4">{book.author}</p>
                  <div className="mt-auto space-y-3">
                    {book.branch_name && (
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs tracking-wider font-medium">
                        <span className="material-symbols-outlined text-[16px]">domain</span>
                        <span>{book.branch_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-surface-container-highest">
                      <span className={'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ' +
                        (book.copies_available > 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error')}>
                        <span className={'w-1.5 h-1.5 rounded-full mr-1.5 ' + (book.copies_available > 0 ? 'bg-primary' : 'bg-error')} />
                        {book.copies_available > 0 ? 'Available' : 'Unavailable'}
                      </span>
                      <span className="text-xs text-on-surface-variant">{book.copies_available}/{book.copies_total}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
        {!loading && books.length === 0 && (
          <div className="text-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 block">search_off</span>
            <p className="text-lg">No books found matching your criteria.</p>
          </div>
        )}

        <div className="mt-6 bg-surface-container-lowest rounded-xl border border-surface-container-highest overflow-hidden">
          <PaginationBar pagination={pagination} onPageChange={fetchBooks} />
        </div>
      </main>
    </div>
  );
}
