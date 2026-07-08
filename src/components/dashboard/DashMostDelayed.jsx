function DashMostDelayed({ workload, onInternClick }) {
  const delayed = [...workload]
    .filter((w) => w.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || a.progress - b.progress)
    .slice(0, 6)

  const onTrackCount = workload.filter((w) => w.assignedTasks > 0 && w.overdue === 0).length

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Attention Required</p>
          <h3 className="dash-panel__title">Most Delayed Interns</h3>
        </div>
        {delayed.length > 0 && (
          <span
            className="dash-panel__badge"
            style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
          >
            {delayed.length} at risk
          </span>
        )}
      </div>

      {delayed.length === 0 ? (
        <div className="dash-empty">
          <p style={{ color: '#17a673', fontWeight: 600 }}>✓ No delayed interns this period.</p>
          {onTrackCount > 0 && (
            <p style={{ color: '#64748b', marginTop: 4 }}>
              {onTrackCount} intern{onTrackCount !== 1 ? 's' : ''} on track.
            </p>
          )}
        </div>
      ) : (
        <div className="dash-rank-list">
          {delayed.map((intern, i) => (
            <div
              key={intern.id}
              className="dash-rank-item"
              onClick={() => onInternClick?.(intern.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onInternClick?.(intern.id)}
              title={`Filter by ${intern.name}`}
              style={{ borderLeft: '3px solid #dc2626' }}
            >
              <div
                className="dash-rank-number"
                style={{ background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}
              >
                {i + 1}
              </div>
              <div className="avatar avatar--small">{intern.initials}</div>
              <div className="dash-rank-info">
                <p className="dash-rank-name">{intern.name}</p>
                <p className="dash-rank-sub" style={{ color: '#dc2626', fontWeight: 600 }}>
                  {intern.overdue} overdue · {intern.progress}% complete
                </p>
              </div>
              <span
                className="dash-summary-card__trend dash-summary-card__trend--down"
                style={{ fontSize: '0.7rem', flexShrink: 0 }}
              >
                {intern.overdue} late
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DashMostDelayed
