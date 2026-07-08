import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiSearch, FiBell, FiPlus,
  FiList, FiUsers, FiCheckSquare,
  FiActivity, FiAlertCircle, FiArchive,
} from 'react-icons/fi'

import { useAppContext } from '../context/AppContext'
import {
  getTaskSummary,
  getStatusBreakdown,
  getCategoryBreakdown,
  getInternWorkload,
  isTaskOverdue,
} from '../utils/taskUtils'
import {
  getPriorityBreakdown,
  normalizeWeek,
  CURRENT_WEEK,
} from '../services/taskService'

import DashSummaryCard       from '../components/dashboard/DashSummaryCard'
import DashWeekNav           from '../components/dashboard/DashWeekNav'
import DashStatusChart       from '../components/dashboard/DashStatusChart'
import DashPriorityChart     from '../components/dashboard/DashPriorityChart'
import DashCategoryChart     from '../components/dashboard/DashCategoryChart'
import DashInternWorkload    from '../components/dashboard/DashInternWorkload'
import DashUpcomingDeadlines from '../components/dashboard/DashUpcomingDeadlines'
import DashRecentActivity    from '../components/dashboard/DashRecentActivity'
import DashTopPerformers     from '../components/dashboard/DashTopPerformers'
import DashMostDelayed       from '../components/dashboard/DashMostDelayed'
import DashCompletionStats   from '../components/dashboard/DashCompletionStats'
import DashWeeklyProgress    from '../components/dashboard/DashWeeklyProgress'
import DashAvgCompTime       from '../components/dashboard/DashAvgCompTime'
import DashNotifications     from '../components/dashboard/DashNotifications'
import TaskDrawer            from '../components/TaskDrawer'

import '../styles/dashboard.css'

const NOTIF_KEY = 'safex-notif-read'

function buildWeekKey(num) {
  return `Week-${String(num).padStart(2, '0')}`
}

function parsWeekNum(weekStr) {
  return parseInt(String(weekStr || '').replace('Week-', ''), 10) || 1
}

function getTrend(current, prev) {
  if (prev === 0 && current === 0) return { dir: 'neutral', text: '—' }
  if (prev === 0) return { dir: 'up', text: '+100%' }
  const change = Math.round(((current - prev) / prev) * 100)
  if (change === 0) return { dir: 'neutral', text: '0%' }
  return {
    dir: change > 0 ? 'up' : 'down',
    text: `${change > 0 ? '+' : ''}${change}%`,
  }
}

// eslint-disable-next-line no-unused-vars
function DashboardPage({ tasks, interns: _internsProp, onCreateTask, onOpenTask }) {
  const { state, dispatch, interns } = useAppContext()
  const navigate = useNavigate()

  // ── Local UI state ──
  const [dashWeek, setDashWeek] = useState(CURRENT_WEEK)
  const [search, setSearch]     = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]') } catch { return [] }
  })
  const [drawerTaskId, setDrawerTaskId] = useState(null)
  const notifRef = useRef(null)

  // Close notification panel on outside click
  useEffect(() => {
    if (!notifOpen) return
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  const weekNum = parsWeekNum(dashWeek)

  // ── Derived task sets ──
  const allTasks = state.tasks

  const weekTasks = useMemo(
    () => allTasks.filter((t) => !t.archived && normalizeWeek(t.week) === dashWeek),
    [allTasks, dashWeek]
  )

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return weekTasks
    return weekTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        interns.find((i) => i.id === t.assignedInternId)?.name.toLowerCase().includes(q)
    )
  }, [weekTasks, search, interns])

  const prevWeekTasks = useMemo(() => {
    if (weekNum <= 1) return []
    const prevKey = buildWeekKey(weekNum - 1)
    return allTasks.filter((t) => !t.archived && normalizeWeek(t.week) === prevKey)
  }, [allTasks, weekNum])

  // ── Summary metrics ──
  const summary     = useMemo(() => getTaskSummary(weekTasks),     [weekTasks])
  const prevSummary = useMemo(() => getTaskSummary(prevWeekTasks), [prevWeekTasks])

  const archivedCount = useMemo(
    () => allTasks.filter((t) => t.archived && normalizeWeek(t.week) === dashWeek).length,
    [allTasks, dashWeek]
  )

  const maxForBar = Math.max(summary.total, 1)

  // ── Chart data ──
  const statusData   = useMemo(() => getStatusBreakdown(filteredTasks),   [filteredTasks])
  const priorityData = useMemo(() => getPriorityBreakdown(filteredTasks), [filteredTasks])
  const categoryData = useMemo(() => getCategoryBreakdown(filteredTasks), [filteredTasks])

  // ── Workload ──
  const workload = useMemo(
    () => getInternWorkload(filteredTasks, interns),
    [filteredTasks, interns]
  )

  // ── Notifications ──
  const notifications = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const active = allTasks.filter((t) => !t.archived)
    const items = []

    active
      .filter((t) => isTaskOverdue(t))
      .slice(0, 5)
      .forEach((t) => {
        items.push({
          id: `ov-${t.id}`,
          type: 'overdue',
          title: 'Task Overdue',
          detail: t.title,
          taskId: t.id,
          time: t.dueDate ? `${t.dueDate}T00:00:00` : new Date().toISOString(),
        })
      })

    active
      .filter((t) => t.dueDate === today && !isTaskOverdue(t))
      .forEach((t) => {
        items.push({
          id: `td-${t.id}`,
          type: 'due_today',
          title: 'Due Today',
          detail: t.title,
          taskId: t.id,
          time: new Date().toISOString(),
        })
      })

    state.activityLog.slice(0, 5).forEach((entry) => {
      items.push({
        id: entry.id,
        type: 'activity',
        title: entry.action,
        detail: entry.taskTitle,
        taskId: null,
        time: entry.timestamp,
      })
    })

    return items
  }, [allTasks, state.activityLog])

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  // ── Navigation helpers ──
  const navigateFiltered = useCallback(
    (filter) => {
      dispatch({ type: 'SET_TASK_FILTERS', payload: filter })
      navigate('/tasks')
    },
    [dispatch, navigate]
  )

  const handleInternClick   = useCallback((internId) => navigateFiltered({ intern: internId, week: 'All' }), [navigateFiltered])
  const handleStatusClick   = useCallback((status)   => navigateFiltered({ status, week: 'All' }),           [navigateFiltered])
  const handlePriorityClick = useCallback((priority) => navigateFiltered({ priority, week: 'All' }),         [navigateFiltered])
  const handleCategoryClick = useCallback((category) => navigateFiltered({ category, week: 'All' }),         [navigateFiltered])

  const cardClick = {
    total:     () => navigateFiltered({ status: 'All',        week: dashWeek }),
    assigned:  () => navigateFiltered({ status: 'All',        week: dashWeek }),
    completed: () => navigateFiltered({ status: 'Completed',  week: dashWeek }),
    pending:   () => navigateFiltered({ status: 'Not Started', week: dashWeek }),
    overdue:   () => navigateFiltered({ overdueOnly: true,    week: 'All' }),
    archived:  () => navigateFiltered({ archived: true,       week: dashWeek }),
  }

  // ── Notification handlers ──
  const handleMarkRead = useCallback(() => {
    const ids = notifications.map((n) => n.id)
    setReadIds(ids)
    localStorage.setItem(NOTIF_KEY, JSON.stringify(ids))
  }, [notifications])

  const handleNotifItem = useCallback((notif) => {
    if (notif.taskId) {
      setDrawerTaskId(notif.taskId)
      setNotifOpen(false)
    }
    setReadIds((prev) => {
      if (prev.includes(notif.id)) return prev
      const next = [...prev, notif.id]
      localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  // ── Activity click → open drawer ──
  const handleActivityClick = useCallback(
    (entry) => {
      const task = allTasks.find((t) => t.title === entry.taskTitle)
      if (task) setDrawerTaskId(task.id)
    },
    [allTasks]
  )

  // ── Drawer task ──
  const drawerTask = allTasks.find((t) => t.id === drawerTaskId) || null

  // ── Trends ──
  const totalTrend     = getTrend(summary.total,     prevSummary.total)
  const completedTrend = getTrend(summary.completed, prevSummary.completed)
  const overdueTrend   = getTrend(summary.overdue,   prevSummary.overdue)
  const pendingTrend   = getTrend(summary.pending,   prevSummary.pending)

  return (
    <>
      <div className="page dash-page">

        {/* ── Header ── */}
        <div className="dash-header">
          <div className="dash-header__left">
            <p className="section-label">Manager Overview</p>
            <h2 className="dash-header__title">Dashboard</h2>
            <p className="dash-header__subtitle">
              Monitor intern tasks, progress, and team performance.
            </p>
          </div>
          <div className="dash-header__right">
            <label className="dash-search">
              <FiSearch size={15} />
              <input
                type="text"
                placeholder="Search tasks, interns, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="dash-notif-trigger"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Open notifications"
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="dash-notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <DashNotifications
                  notifications={notifications}
                  readIds={readIds}
                  onMarkRead={handleMarkRead}
                  onClose={() => setNotifOpen(false)}
                  onItemClick={handleNotifItem}
                />
              )}
            </div>

            <button type="button" className="primary-button" onClick={onCreateTask}>
              <FiPlus size={16} />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* ── Row 1: Week Navigator ── */}
        <DashWeekNav
          currentWeek={dashWeek}
          taskCount={weekTasks.length}
          onPrev={() => weekNum > 1  && setDashWeek(buildWeekKey(weekNum - 1))}
          onNext={() => weekNum < 12 && setDashWeek(buildWeekKey(weekNum + 1))}
          onReset={() => setDashWeek(CURRENT_WEEK)}
        />

        {/* ── Row 1: Summary Cards ── */}
        <div className="dash-summary-grid">
          <DashSummaryCard
            label="Total Tasks"
            value={summary.total}
            Icon={FiList}
            accent="#3b82f6"
            trendDir={totalTrend.dir}
            trendText={totalTrend.text}
            barPercent={(summary.total / maxForBar) * 100}
            onClick={cardClick.total}
          />
          <DashSummaryCard
            label="Assigned Tasks"
            value={summary.assigned}
            Icon={FiUsers}
            accent="#7c3aed"
            trendDir="neutral"
            trendText={
              summary.total
                ? `${Math.round((summary.assigned / summary.total) * 100)}% of total`
                : '0%'
            }
            barPercent={(summary.assigned / maxForBar) * 100}
            onClick={cardClick.assigned}
          />
          <DashSummaryCard
            label="Completed Tasks"
            value={summary.completed}
            Icon={FiCheckSquare}
            accent="#17a673"
            trendDir={completedTrend.dir}
            trendText={completedTrend.text}
            barPercent={(summary.completed / maxForBar) * 100}
            onClick={cardClick.completed}
          />
          <DashSummaryCard
            label="Pending Tasks"
            value={summary.pending}
            Icon={FiActivity}
            accent="#f59e0b"
            trendDir={pendingTrend.dir}
            trendText={pendingTrend.text}
            barPercent={(summary.pending / maxForBar) * 100}
            onClick={cardClick.pending}
          />
          <DashSummaryCard
            label="Overdue Tasks"
            value={summary.overdue}
            Icon={FiAlertCircle}
            accent="#dc2626"
            trendDir={overdueTrend.dir}
            trendText={overdueTrend.text}
            barPercent={(summary.overdue / maxForBar) * 100}
            onClick={cardClick.overdue}
          />
          <DashSummaryCard
            label="Archived Tasks"
            value={archivedCount}
            Icon={FiArchive}
            accent="#64748b"
            trendDir="neutral"
            trendText="this period"
            barPercent={(archivedCount / maxForBar) * 100}
            onClick={cardClick.archived}
          />
        </div>

        {/* ── Row 2: Status + Priority ── */}
        <div className="dash-row-2">
          <DashStatusChart data={statusData} onSegmentClick={handleStatusClick} />
          <DashPriorityChart data={priorityData} onBarClick={handlePriorityClick} />
        </div>

        {/* ── Row 3: Workload + Category ── */}
        <div className="dash-row-2">
          <DashInternWorkload workload={workload} onInternClick={handleInternClick} />
          <DashCategoryChart data={categoryData} onBarClick={handleCategoryClick} />
        </div>

        {/* ── Row 4: Deadlines + Activity ── */}
        <div className="dash-row-2">
          <DashUpcomingDeadlines
            tasks={filteredTasks}
            interns={interns}
            onTaskClick={setDrawerTaskId}
          />
          <DashRecentActivity
            activityLog={state.activityLog}
            onEntryClick={handleActivityClick}
          />
        </div>

        {/* ── Row 5: Top Performers + Most Delayed ── */}
        <div className="dash-row-2">
          <DashTopPerformers workload={workload} onInternClick={handleInternClick} />
          <DashMostDelayed   workload={workload} onInternClick={handleInternClick} />
        </div>

        {/* ── Row 6: Stats + Weekly Progress + Avg Time ── */}
        <div className="dash-row-3">
          <DashCompletionStats allTasks={allTasks} interns={interns} />
          <DashWeeklyProgress  allTasks={allTasks} />
          <DashAvgCompTime     allTasks={allTasks} />
        </div>

      </div>

      {/* ── Task Drawer ── */}
      <TaskDrawer
        isOpen={!!drawerTaskId}
        task={drawerTask}
        interns={interns}
        activityLog={state.activityLog}
        onClose={() => setDrawerTaskId(null)}
        onSave={(form) => {
          dispatch({ type: 'UPDATE_TASK', payload: { id: drawerTaskId, values: form } })
          setDrawerTaskId(null)
        }}
        onDuplicate={() => {
          dispatch({ type: 'DUPLICATE_TASK', payload: drawerTaskId })
          setDrawerTaskId(null)
        }}
        onArchive={() => {
          if (window.confirm('Archive this task?')) {
            dispatch({ type: 'ARCHIVE_TASK', payload: drawerTaskId })
          }
          setDrawerTaskId(null)
        }}
        onDelete={() => {
          if (window.confirm('Delete this task?')) {
            dispatch({ type: 'DELETE_TASK', payload: drawerTaskId })
          }
          setDrawerTaskId(null)
        }}
        onRestore={() => {
          dispatch({ type: 'RESTORE_TASK', payload: drawerTaskId })
          setDrawerTaskId(null)
        }}
        onAddNote={(note) => dispatch({ type: 'ADD_NOTE', payload: { taskId: drawerTaskId, note } })}
        onDeleteNote={(noteId) => dispatch({ type: 'DELETE_NOTE', payload: { taskId: drawerTaskId, noteId } })}
      />
    </>
  )
}

export default DashboardPage
