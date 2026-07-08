import { useMemo } from 'react'

function parseHours(str) {
  if (!str) return 0
  return parseFloat(String(str).replace('h', '')) || 0
}

const BUCKETS = [
  { label: '1–2h', min: 1, max: 2 },
  { label: '3–4h', min: 3, max: 4 },
  { label: '5–6h', min: 5, max: 6 },
  { label: '7–8h', min: 7, max: 8 },
  { label: '9h+',  min: 9, max: Infinity },
]

function DashAvgCompTime({ allTasks }) {
  const stats = useMemo(() => {
    const completed = allTasks.filter((t) => !t.archived && t.status === 'Completed')
    const times = completed.map((t) => parseHours(t.estimatedTime)).filter((h) => h > 0)

    if (!times.length) {
      return { avg: '—', minH: '—', maxH: '—', buckets: BUCKETS.map((b) => ({ ...b, count: 0 })) }
    }

    const total = times.reduce((s, h) => s + h, 0)
    const avg = (total / times.length).toFixed(1)
    const minH = Math.min(...times)
    const maxH = Math.max(...times)

    const buckets = BUCKETS.map((b) => ({
      ...b,
      count: times.filter((h) => h >= b.min && h <= b.max).length,
    }))

    return { avg, minH, maxH, buckets }
  }, [allTasks])

  const maxCount = Math.max(...stats.buckets.map((b) => b.count), 1)

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Efficiency</p>
          <h3 className="dash-panel__title">Avg Completion Time</h3>
        </div>
      </div>

      <div className="dash-time-big">
        <p className="dash-time-big__value">{stats.avg}{stats.avg !== '—' ? 'h' : ''}</p>
        <p className="dash-time-big__label">average per completed task</p>
      </div>

      <div className="dash-time-dist">
        {stats.buckets.map((b) => (
          <div key={b.label} className="dash-time-dist-row">
            <span className="dash-time-dist-label">{b.label}</span>
            <div className="dash-time-dist-bar">
              <div
                className="dash-time-dist-fill"
                style={{ width: `${(b.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="dash-time-dist-count">{b.count}</span>
          </div>
        ))}
      </div>

      {stats.avg !== '—' && (
        <div className="dash-time-footer">
          <span>Min: <strong>{stats.minH}h</strong></span>
          <span>Max: <strong>{stats.maxH}h</strong></span>
        </div>
      )}
    </div>
  )
}

export default DashAvgCompTime
