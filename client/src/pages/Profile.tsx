import { useRef, useState, type ChangeEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { Alert, Button, Card, CardHeader } from '../components/ui';

/** Longest edge of the stored picture. Keeps uploads to a few tens of KB. */
const OUTPUT_SIZE = 256;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

/**
 * Load, square-crop and re-encode the chosen file entirely in the browser.
 *
 * Doing this client-side means the server receives a small, normalised JPEG
 * whatever the user picked, so there is no image processing (or image-parsing
 * attack surface) on the server.
 */
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Image processing is unavailable'));

        // Centre-crop the largest square the source allows, then scale down.
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Bumped after every change so the <img> re-fetches instead of using cache.
  const [version, setVersion] = useState(0);

  if (!user) return null;

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    setError('');

    if (!ACCEPTED.includes(file.type)) {
      setError('Choose a JPEG, PNG, WebP, GIF or BMP image.');
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('That image is larger than 8MB. Please choose a smaller one.');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await processImage(file);
      setPreview(dataUrl);
      await api.uploadAvatar(dataUrl, 'image/jpeg');
      await refreshUser();
      setVersion((v) => v + 1);
      setPreview(null);
      toast('Profile picture updated', 'success');
    } catch (err) {
      setPreview(null);
      setError(err instanceof Object && 'message' in err ? String(err.message) : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.deleteAvatar();
      await refreshUser();
      setVersion((v) => v + 1);
      toast('Profile picture removed', 'success');
    } catch (err) {
      setError(err instanceof Object && 'message' in err ? String(err.message) : 'Could not remove the picture');
    } finally {
      setBusy(false);
    }
  };

  const currentSrc = preview ?? (user.hasAvatar ? api.myAvatarUrl() : null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-md py-xl md:px-xl">
        <header className="mb-lg">
          <p className="text-2xs font-semibold uppercase tracking-wider text-on-surface-variant">Account</p>
          <h1 className="mt-3xs text-2xl font-bold text-on-surface md:text-3xl">Your profile</h1>
        </header>

        <Card flush>
          <CardHeader
            title="Profile picture"
            description="Shown next to your name across the library system."
          />

          <div className="flex flex-col items-center gap-lg p-lg sm:flex-row sm:items-start">
            <div className="relative">
              <Avatar
                seed={user.knust_id}
                name={user.name}
                src={currentSrc}
                version={version}
                size={112}
                className="ring-2 ring-surface-container-high"
              />
              {busy && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-on-surface/40 text-white">
                  <Icon name="rotate-cw" size={22} className="animate-spin" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-base font-semibold text-on-surface">{user.name}</p>
              <p className="font-mono text-2xs text-on-surface-variant">{user.knust_id}</p>
              <p className="mt-sm text-xs text-on-surface-variant">
                {user.hasAvatar
                  ? 'Upload a new image to replace the current one.'
                  : 'You are currently shown as your initials. Add a picture to personalise your account.'}
              </p>

              {error && (
                <div className="mt-md text-left">
                  <Alert tone="danger" title="Could not update your picture">{error}</Alert>
                </div>
              )}

              <div className="mt-md flex flex-wrap justify-center gap-xs sm:justify-start">
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED.join(',')}
                  onChange={handleFile}
                  className="hidden"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                  <Icon name="upload" size={16} />
                  {user.hasAvatar ? 'Change picture' : 'Upload a picture'}
                </Button>
                {user.hasAvatar && (
                  <Button variant="secondary" onClick={handleRemove} disabled={busy}>
                    <Icon name="trash" size={16} />
                    Remove
                  </Button>
                )}
              </div>

              <p className="mt-sm text-2xs text-on-surface-variant">
                JPEG, PNG, WebP, GIF or BMP up to 8MB. Images are cropped square and
                resized to {OUTPUT_SIZE}×{OUTPUT_SIZE} in your browser before upload.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-lg">
          <Card>
            <h2 className="mb-sm text-base font-semibold text-on-surface">Account details</h2>
            <dl className="grid grid-cols-1 gap-sm sm:grid-cols-2">
              <div>
                <dt className="text-2xs uppercase tracking-wider text-on-surface-variant">Name</dt>
                <dd className="text-sm font-semibold text-on-surface">{user.name}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wider text-on-surface-variant">KNUST ID</dt>
                <dd className="font-mono text-sm text-on-surface">{user.knust_id}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wider text-on-surface-variant">Role</dt>
                <dd className="text-sm capitalize text-on-surface">{user.role}</dd>
              </div>
              <div>
                <dt className="text-2xs uppercase tracking-wider text-on-surface-variant">Email verified</dt>
                <dd className="text-sm text-on-surface">{user.emailVerified ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </main>
    </div>
  );
}
