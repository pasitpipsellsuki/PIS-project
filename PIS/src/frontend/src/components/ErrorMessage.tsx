import { ReactNode } from 'react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export default function ErrorMessage({ message, onRetry, onDismiss }: ErrorMessageProps) {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          <strong>Error</strong>
          <p>{message}</p>
        </div>
      </div>
      <div className="error-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Try Again
          </button>
        )}
        {onDismiss && (
          <button className="btn btn-secondary" onClick={onDismiss}>
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose?: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  const classNames = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: 'toast-info',
  }

  return (
    <div className={`toast ${classNames[type]}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose}>×</button>
      )}
    </div>
  )
}

interface ToastContainerProps {
  children: ReactNode
}

export function ToastContainer({ children }: ToastContainerProps) {
  return <div className="toast-container">{children}</div>
}
