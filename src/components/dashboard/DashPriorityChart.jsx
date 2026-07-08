import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PRIORITY_COLORS = {
  High:   '#dc2626',
  Medium: '#f59e0b',
  Low:    '#16a34a',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip__label">{label} Priority</p>
      <p className="dash-tooltip__value">{payload[0].value} task{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function DashPriorityChart({ data, onBarClick }) {
  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Urgency</p>
          <h3 className="dash-panel__title">Priority Distribution</h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            maxBarSize={64}
            onClick={(entry) => entry?.name && onBarClick?.(entry.name)}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="dash-legend">
        {data.map((entry) => (
          <button
            key={entry.name}
            type="button"
            className="dash-legend-item"
            onClick={() => onBarClick?.(entry.name)}
          >
            <div className="dash-legend-dot" style={{ background: PRIORITY_COLORS[entry.name] }} />
            {entry.name}
            <strong style={{ marginLeft: 2 }}>({entry.value})</strong>
          </button>
        ))}
      </div>
    </div>
  )
}

export default DashPriorityChart
