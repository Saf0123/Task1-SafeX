import { format, parseISO, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns'
import { initialActivityLog, initialTasks } from '../data/mockData'

export const STORAGE_KEYS = {
  tasks: 'safex-tasks',
  activity: 'safex-activity',
  theme: 'safex-theme',
  sidebarCollapsed: 'safex-sidebar',
  taskFilters: 'safex-task-filters',
  calendarFilters: 'safex-calendar-filters',
  reportFilters: 'safex-report-filters',
  reportType: 'safex-report-type',
  activityFilters: 'safex-activity-filters',
  tasksView: 'safex-tasks-view',
  tasksSortField: 'safex-tasks-sort-field',
  tasksSortDir: 'safex-tasks-sort-dir',
  tasksPageSize: 'safex-tasks-page-size',
}

export const CURRENT_WEEK = 'Week-01'

export const normalizeWeek = (value) => {
  if (!value) return CURRENT_WEEK
  if (String(value).startsWith('Week')) return value
  if (String(value).startsWith('W')) return CURRENT_WEEK
  return value
}

export const readStoredState = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  const stored = window.localStorage.getItem(key)
  if (!stored) return fallback
  try {
    return JSON.parse(stored)
  } catch {
    return fallback
  }
}

export const writeStoredState = (key, value) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const createTaskRecord = (values) => ({
  id: `task-${Date.now()}`,
  title: values.title,
  description: values.description || 'No description provided.',
  assignedInternId: values.assignedInternId,
  week: normalizeWeek(values.week || CURRENT_WEEK),
  dueDate: values.dueDate,
  priority: values.priority,
  status: values.status,
  category: values.category,
  estimatedTime: values.estimatedTime,
  notes: values.notes || '',
  archived: false,
  createdAt: new Date().toISOString(),
  history: ['Task created'],
})

export const updateTaskRecord = (task, values) => ({
  ...task,
  ...values,
  week: normalizeWeek(values.week || task.week),
  history: [...(task.history || []), 'Task updated'],
})

export const archiveTaskRecord = (task) => ({
  ...task,
  archived: true,
  history: [...(task.history || []), 'Task archived'],
})

export const restoreTaskRecord = (task) => ({
  ...task,
  archived: false,
  history: [...(task.history || []), 'Task restored'],
})

export const duplicateTaskRecord = (task) => ({
  ...task,
  id: `task-${Date.now()}`,
  title: `${task.title} (Copy)`,
  archived: false,
  createdAt: new Date().toISOString(),
  history: [...(task.history || []), 'Task duplicated'],
})

export const buildActivityEntry = ({ action, task, internId, oldValue, newValue, category, manager = 'Ayesha Noor', details }) => ({
  id: `${Date.now()}-${Math.random()}`,
  timestamp: new Date().toISOString(),
  manager,
  action,
  taskId: task?.id || null,
  taskTitle: task?.title || 'Task',
  internName: internId || task?.assignedInternId || 'Unassigned',
  oldValue: oldValue || '—',
  newValue: newValue || '—',
  category: category || task?.category || 'General',
  details: details || `${action}${task?.title ? ` · ${task.title}` : ''}`,
})

export const getTaskSummary = (tasks) => {
  const active = tasks.filter((task) => !task.archived)
  const total = active.length
  const completed = active.filter((task) => task.status === 'Completed').length
  const assigned = active.filter((task) => task.assignedInternId).length
  const pending = active.filter((task) => task.status !== 'Completed').length
  const overdue = active.filter((task) => isTaskOverdue(task)).length
  return {
    total,
    assigned,
    completed,
    pending,
    overdue,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  }
}

export const getStatusBreakdown = (tasks) => {
  const active = tasks.filter((task) => !task.archived)
  return ['Not Started', 'In Progress', 'Under Review', 'Completed'].map((status) => ({
    name: status,
    value: active.filter((task) => task.status === status).length,
  }))
}

export const getCategoryBreakdown = (tasks) => {
  const active = tasks.filter((task) => !task.archived)
  return ['Design', 'Development', 'QA', 'Research', 'Operations', 'Content'].map((category) => ({
    name: category,
    value: active.filter((task) => task.category === category).length,
  }))
}

export const getPriorityBreakdown = (tasks) => {
  const active = tasks.filter((task) => !task.archived)
  return ['High', 'Medium', 'Low'].map((priority) => ({
    name: priority,
    value: active.filter((task) => task.priority === priority).length,
  }))
}

export const getInternWorkload = (tasks, interns) => {
  return interns.map((intern) => {
    const assignedTasks = tasks.filter((task) => !task.archived && task.assignedInternId === intern.id)
    const completed = assignedTasks.filter((task) => task.status === 'Completed').length
    const pending = assignedTasks.filter((task) => task.status !== 'Completed').length
    const overdue = assignedTasks.filter((task) => isTaskOverdue(task)).length
    return {
      ...intern,
      assignedTasks: assignedTasks.length,
      completed,
      pending,
      overdue,
      progress: assignedTasks.length ? Math.round((completed / assignedTasks.length) * 100) : 0,
    }
  })
}

export const getUpcomingAlerts = (tasks) => {
  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const thisWeekEnd = new Date(today)
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)
  return {
    dueToday: tasks.filter((task) => !task.archived && task.dueDate === format(today, 'yyyy-MM-dd')),
    dueTomorrow: tasks.filter((task) => !task.archived && task.dueDate === format(tomorrow, 'yyyy-MM-dd')),
    dueThisWeek: tasks.filter((task) => !task.archived && task.dueDate && parseISO(task.dueDate) >= today && parseISO(task.dueDate) <= thisWeekEnd),
    overdue: tasks.filter((task) => !task.archived && isTaskOverdue(task)),
  }
}

export const getDaysOverdue = (task) => {
  if (!isTaskOverdue(task)) return 0
  return differenceInCalendarDays(startOfDay(new Date()), parseISO(task.dueDate))
}

export const isTaskOverdue = (task) => {
  if (!task?.dueDate || task.status === 'Completed') return false
  return isBefore(parseISO(task.dueDate), startOfDay(new Date()))
}

export const formatDisplayDate = (value) => {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d, yyyy')
  } catch {
    return value
  }
}

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return '#dc2626'
    case 'Medium': return '#f59e0b'
    default: return '#16a34a'
  }
}

export const getTaskStatusColor = (status) => {
  switch (status) {
    case 'Completed': return '#17a673'
    case 'Under Review': return '#f59e0b'
    case 'In Progress': return '#3b82f6'
    default: return '#64748b'
  }
}

export const buildCsv = (tasks) => {
  const headers = ['Title', 'Assigned Intern', 'Week', 'Due Date', 'Priority', 'Status', 'Category', 'Estimated Time']
  const rows = tasks.map((task) => [task.title, task.assignedInternId, task.week, task.dueDate, task.priority, task.status, task.category, task.estimatedTime])
  const csvRows = [headers, ...rows].map((row) => row.join(','))
  return csvRows.join('\n')
}

export const getInitialAppState = () => ({
  tasks: readStoredState(STORAGE_KEYS.tasks, initialTasks),
  activityLog: readStoredState(STORAGE_KEYS.activity, initialActivityLog),
  ui: {
    sidebarCollapsed: readStoredState(STORAGE_KEYS.sidebarCollapsed, false),
    theme: readStoredState(STORAGE_KEYS.theme, 'light'),
    searchQuery: '',
    currentWeek: CURRENT_WEEK,
    taskFilters: {
      week: CURRENT_WEEK,
      intern: 'All',
      status: 'All',
      priority: 'All',
      category: 'All',
      dueDate: 'All',
      overdueOnly: false,
      archived: false,
    },
    calendarFilters: {
      intern: 'All',
      category: 'All',
      priority: 'All',
      status: 'All',
    },
    reportFilters: {
      week: CURRENT_WEEK,
      intern: 'All',
      category: 'All',
      priority: 'All',
      status: 'All',
      includeArchived: false,
    },
    reportType: 'Task Summary',
    activityFilters: {
      search: '',
      action: 'All',
      sort: 'Newest',
    },
    selectedTaskId: null,
    modalOpen: false,
    editingTaskId: null,
    activeView: 'table',
    notificationOpen: false,
  },
})

export const filterTasks = (tasks, filters, searchQuery = '') => {
  const normalizedSearch = searchQuery.toLowerCase()
  return tasks
    .filter((task) => !task.archived || filters.archived)
    .filter((task) => (filters.week === 'All' ? true : normalizeWeek(task.week) === normalizeWeek(filters.week)))
    .filter((task) => (filters.intern === 'All' ? true : task.assignedInternId === filters.intern))
    .filter((task) => (filters.status === 'All' ? true : task.status === filters.status))
    .filter((task) => (filters.priority === 'All' ? true : task.priority === filters.priority))
    .filter((task) => (filters.category === 'All' ? true : task.category === filters.category))
    .filter((task) => (filters.overdueOnly ? isTaskOverdue(task) : true))
    .filter((task) => !normalizedSearch || task.title.toLowerCase().includes(normalizedSearch) || task.description.toLowerCase().includes(normalizedSearch))
}

export const buildReport = (tasks, filters, reportType) => {
  const filtered = tasks.filter((task) => {
    const matchesWeek = filters.week === 'All' || normalizeWeek(task.week) === normalizeWeek(filters.week)
    const matchesIntern = filters.intern === 'All' || task.assignedInternId === filters.intern
    const matchesCategory = filters.category === 'All' || task.category === filters.category
    const matchesPriority = filters.priority === 'All' || task.priority === filters.priority
    const matchesStatus = filters.status === 'All' || task.status === filters.status
    return matchesWeek && matchesIntern && matchesCategory && matchesPriority && matchesStatus
  })

  const summary = getTaskSummary(filtered)
  const statusBreakdown = getStatusBreakdown(filtered)
  const categoryBreakdown = getCategoryBreakdown(filtered)
  const priorityBreakdown = getPriorityBreakdown(filtered)
  const mostDelayed = [...filtered].sort((a, b) => getDaysOverdue(b) - getDaysOverdue(a))[0]
  const mostActiveIntern = filtered.reduce((acc, task) => {
    const current = acc[task.assignedInternId] || { count: 0 }
    current.count += 1
    acc[task.assignedInternId] = current
    return acc
  }, {})
  const activeInternId = Object.entries(mostActiveIntern).sort((a, b) => b[1].count - a[1].count)[0]?.[0]

  return {
    reportType,
    summary,
    rows: filtered,
    statusBreakdown,
    categoryBreakdown,
    priorityBreakdown,
    mostDelayed,
    activeInternId,
  }
}
