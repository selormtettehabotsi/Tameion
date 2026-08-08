import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { BookDetail as BookDetailType } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import BookCover from '../components/BookCover';
import Icon, { type IconName } from '../components/Icon';
import { Alert, Badge, Button, Card } from '../components/ui';

export default function BookDetail() {
  const { isbn } = useParams<{ isbn: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [book, setBook] = useState<BookDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);

  useEffect(() => {
    if (!isbn) return;
    setLoading(true);
    api.book(isbn)
      .then(r => setBook(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isbn]);

  const handleReserve = async () => {
    if (!isbn) return;
    setReserving(true);
    try {
      await api.reserveBook(isbn);
      setReserved(true);
      toast('Reservation placed. It is held for 7 days.', 'success');
    } catch (e) {
      const message = e instanceof Object && 'message' in e ? String(e.message) : 'Reservation failed';
      toast(message, 'error');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-4xl px-md py-xl md:px-xl">
          <div className="flex flex-col gap-lg md:flex-row">
            <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-surface-container-high md:w-64" />
            <div className="flex-1 space-y-sm">
              <div className="h-8 w-3/4 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-surface-container-high" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-xl px-md py-2xl text-center">
          <div className="mx-auto mb-md grid h-14 w-14 place-items-center rounded-full bg-error-container text-error">
            <Icon name="search-x" size={26} />
          </div>
          <h1 className="text-xl font-semibold text-on-surface">Book not found</h1>
          <p className="mt-2xs text-sm text-on-surface-variant">
            No catalogue entry matches this ISBN.
          </p>
          <Link to="/catalog" className="mt-lg inline-block">
            <Button variant="secondary"><Icon name="arrow-left" size={16} />Back to catalogue</Button>
          </Link>
        </main>
      </div>
    );
  }

  const info: { icon: IconName; label: string; value: string | null }[] = [
    { icon: 'user', label: 'Author', value: book.author },
    { icon: 'building', label: 'Publisher', value: book.publisher },
    { icon: 'tag', label: 'Genre', value: book.genre },
    { icon: 'landmark', label: 'Branch', value: book.branch_name },
    { icon: 'map-pin', label: 'Location', value: book.branch_location },
    { icon: 'bookmark', label: 'Shelf', value: book.shelf_location },
    { icon: 'graduation-cap', label: 'College', value: book.college },
  ];
  const shown = info.filter(i => i.value);

  const canReserve = Boolean(user) && !user?.isStaff;
  const available = book.copies_available > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-md py-xl md:px-xl">
        <Link
          to="/catalog"
          className="mb-lg inline-flex items-center gap-2xs text-xs font-semibold text-on-surface-variant transition-colors duration-fast hover:text-primary"
        >
          <Icon name="arrow-left" size={16} />
          Back to catalogue
        </Link>

        <Card flush>
          <div className="flex flex-col md:flex-row">
            <div className="w-full shrink-0 md:w-64">
              <BookCover
                isbn={book.isbn}
                title={book.title}
                coverUrl={book.cover_url}
                width={400}
                height={600}
                className="aspect-[3/2] w-full md:aspect-[2/3]"
              />
            </div>

            <div className="min-w-0 flex-1 p-lg md:p-xl">
              {book.genre && <Badge tone="info" icon="tag" className="mb-sm">{book.genre}</Badge>}
              <h1 className="text-2xl font-bold text-on-surface md:text-3xl">{book.title}</h1>
              <p className="mt-3xs text-sm text-on-surface-variant">{book.author}</p>

              <div className="mt-md flex flex-wrap items-center gap-sm">
                <Badge tone={available ? 'success' : 'danger'} icon={available ? 'circle-check' : 'circle-alert'}>
                  {available ? 'Available now' : 'All copies on loan'}
                </Badge>
                <span className="text-xs text-on-surface-variant">
                  {book.copies_available} of {book.copies_total} copies on shelf
                </span>
              </div>

              <dl className="mt-lg grid grid-cols-1 gap-sm sm:grid-cols-2">
                {shown.map(i => (
                  <div key={i.label} className="flex items-start gap-xs text-xs">
                    <span className="mt-3xs text-on-surface-variant"><Icon name={i.icon} size={16} /></span>
                    <div className="min-w-0">
                      <dt className="text-on-surface-variant">{i.label}</dt>
                      <dd className="truncate font-semibold text-on-surface">{i.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-lg space-y-sm">
                {reserved && (
                  <Alert tone="success" title="Reservation confirmed">
                    We will hold this title for 7 days. Track it from your dashboard.
                  </Alert>
                )}
                {!user && (
                  <Alert tone="info" title="Sign in to reserve">
                    <Link to="/login" className="font-semibold underline">Log in</Link> or{' '}
                    <Link to="/register" className="font-semibold underline">register</Link> to place a hold.
                  </Alert>
                )}
                {user?.isStaff && (
                  <Alert tone="info" title="Staff account">
                    Reservations are placed by patrons. Use the admin loans desk to check this title out.
                  </Alert>
                )}

                {canReserve && (
                  <Button size="lg" onClick={handleReserve} disabled={reserving || !available || reserved}>
                    <Icon name="bookmark-plus" size={18} />
                    {reserving ? 'Reserving…' : reserved ? 'Reserved' : 'Reserve this book'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
