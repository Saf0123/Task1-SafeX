import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

const CONFIG = {
  success: { Icon: FiCheckCircle, color: '#17a673', bg: '#f0fdf4' },
  error:   { Icon: FiAlertCircle, color: '#dc2626', bg: '#fef2f2' },
  info:    { Icon: FiInfo,        color: '#3b82f6', bg: '#eff6ff' },
  warning: { Icon: FiAlertCircle, color: '#d97706', bg: '#fffbeb' },
}

function ToastStack({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="toast-stack" role="alert" aria-live="polite">
      {toasts.map((toast) => {
        const cfg = CONFIG[toast.type] || CONFIG.success
        return (
          <div
            key={toast.id}
            className="toast"
            style={{ borderLeftColor: cfg.color, background: cfg.bg }}
          >
            <cfg.Icon size={16} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="toast__message">{toast.message}</p>
            <button
              type="button"
              className="toast__close"
              onClick={() => onRemove(toast.id)}
              aria-label="Dismiss notification"
            >
              <FiX size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastStack
