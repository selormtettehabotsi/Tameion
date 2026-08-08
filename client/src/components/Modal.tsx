import { useEffect, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  id?: string;
}

export default function Modal({ isOpen, onClose, title, children, id = 'modal' }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); prev?.focus(); };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-md backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-surface-container-high bg-surface-container-lowest shadow-xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-bright px-lg py-md">
          <h2 id={titleId} className="text-lg font-semibold text-on-surface">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog"
            className="rounded-sm p-3xs text-on-surface-variant transition-colors duration-fast hover:bg-surface-container-low hover:text-on-surface">
            <Icon name="x" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
