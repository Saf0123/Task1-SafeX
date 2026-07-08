import { useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, endOfWeek, getDay, addMonths, addWeeks, subMonths, subWeeks } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useAppContext } from '../context/AppContext'
import { getPriorityColor, getTaskStatusColor, isTaskOverdue } from '../utils/taskUtils'
import TaskDrawer from '../components/TaskDrawer'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar-activity.css'

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } })

function CalendarPage() {
  const { state, dispatch, interns } = useAppContext()
  const [currentView, setCurrentView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [drawerTaskId, setDrawerTaskId] = useState(null)

  const filters = state.ui.calendarFilters
  const tasks = state.tasks

  const filteredTasks = useMemo(() => (
    tasks
      .filter((task) => !task.archived)
      .filter((task) => (filters.intern === 'All' ? true : task.assignedInternId === filters.intern))
      .filter((task) => (filters.status === 'All' ? true : task.status === filters.status))
      .filter((task) => (filters.priority === 'All' ? true : task.priority === filters.priority))
      .filter((task) => (filters.category === 'All' ? true : task.category === filters.category))
      .filter((task) => task.dueDate)
  ), [tasks, filters])

  const events = useMemo(() => (
    filteredTasks.map((task) => {
      const due = new Date(task.dueDate)
      return {
        id: task.id,
        title: task.title,
        start: due,
        end: due,
        allDay: true,
        resource: task,
        statusColor: getTaskStatusColor(task.status),
        priorityColor: getPriorityColor(task.priority),
      }
    })
  ), [filteredTasks])

  const drawerTask = tasks.find((task) => task.id === drawerTaskId) || null

  const eventStyleGetter = (event) => {
    const task = event.resource
    const completed = task.status === 'Completed'
    const overdue = isTaskOverdue(task)

    return {
      style: {
        backgroundColor: completed ? 'rgba(23, 166, 115, 0.16)' : `${event.statusColor}1f`,
        color: completed ? '#166534' : '#0f172a',
        borderRadius: '12px',
        border: overdue ? '1px solid #dc2626' : `1px solid ${event.statusColor}26`,
        borderLeft: `4px solid ${overdue ? '#dc2626' : event.priorityColor}`,
        padding: '3px 8px',
        fontWeight: 600,
        opacity: completed ? 0.78 : 1,
      },
    }
  }

  const navigateRange = (direction) => {
    if (currentView === 'week') {
      setCurrentDate((prev) => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1))
      return
    }
    setCurrentDate((prev) => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1))
  }

  const currentLabel = currentView === 'week'
    ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
    : format(currentDate, 'MMMM yyyy')

  return (
    <div className="page calendar-page">
      <section className="hero-panel hero-panel--compact">
        <div>
          <p className="section-label">Calendar</p>
          <h2>Track delivery dates visually</h2>
          <p className="section-copy">Monitor deadlines in month and week views with filters, status colors, and direct task access.</p>
        </div>
      </section>

      <section className="panel panel--full calendar-panel">
        <div className="calendar-toolbar-shell">
          <div className="calendar-toolbar-actions">
            <div className="calendar-nav-group">
              <button className="icon-button" type="button" onClick={() => navigateRange('prev')} aria-label="Previous period">
                <FiChevronLeft />
              </button>
              <div className="calendar-nav-label">{currentLabel}</div>
              <button className="icon-button" type="button" onClick={() => navigateRange('next')} aria-label="Next period">
                <FiChevronRight />
              </button>
            </div>
            <button className="secondary-button" type="button" onClick={() => setCurrentDate(new Date())}>
              <FiCalendar />
              Today
            </button>
          </div>

          <div className="calendar-toolbar-actions">
            <button className={`secondary-button ${currentView === 'month' ? 'calendar-view-btn--active' : ''}`} type="button" onClick={() => setCurrentView('month')}>
              Month
            </button>
            <button className={`secondary-button ${currentView === 'week' ? 'calendar-view-btn--active' : ''}`} type="button" onClick={() => setCurrentView('week')}>
              Week
            </button>
          </div>
        </div>

        <div className="calendar-filter-grid">
          <label className="field field--inline">
            <span>Assigned Intern</span>
            <select value={filters.intern} onChange={(event) => dispatch({ type: 'SET_CALENDAR_FILTERS', payload: { intern: event.target.value } })}>
              <option value="All">All</option>
              {interns.map((intern) => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>
          </label>
          <label className="field field--inline">
            <span>Status</span>
            <select value={filters.status} onChange={(event) => dispatch({ type: 'SET_CALENDAR_FILTERS', payload: { status: event.target.value } })}>
              <option value="All">All</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="field field--inline">
            <span>Priority</span>
            <select value={filters.priority} onChange={(event) => dispatch({ type: 'SET_CALENDAR_FILTERS', payload: { priority: event.target.value } })}>
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label className="field field--inline">
            <span>Category</span>
            <select value={filters.category} onChange={(event) => dispatch({ type: 'SET_CALENDAR_FILTERS', payload: { category: event.target.value } })}>
              <option value="All">All</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="QA">QA</option>
              <option value="Research">Research</option>
              <option value="Operations">Operations</option>
              <option value="Content">Content</option>
            </select>
          </label>
        </div>

        <div className="calendar-legend">
          <span className="calendar-legend-item"><span className="calendar-legend-dot" style={{ background: '#64748b' }} /> Not Started</span>
          <span className="calendar-legend-item"><span className="calendar-legend-dot" style={{ background: '#3b82f6' }} /> In Progress</span>
          <span className="calendar-legend-item"><span className="calendar-legend-dot" style={{ background: '#f59e0b' }} /> Under Review</span>
          <span className="calendar-legend-item"><span className="calendar-legend-dot" style={{ background: '#17a673' }} /> Completed</span>
          <span className="calendar-legend-item"><span className="calendar-legend-dot" style={{ background: '#dc2626' }} /> Overdue</span>
        </div>

        {events.length === 0 ? (
          <div className="calendar-empty">No calendar events match the current filters.</div>
        ) : (
          <div className="calendar-shell calendar-shell--enhanced">
            <div className="calendar-shell__inner">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                onNavigate={setCurrentDate}
                view={currentView}
                onView={setCurrentView}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => setDrawerTaskId(event.resource.id)}
                views={['month', 'week']}
                popup
                toolbar={false}
              />
            </div>
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

export default CalendarPage
