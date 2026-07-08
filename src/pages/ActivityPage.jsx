import { useMemo, useState } from 'react'
import { FiActivity, FiArchive, FiCheckCircle, FiClock, FiEdit2, FiSearch } from 'react-icons/fi'
import { useAppContext } from '../context/AppContext'
import TaskDrawer from '../components/TaskDrawer'
import '../styles/calendar-activity.css'

function getActionStyle(action) {
  if (/archive/i.test(action)) return { icon: FiArchive, bg: '#fff7ed', color: '#d97706' }
  if (/complete|status/i.test(action)) return { icon: FiCheckCircle, bg: '#f0fdf4', color: '#16a34a' }
  if (/update|edit|note/i.test(action)) return { icon: FiEdit2, bg: '#eff6ff', color: '#2563eb' }
  if (/create|assign|restore/i.test(action)) return { icon: FiClock, bg: '#eef2ff', color: '#4f46e5' }
  return { icon: FiActivity, bg: '#f8fafc', color: '#64748b' }
}

function formatInternName(entryInternName, interns) {
  return interns.find((intern) => intern.id === entryInternName)?.name || entryInternName || 'Unassigned'
}

function buildDescription(entry) {
  if (entry.details) return entry.details
  if (entry.oldValue && entry.newValue && entry.oldValue !== entry.newValue) {
    return `${entry.oldValue} -> ${entry.newValue}`
  }
  return `${entry.action} in ${entry.category || 'General'}`
}

function ActivityPage() {
  const { state, dispatch, interns } = useAppContext()
  const [drawerTaskId, setDrawerTaskId] = useState(null)

  const filters = state.ui.activityFilters
  const tasks = state.tasks
  const activityLog = state.activityLog

  const actionOptions = useMemo(() => ['All', ...new Set(activityLog.map((entry) => entry.action))], [activityLog])

  const filteredLogs = useMemo(() => {
    const query = (filters.search || '').toLowerCase()
    const filtered = activityLog
      .filter((entry) => (filters.action === 'All' ? true : entry.action === filters.action))
      .filter((entry) => {
        if (!query) return true
        const internDisplay = formatInternName(entry.internName, interns)
        return `${entry.action} ${entry.taskTitle} ${internDisplay} ${buildDescription(entry)}`.toLowerCase().includes(query)
      })

    return [...filtered].sort((a, b) => {
      if (filters.sort === 'Oldest') return new Date(a.timestamp) - new Date(b.timestamp)
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
  }, [activityLog, filters, interns])

  const drawerTask = tasks.find((task) => task.id === drawerTaskId) || null

  const openRelatedTask = (entry) => {
    const task = tasks.find((item) => item.id === entry.taskId) || tasks.find((item) => item.title === entry.taskTitle)
    if (task) setDrawerTaskId(task.id)
  }

  return (
    <div className="page activity-page">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="section-label">Activity Log</p>
          <h2>Track every action</h2>
          <p className="section-copy">Monitor task updates, assignments, status changes, restores, and archive actions in one persistent timeline.</p>
        </div>
      </section>

      <section className="panel panel--full activity-panel">
        <div className="activity-toolbar-shell">
          <label className="activity-search">
            <FiSearch />
            <input
              value={filters.search}
              onChange={(event) => dispatch({ type: 'SET_ACTIVITY_FILTERS', payload: { search: event.target.value } })}
              placeholder="Search by action, task, intern, or description"
            />
          </label>

          <div className="activity-toolbar-actions">
            <label className="field field--inline">
              <span>Action</span>
              <select value={filters.action} onChange={(event) => dispatch({ type: 'SET_ACTIVITY_FILTERS', payload: { action: event.target.value } })}>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </label>
            <label className="field field--inline">
              <span>Sort</span>
              <select value={filters.sort} onChange={(event) => dispatch({ type: 'SET_ACTIVITY_FILTERS', payload: { sort: event.target.value } })}>
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
              </select>
            </label>
          </div>
        </div>

        <div className="activity-summary">
          <span className="activity-summary-chip">{filteredLogs.length} visible</span>
          <span className="activity-summary-chip">{activityLog.length} total entries</span>
          {filters.action !== 'All' && <span className="activity-summary-chip">Action: {filters.action}</span>}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="activity-empty">No activity entries match the current filters.</div>
        ) : (
          <div className="activity-list">
            {filteredLogs.map((entry) => {
              const actionStyle = getActionStyle(entry.action)
              const ActionIcon = actionStyle.icon
              const internDisplay = formatInternName(entry.internName, interns)
              const relatedTaskExists = tasks.some((task) => task.id === entry.taskId || task.title === entry.taskTitle)
              return (
                <article key={entry.id} className="activity-card" onClick={() => relatedTaskExists && openRelatedTask(entry)}>
                  <div className="activity-card__icon" style={{ background: actionStyle.bg, color: actionStyle.color }}>
                    <ActionIcon />
                  </div>
                  <div className="activity-card__main">
                    <div className="activity-card__top">
                      <span className="activity-card__action">{entry.action}</span>
                      <span className="activity-badge" style={{ background: `${actionStyle.color}14`, color: actionStyle.color }}>{entry.category || 'General'}</span>
                    </div>
                    <div className="activity-card__task">{entry.taskTitle || 'Unknown Task'}</div>
                    <p className="activity-card__meta">Assigned Intern: {internDisplay} · Manager: {entry.manager || 'Ayesha Noor'}</p>
                    <p className="activity-card__desc">{buildDescription(entry)}</p>
                  </div>
                  <div className="activity-card__side">
                    <span className="activity-card__time">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="activity-card__date">{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <TaskDrawer
        isOpen={Boolean(drawerTask)}
        task={drawerTask}
        interns={interns}
        activityLog={state.activityLog}
        onClose={() => setDrawerTaskId(null)}
        onSave={(values) => {
          dispatch({ type: 'UPDATE_TASK', payload: { id: drawerTask.id, values } })
          setDrawerTaskId(null)
        }}
        onDuplicate={() => {
          dispatch({ type: 'DUPLICATE_TASK', payload: drawerTask.id })
          setDrawerTaskId(null)
        }}
        onArchive={() => {
          dispatch({ type: 'ARCHIVE_TASK', payload: drawerTask.id })
          setDrawerTaskId(null)
        }}
        onDelete={() => {
          dispatch({ type: 'DELETE_TASK', payload: drawerTask.id })
          setDrawerTaskId(null)
        }}
        onRestore={() => {
          dispatch({ type: 'RESTORE_TASK', payload: drawerTask.id })
          setDrawerTaskId(null)
        }}
        onAddNote={(note) => dispatch({ type: 'ADD_NOTE', payload: { taskId: drawerTask.id, note } })}
        onDeleteNote={(noteId) => dispatch({ type: 'DELETE_NOTE', payload: { taskId: drawerTask.id, noteId } })}
      />
    </div>
  )
}

export default ActivityPage
