import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CATEGORY_COLORS = [
  '#2563eb', '#7c3aed', '#16a34a', '#d97706',
  '#dc2626', '#0891b2', '#db2777', '#059669',
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="dash-tooltip">
      <p className="dash-tooltip__label">{label}</p>
      <p className="dash-tooltip__value">{payload[0].value} task{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

function DashCategoryChart({ data, onBarClick }) {
  const filtered = data.filter((d) => d.value > 0)

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Distribution</p>
          <h3 className="dash-panel__title">Category Mix</h3>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="dash-empty"><p>No category data for this period.</p></div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={filtered}
            layout="vertical"
            margin={{ top: 0, right: 8, bottom: 0, left: 6 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={78}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
            <Bar
              dataKey="value"
              radius={[0, 8, 8, 0]}
              maxBarSize={18}
              onClick={(entry) => entry?.name && onBarClick?.(entry.name)}
              style={{ cursor: 'pointer' }}
            >
              {filtered.map((entry, i) => (
                <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default DashCategoryChart
