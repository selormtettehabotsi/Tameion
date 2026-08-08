import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Book, Pagination, Branch } from '../types';
import { HERO_IMAGE } from '../lib/images';
import Navbar from '../components/Navbar';
import BookCover from '../components/BookCover';
import PaginationBar from '../components/PaginationBar';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { Badge, Button, Input, Select } from '../components/ui';

const SORTS = [
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'author', label: 'Author (A–Z)' },
  { value: 'newest', label: 'Recently added' },
];

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // `query` is what the user is typing; `search` is the committed term.
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [branch, setBranch] = useState('');
  const [available, setAvailable] = useState(false);
  const [sort, setSort] = useState('title');

  const fetchBooks = useCallback((page: number) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), limit: '12', sort };
    if (search) params.q = search;
    if (genre) params.genre = genre;
    if (branch) params.branch = branch;
    if (available) params.available = 'true';

    api.books(params)
      .then(r => {
        setBooks(r.data.books);
        setPagination(r.data.pagination);
        setGenres(r.data.filters.genres);
        setBranches(r.data.filters.branches);
      })
      .finally(() => setLoading(false));
  }, [search, genre, branch, available, sort]);

  useEffect(() => { fetchBooks(1); }, [fetchBooks]);

  const activeFilters = [genre, branch, available ? 'available' : '', search].filter(Boolean).length;

  const clearFilters = () => {
    setQuery(''); setSearch(''); setGenre(''); setBranch(''); setAvailable(false); setSort('title');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#04140a]/95 via-[#04140a]/80 to-[#04140a]/40" />
        <div className="mx-auto w-full max-w-shell px-md py-2xl md:px-xl md:py-3xl">
          <div className="max-w-xl">
            <Badge tone="info" icon="library" className="mb-md">
              KNUST University Library
            </Badge>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              Find your next book.
            </h1>
            <p className="mt-sm text-sm text-white/80 md:text-base">
              Search the full catalogue across every branch library, check live availability,
              and place a hold in one step.
            </p>

            <form
              className="mt-lg flex flex-col gap-xs sm:flex-row"
              onSubmit={(e) => { e.preventDefault(); setSearch(query); }}
              role="search"
            >
              <div className="flex-1">
                <Input
                  icon="search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, author or ISBN"
                  aria-label="Search the catalogue"
                />
              </div>
              <Button type="submit" size="lg">
                <Icon name="search" size={16} />
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-shell px-md py-xl md:px-xl">
        {/* Filters */}
        <div className="mb-lg flex flex-col gap-sm rounded-lg border border-surface-container-high bg-surface-container-lowest p-md shadow-sm md:flex-row md:items-end">
          <div className="grid flex-1 grid-cols-1 gap-sm sm:grid-cols-3">
            <Select
              label="Genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              options={[{ value: '', label: 'All genres' }, ...genres.map(g => ({ value: g, label: g }))]}
            />
            <Select
              label="Branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              options={[{ value: '', label: 'All branches' }, ...branches.map(b => ({ value: String(b.id), label: b.branch_name }))]}
            />
            <Select
              label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORTS}
            />
          </div>
          <div className="flex items-center gap-md pb-3xs">
            <label className="flex cursor-pointer items-center gap-2xs text-xs font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 rounded-xs accent-[var(--color-primary)]"
              />
              Available only
            </label>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon name="x" size={14} />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="mb-md flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-on-surface">
            {loading ? 'Searching…' : `${pagination.total} ${pagination.total === 1 ? 'book' : 'books'}`}
          </h2>
          {search && !loading && (
            <p className="text-xs text-on-surface-variant">
              for <span className="font-semibold text-on-surface">“{search}”</span>
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest">
                <div className="aspect-[2/3] animate-pulse bg-surface-container-high" />
                <div className="space-y-2xs p-sm">
                  <div className="h-3 w-full animate-pulse rounded-xs bg-surface-container-high" />
                  <div className="h-3 w-2/3 animate-pulse rounded-xs bg-surface-container-high" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-lg border border-surface-container-high bg-surface-container-lowest">
            <EmptyState
              kind="books"
              title="No books match those filters"
              description="Try a different search term, or clear the filters to browse the whole catalogue."
              action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {books.map(book => (
              <Link
                key={book.isbn}
                to={`/books/${book.isbn}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest shadow-sm transition-shadow duration-normal hover:shadow-md"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <BookCover
                    isbn={book.isbn}
                    title={book.title}
                    coverUrl={book.cover_url}
                    width={400}
                    height={600}
                    className="h-full w-full transition-transform duration-normal group-hover:scale-105"
                  />
                  <div className="absolute left-2xs top-2xs">
                    <Badge tone={book.copies_available > 0 ? 'success' : 'danger'}>
                      {book.copies_available > 0 ? `${book.copies_available} in` : 'On loan'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-sm">
                  <h3 className="line-clamp-2 text-xs font-semibold text-on-surface group-hover:text-primary">
                    {book.title}
                  </h3>
                  <p className="mt-3xs line-clamp-1 text-2xs text-on-surface-variant">{book.author}</p>
                  {book.genre && (
                    <p className="mt-auto pt-xs text-2xs text-on-surface-variant">{book.genre}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="mt-lg overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest">
            <PaginationBar pagination={pagination} onPageChange={fetchBooks} />
          </div>
        )}
      </main>
    </div>
  );
}
