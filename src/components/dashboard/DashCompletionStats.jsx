import { useMemo } from 'react'
import { FiCheckSquare, FiActivity, FiUsers, FiTrendingUp } from 'react-icons/fi'

function DashCompletionStats({ allTasks, interns }) {
  const stats = useMemo(() => {
    const active = allTasks.filter((t) => !t.archived)
    const completed = active.filter((t) => t.status === 'Completed')

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const createdThisWeek = active.filter((t) => {
      try { return new Date(t.createdAt) >= weekStart } catch { return false }
    })

    const overallRate = active.length
      ? Math.round((completed.length / active.length) * 100)
      : 0

    const avgPerIntern = interns.length
      ? (active.length / interns.length).toFixed(1)
      : 0

    return {
      overallRate,
      avgPerIntern,
      createdThisWeek: createdThisWeek.length,
      completedThisWeek: createdThisWeek.filter((t) => t.status === 'Completed').length,
    }
  }, [allTasks, interns])

  const items = [
    {
      label: 'Completion Rate',
      value: `${stats.overallRate}%`,
      Icon: FiCheckSquare,
      color: '#17a673',
    },
    {
      label: 'Avg Tasks / Intern',
      value: stats.avgPerIntern,
      Icon: FiUsers,
      color: '#7c3aed',
    },
    {
      label: 'Created This Week',
      value: stats.createdThisWeek,
      Icon: FiActivity,
      color: '#f59e0b',
    },
    {
      label: 'Completed This Week',
      value: stats.completedThisWeek,
      Icon: FiTrendingUp,
      color: '#2563eb',
    },
  ]

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Metrics</p>
          <h3 className="dash-panel__title">Completion Statistics</h3>
        </div>
      </div>
      <div className="dash-stats-grid">
        {items.map((item) => (
          <div key={item.label} className="dash-stat-card">
            <div
              className="dash-stat-card__icon"
              style={{ background: `${item.color}1a`, color: item.color }}
            >
              <item.Icon size={15} />
            </div>
            <p className="dash-stat-card__value" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="dash-stat-card__label">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashCompletionStats
