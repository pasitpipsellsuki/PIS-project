import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Toast, ToastContainer } from '../components/ErrorMessage'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  showToast: (message: string, type: ToastMessage['type']) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    
    // Auto-dismiss after 5 seconds for success/info, 8 seconds for error/warning
    const duration = type === 'success' || type === 'info' ? 5000 : 8000
    setTimeout(() => removeToast(id), duration)
  }, [removeToast])

  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const showWarning = useCallback((message: string) => showToast(message, 'warning'), [showToast])
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
