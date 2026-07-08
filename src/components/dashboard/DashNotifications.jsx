import { parseISO } from 'date-fns'
import {
  FiAlertTriangle, FiBell, FiCheckCircle,
  FiClock, FiActivity, FiX,
} from 'react-icons/fi'

const NOTIF_ICONS = {
  overdue:  { Icon: FiAlertTriangle, bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
  due_today:{ Icon: FiClock,         bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  activity: { Icon: FiActivity,      bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
  completed:{ Icon: FiCheckCircle,   bg: 'rgba(23,166,115,0.1)',  color: '#17a673' },
}

function formatTime(ts) {
  try {
    const date = parseISO(ts)
    const now = new Date()
    const diffMs = now - date
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return `${Math.floor(diffH / 24)}d ago`
  } catch {
    return 'recently'
  }
}

function DashNotifications({ notifications, readIds, onMarkRead, onClose, onItemClick }) {
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  return (
    <div className="dash-notif-panel">
      <div className="dash-notif-panel__header">
        <h4 className="dash-notif-panel__title">
          Notifications
          {unreadCount > 0 && (
            <span style={{ color: '#dc2626', marginLeft: 6, fontSize: '0.85rem' }}>
              ({unreadCount})
            </span>
          )}
        </h4>
        <div className="dash-notif-panel__controls">
          {unreadCount > 0 && (
            <button
              type="button"
              className="dash-notif-panel__clear"
              onClick={onMarkRead}
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            className="dash-notif-panel__close"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <FiX size={14} />
          </button>
        </div>
      </div>

      <div className="dash-notif-panel__list">
        {notifications.length === 0 ? (
          <p className="dash-notif-panel__empty">
            <FiBell size={20} style={{ display: 'block', margin: '0 auto 8px' }} />
            All caught up! No new notifications.
          </p>
        ) : (
          notifications.map((n) => {
            const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.activity
            const { Icon } = cfg
            const isUnread = !readIds.includes(n.id)
            return (
              <div
                key={n.id}
                className={`dash-notif-item ${isUnread ? 'dash-notif-item--unread' : ''}`}
                onClick={() => onItemClick?.(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onItemClick?.(n)}
              >
                <div
                  className="dash-notif-item__icon"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <Icon size={13} />
                </div>
                <div className="dash-notif-item__body">
                  <p className="dash-notif-item__title">{n.title}</p>
                  <p className="dash-notif-item__detail">{n.detail}</p>
                </div>
                <span className="dash-notif-item__time">{formatTime(n.time)}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DashNotifications
