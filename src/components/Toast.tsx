import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastData {
  message: string;
  type: ToastType;
  id?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  /** Duración en ms antes de auto-cerrar. Por defecto 3200. */
  duration?: number;
}

export function Toast({ toast, onDismiss, duration = 3200 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    // pequeño delay para que la animación entrance sea perceptible
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 320); // esperar que termine la animación de salida
    }, duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id, duration]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[200] pointer-events-auto
                  transition-all duration-300 ease-out
                  ${visible
                    ? 'opacity-100 translate-y-0 -translate-x-1/2 scale-100'
                    : 'opacity-0 translate-y-4 -translate-x-1/2 scale-95'
                  }`}
    >
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl
                    shadow-2xl backdrop-blur-xl
                    border min-w-[240px] max-w-[90vw]
                    ${isSuccess
                      ? 'bg-emerald-950/90 border-emerald-500/40 shadow-emerald-900/50'
                      : 'bg-rose-950/90 border-rose-500/40 shadow-rose-900/50'
                    }`}
      >
        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                         ${isSuccess ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
          {isSuccess
            ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            : <XCircle      className="w-4.5 h-4.5 text-rose-400" />
          }
        </div>

        {/* Message */}
        <p className={`flex-1 text-sm font-semibold
                        ${isSuccess ? 'text-emerald-200' : 'text-rose-200'}`}>
          {toast.message}
        </p>

        {/* Close */}
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 320); }}
          className={`shrink-0 p-1 rounded-lg transition-colors
                      ${isSuccess
                        ? 'text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/15'
                        : 'text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/15'
                      }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Hook de conveniencia para manejar el estado del toast */
export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type, id: Date.now() });
  };

  const dismissToast = () => setToast(null);

  return { toast, showToast, dismissToast };
}
