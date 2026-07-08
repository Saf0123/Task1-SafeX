import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const STATUS_COLORS = {
  'Not Started': '#64748b',
  'In Progress':  '#3b82f6',
  'Under Review': '#f59e0b',
  'Completed':    '#17a673',
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const total = payload[0].payload.total || 1
  const pct = Math.round((value / total) * 100)
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip__label">{name}</p>
      <p className="dash-tooltip__value">{value} task{value !== 1 ? 's' : ''} · {pct}%</p>
    </div>
  )
}

function DashStatusChart({ data, onSegmentClick }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const enriched = data.map((d) => ({ ...d, total }))

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Performance</p>
          <h3 className="dash-panel__title">Task Status</h3>
        </div>
        <span className="dash-panel__badge">{total} total</span>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={enriched}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            onClick={(entry) => entry?.name && onSegmentClick?.(entry.name)}
            style={{ cursor: 'pointer' }}
          >
            {enriched.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="dash-legend">
        {enriched.map((entry) => (
          <button
            key={entry.name}
            type="button"
            className="dash-legend-item"
            onClick={() => onSegmentClick?.(entry.name)}
          >
            <div className="dash-legend-dot" style={{ background: STATUS_COLORS[entry.name] }} />
            {entry.name}
            <strong style={{ marginLeft: 2 }}>({entry.value})</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DashStatusChart
