import { parseISO } from 'date-fns'
import {
  FiPlus, FiEdit2, FiTrash2, FiArchive, FiRefreshCw,
  FiFlag, FiCalendar, FiUsers, FiCheckCircle, FiActivity,
} from 'react-icons/fi'

const ACTION_CONFIG = {
  'Task Created':  { Icon: FiPlus,         bg: '#dbeafe', color: '#2563eb' },
  'Task Updated':  { Icon: FiEdit2,         bg: '#f0fdf4', color: '#16a34a' },
  'Task Deleted':  { Icon: FiTrash2,        bg: '#fee2e2', color: '#dc2626' },
  'Task Archived': { Icon: FiArchive,       bg: '#fff7ed', color: '#d97706' },
  'Status Changed':   { Icon: FiRefreshCw,  bg: '#dbeafe', color: '#3b82f6' },
  'Priority Changed': { Icon: FiFlag,       bg: '#fce7f3', color: '#db2777' },
  'Due Date Changed': { Icon: FiCalendar,   bg: '#f0fdf4', color: '#059669' },
  'Bulk Assign':   { Icon: FiUsers,         bg: '#ede9fe', color: '#7c3aed' },
  'Bulk Delete':   { Icon: FiTrash2,        bg: '#fee2e2', color: '#dc2626' },
  'Bulk Archive':  { Icon: FiArchive,       bg: '#fff7ed', color: '#d97706' },
  'Bulk Complete': { Icon: FiCheckCircle,   bg: '#f0fdf4', color: '#16a34a' },
}

function getConfig(action) {
  return ACTION_CONFIG[action] || { Icon: FiActivity, bg: '#f1f5f9', color: '#64748b' }
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
    const diffD = Math.floor(diffH / 24)
    return `${diffD}d ago`
  } catch {
    return 'recently'
  }
}

function DashRecentActivity({ activityLog, onEntryClick }) {
  const recent = activityLog.slice(0, 12)

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Log</p>
          <h3 className="dash-panel__title">Recent Activity</h3>
        </div>
        <span className="dash-panel__badge">{activityLog.length} events</span>
      </div>

      {recent.length === 0 ? (
        <div className="dash-empty"><p>No recent activity.</p></div>
      ) : (
        <div className="dash-activity-list">
          {recent.map((entry) => {
            const { Icon, bg, color } = getConfig(entry.action)
            return (
              <div
                key={entry.id}
                className="dash-activity-item"
                onClick={() => onEntryClick?.(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onEntryClick?.(entry)}
              >
                <div className="dash-activity-icon" style={{ background: bg, color }}>
                  <Icon size={14} />
                </div>
                <div className="dash-activity-body">
                  <p className="dash-activity-action">{entry.action}</p>
                  <p className="dash-activity-detail">
                    {entry.taskTitle}
                    {entry.internName && entry.internName !== 'Unassigned'
                      ? ` · ${entry.internName}`
                      : ''}
                  </p>
                </div>
                <span className="dash-activity-time">{formatTime(entry.timestamp)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DashRecentActivity
