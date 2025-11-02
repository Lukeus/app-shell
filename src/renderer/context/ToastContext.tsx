import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastIntent = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  intent?: ToastIntent;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

const intentStyles: Record<ToastIntent, string> = {
  info: 'bg-vscode-bg-tertiary text-vscode-fg-secondary border border-vscode-border',
  success:
    'bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 dark:text-emerald-300',
  error: 'bg-red-500/10 border border-red-500/40 text-red-200 dark:text-red-300',
};

export const ToastProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeouts = useRef<Map<string, ReturnType<typeof window.setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      timeouts.current.forEach(timeoutId => window.clearTimeout(timeoutId));
      timeouts.current.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
    const timeoutId = timeouts.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback<ToastContextValue['showToast']>(toast => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const intent = toast.intent ?? 'info';
    const duration = toast.duration ?? DEFAULT_DURATION;

    setToasts(current => [...current, { ...toast, id, intent }]);

    const timeoutId = window.setTimeout(() => {
      dismissToast(id);
    }, duration);
    timeouts.current.set(id, timeoutId);
  }, [dismissToast]);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map(toast => (
          <button
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className={`text-left rounded-md px-4 py-3 shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-vscode-accent ${intentStyles[toast.intent ?? 'info']}`}
          >
            <div className="font-semibold text-sm">{toast.title}</div>
            {toast.description ? (
              <div className="text-xs mt-1 opacity-80 leading-snug">{toast.description}</div>
            ) : null}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
