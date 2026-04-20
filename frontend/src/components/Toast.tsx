import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'
import { useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import clsx from 'clsx'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'flex w-80 items-start gap-3 rounded-2xl p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-right-8',
              t.type === 'success' && 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
              t.type === 'error' && 'bg-rose-50 text-rose-800 ring-1 ring-rose-200',
              t.type === 'info' && 'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
            )}
          >
            <div className="mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
              {t.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 text-sm font-bold leading-tight">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="mt-0.5 rounded-lg p-0.5 opacity-50 hover:bg-black/5 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
