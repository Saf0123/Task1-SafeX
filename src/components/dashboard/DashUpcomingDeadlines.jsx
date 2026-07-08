import { parseISO, differenceInCalendarDays, startOfDay } from 'date-fns'
import { isTaskOverdue } from '../../utils/taskUtils'

const PRIORITY_COLORS = { High: '#dc2626', Medium: '#f59e0b', Low: '#16a34a' }

function getDueLabel(task) {
  if (isTaskOverdue(task)) {
    const days = differenceInCalendarDays(startOfDay(new Date()), parseISO(task.dueDate))
    return { label: `${days}d overdue`, cls: 'dash-deadline-due--overdue' }
  }
  const diff = differenceInCalendarDays(parseISO(task.dueDate), startOfDay(new Date()))
  if (diff === 0) return { label: 'Today', cls: 'dash-deadline-due--today' }
  if (diff === 1) return { label: 'Tomorrow', cls: 'dash-deadline-due--tomorrow' }
  return { label: `${diff}d left`, cls: 'dash-deadline-due--upcoming' }
}

function getItemClass(task) {
  if (isTaskOverdue(task)) return 'dash-deadline-item--overdue'
  try {
    const diff = differenceInCalendarDays(parseISO(task.dueDate), startOfDay(new Date()))
    if (diff === 0) return 'dash-deadline-item--today'
    if (diff === 1) return 'dash-deadline-item--tomorrow'
  } catch { /* noop */ }
  return ''
}

function DashUpcomingDeadlines({ tasks, interns, onTaskClick }) {
  const sorted = [...tasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => {
      const aOv = isTaskOverdue(a)
      const bOv = isTaskOverdue(b)
      if (aOv !== bOv) return aOv ? -1 : 1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
    .slice(0, 10)

  const getInternName = (id) => interns.find((i) => i.id === id)?.name || 'Unassigned'

  return (
    <div className="dash-panel">
      <div className="dash-panel__header">
        <div className="dash-panel__title-block">
          <p className="dash-panel__eyebrow">Timeline</p>
          <h3 className="dash-panel__title">Upcoming Deadlines</h3>
        </div>
        <span className="dash-panel__badge">{sorted.length} tasks</span>
      </div>

      {sorted.length === 0 ? (
        <div className="dash-empty"><p>No upcoming deadlines.</p></div>
      ) : (
        <div className="dash-deadline-list">
          {sorted.map((task) => {
            const { label, cls } = getDueLabel(task)
            const itemCls = getItemClass(task)
            return (
              <div
                key={task.id}
                className={`dash-deadline-item ${itemCls}`}
                onClick={() => onTaskClick?.(task.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onTaskClick?.(task.id)}
              >
                <div className="dash-deadline-info">
                  <p className="dash-deadline-title">{task.title}</p>
                  <p className="dash-deadline-meta">
                    <span>{getInternName(task.assignedInternId)}</span>
                    <span>·</span>
                    <span
                      className="dash-priority-pill"
                      style={{
                        background: `${PRIORITY_COLORS[task.priority]}1a`,
                        color: PRIORITY_COLORS[task.priority],
                      }}
                    >
                      {task.priority}
                    </span>
                    <span>·</span>
                    <span>{task.category}</span>
                  </p>
                </div>
                <span className={`dash-deadline-due ${cls}`}>{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DashUpcomingDeadlines
