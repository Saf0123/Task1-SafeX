function getRankClass(i) {
  if (i === 0) return 'dash-rank-number--gold'
  if (i === 1) return 'dash-rank-number--silver'
  if (i === 2) return 'dash-rank-number--bronze'
  return 'dash-rank-number--default'
}

function DashTopPerformers({ workload, onInternClick }) {
  const ranked = [...workload]
    .filter((w) => w.assignedTasks > 0)
    .sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress
      return b.completed - a.completed
    })
    .slice(0, 6)

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Recognition</p>
          <h3 className="dash-panel__title">Top Performing Interns</h3>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="dash-empty">
          <p>No performance data for this period.</p>
        </div>
      ) : (
        <div className="dash-rank-list">
          {ranked.map((intern, i) => (
            <div
              key={intern.id}
              className="dash-rank-item"
              onClick={() => onInternClick?.(intern.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onInternClick?.(intern.id)}
              title={`Filter by ${intern.name}`}
            >
              <div className={`dash-rank-number ${getRankClass(i)}`}>{i + 1}</div>
              <div className="avatar avatar--small">{intern.initials}</div>
              <div className="dash-rank-info">
                <p className="dash-rank-name">{intern.name}</p>
                <p className="dash-rank-sub">
                  {intern.completed} completed · {intern.pending} pending
                </p>
              </div>
              <div className="dash-rank-right">
                <div className="dash-rank-bar">
                  <div
                    className="dash-rank-bar-fill"
                    style={{ width: `${intern.progress}%`, background: '#17a673' }}
                  />
                </div>
                <span className="dash-rank-pct">{intern.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DashTopPerformers
