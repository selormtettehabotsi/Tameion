import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import Icon, { type IconName } from '../components/Icon';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const iconMap: Record<Toast['type'], IconName> = {
    success: 'circle-check',
    error: 'circle-alert',
    info: 'info',
  };
  const colorMap: Record<Toast['type'], string> = {
    success: 'bg-success-container text-on-success-container border-success/20',
    error: 'bg-error-container text-on-error-container border-error/20',
    info: 'bg-primary-container text-on-primary-container border-primary/20',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-md right-md z-[100] flex flex-col gap-xs"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <div key={t.id}
            className={`pointer-events-auto flex max-w-sm items-center gap-sm rounded-md border px-md py-sm text-sm font-medium shadow-lg animate-slide-up ${colorMap[t.type]}`}>
            <Icon name={iconMap[t.type]} size={18} />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification"
              className="opacity-60 transition-opacity duration-fast hover:opacity-100">
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
