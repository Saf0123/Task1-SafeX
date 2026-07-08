import { FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi'

function getBarColor(pct) {
  if (pct >= 80) return '#17a673'
  if (pct >= 50) return '#3b82f6'
  if (pct >= 20) return '#f59e0b'
  return '#dc2626'
}

function DashInternWorkload({ workload, onInternClick }) {
  const active = workload.filter((w) => w.assignedTasks > 0)

  if (active.length === 0) {
    return (
      <div className="dash-panel">
        <div className="dash-panel__header">
          <div className="dash-panel__title-block">
            <p className="dash-panel__eyebrow">Team Load</p>
            <h3 className="dash-panel__title">Intern Workload</h3>
          </div>
        </div>
        <div className="dash-empty">
          <p>No tasks assigned this period.</p>
        </div>
      </div>
    )
  }

  const sorted = [...active].sort((a, b) => b.assignedTasks - a.assignedTasks)

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Team Load</p>
          <h3 className="dash-panel__title">Intern Workload</h3>
        </div>
        <span className="dash-panel__badge">{active.length} intern{active.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="dash-workload-list">
        {sorted.map((intern) => (
          <div
            key={intern.id}
            className="dash-workload-item"
            onClick={() => onInternClick?.(intern.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onInternClick?.(intern.id)}
            title={`View ${intern.name}'s tasks`}
          >
            <div className="avatar avatar--small">{intern.initials}</div>

            <div className="dash-workload-info">
              <p className="dash-workload-name">{intern.name}</p>
              <div className="dash-workload-stats">
                <span className="dash-workload-stat">
                  <FiClock size={10} />
                  {intern.assignedTasks} assigned
                </span>
                <span className="dash-workload-stat" style={{ color: '#17a673' }}>
                  <FiCheckCircle size={10} />
                  {intern.completed} done
                </span>
                {intern.overdue > 0 && (
                  <span className="dash-workload-stat" style={{ color: '#dc2626' }}>
                    <FiAlertCircle size={10} />
                    {intern.overdue} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="dash-workload-right">
              <div className="dash-workload-bar">
                <div
                  className="dash-workload-bar-fill"
                  style={{ width: `${intern.progress}%`, background: getBarColor(intern.progress) }}
                />
              </div>
              <span className="dash-workload-pct">{intern.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashInternWorkload
