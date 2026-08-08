import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { BookDetail as BookDetailType } from '../types';
import Navbar from '../components/Navbar';
import BookCover from '../components/BookCover';

export default function BookDetail() {
  const { isbn } = useParams<{ isbn: string }>();
  const [book, setBook] = useState<BookDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (isbn) api.book(isbn).then(r => setBook(r.data)).catch(console.error).finally(() => setLoading(false)); }, [isbn]);

  const handleReserve = async () => {
    if (!isbn) return; setReserving(true); setMsg('');
    try { await api.reserveBook(isbn); setMsg('Reserved successfully!'); }
    catch (e: any) { setMsg(e.message || 'Reservation failed'); }
    finally { setReserving(false); }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20 text-on-surface-variant">Loading...</div></div>;
  if (!book) return <div className="min-h-screen bg-background"><Navbar /><div className="flex items-center justify-center py-20 text-error">Book not found.</div></div>;

  const info = [
    { icon: 'person', label: 'Author', value: book.author },
    { icon: 'business', label: 'Publisher', value: book.publisher },
    { icon: 'category', label: 'Genre', value: book.genre },
    { icon: 'domain', label: 'Branch', value: book.branch_name },
    { icon: 'location_on', label: 'Location', value: book.branch_location },
    { icon: 'bookmark', label: 'Shelf', value: book.shelf_location },
    { icon: 'school', label: 'College', value: book.college },
  ].filter(i => i.value);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 md:px-10 py-8">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary mb-6 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Catalog
        </Link>
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-64 h-52 md:h-auto bg-surface-container-low flex items-center justify-center border-b md:border-b-0 md:border-r border-surface-container-high">
              <BookCover isbn={book.isbn} title={book.title} size="L" className="w-full h-full" />
            </div>
            <div className="flex-1 p-6 md:p-8">
              {book.genre && <span className="inline-block bg-tertiary-container text-on-tertiary-container text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-sm mb-3">{book.genre}</span>}
              <h1 className="font-bold text-2xl md:text-3xl text-on-surface mb-1">{book.title}</h1>
              <p className="text-on-surface-variant mb-4">{book.author}</p>
              <div className="flex items-center gap-4 mb-6">
                <span className={'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ' +
                  (book.copies_available > 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error')}>
                  <span className={'w-2 h-2 rounded-full mr-2 ' + (book.copies_available > 0 ? 'bg-primary' : 'bg-error')} />
                  {book.copies_available > 0 ? 'Available' : 'Unavailable'}
                </span>
                <span className="text-sm text-on-surface-variant">{book.copies_available} of {book.copies_total} copies</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {info.map(i => (
                  <div key={i.label} className="flex items-start gap-2 text-sm">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px] mt-0.5">{i.icon}</span>
                    <div><span className="text-on-surface-variant">{i.label}:</span> <span className="text-on-surface font-medium">{i.value}</span></div>
                  </div>
                ))}
              </div>
              {msg && <div className={'p-3 rounded-lg mb-4 text-sm ' + (msg.includes('success') ? 'bg-primary/10 text-primary' : 'bg-error-container text-on-error-container')}>{msg}</div>}
              <button onClick={handleReserve} disabled={reserving || book.copies_available === 0}
                className="bg-primary hover:bg-primary-container hover:text-on-primary-container text-on-primary font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
                {reserving ? 'Reserving...' : 'Reserve This Book'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
