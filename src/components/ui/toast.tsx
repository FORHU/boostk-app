import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 items-center pointer-events-none w-full max-w-sm px-4">
        {toasts.map((t) => {
          const Icon = 
            t.type === 'success' ? CheckCircle2 : 
            t.type === 'error' ? AlertCircle : 
            Info;

          const iconColors = {
            success: 'text-emerald-500 dark:text-emerald-400',
            error: 'text-rose-500 dark:text-rose-400',
            info: 'text-blue-500 dark:text-blue-400',
          };

          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 w-full p-4 rounded-xl border border-border bg-background/95 backdrop-blur-md shadow-lg transition-all duration-300 ease-out translate-y-0 opacity-100"
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColors[t.type]}`} />
              <div className="flex-1 text-sm font-medium text-foreground pt-0.5">
                {t.message}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                aria-label="Close toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};