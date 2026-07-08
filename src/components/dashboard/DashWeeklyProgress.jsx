import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { normalizeWeek } from '../../services/taskService'

function DashWeeklyProgress({ allTasks }) {
  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const weekKey = `Week-${String(i + 1).padStart(2, '0')}`
      const wTasks = allTasks.filter(
        (t) => !t.archived && normalizeWeek(t.week) === weekKey
      )
      return {
        name: `W${i + 1}`,
        total: wTasks.length,
        completed: wTasks.filter((t) => t.status === 'Completed').length,
      }
    })
  }, [allTasks])

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Trend</p>
          <h3 className="dash-panel__title">Weekly Progress</h3>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="wkGradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="wkGradDone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#17a673" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#17a673" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
              fontSize: '0.8rem',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#3b82f6"
            fill="url(#wkGradTotal)"
            strokeWidth={2}
            name="Total"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#17a673"
            fill="url(#wkGradDone)"
            strokeWidth={2}
            name="Completed"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="dash-legend" style={{ marginTop: 10 }}>
        <span className="dash-legend-item" style={{ cursor: 'default' }}>
          <div className="dash-legend-dot" style={{ background: '#3b82f6' }} />
          Total Tasks
        </span>
        <span className="dash-legend-item" style={{ cursor: 'default' }}>
          <div className="dash-legend-dot" style={{ background: '#17a673' }} />
          Completed
        </span>
      </div>
    </div>
  )
}

export default DashWeeklyProgress
