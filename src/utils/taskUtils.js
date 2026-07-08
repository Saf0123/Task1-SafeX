import { format, parseISO, isBefore, startOfDay, differenceInCalendarDays } from 'date-fns'

export const getTaskStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return '#17a673'
    case 'Under Review':
      return '#f59e0b'
    case 'In Progress':
      return '#3b82f6'
    default:
      return '#64748b'
  }
}

export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return '#dc2626'
    case 'Medium':
      return '#f59e0b'
    default:
      return '#16a34a'
  }
}

export const formatDisplayDate = (value) => {
  if (!value) return '—'
  try {
    return format(parseISO(value), 'MMM d, yyyy')
  } catch {
    return value
  }
}

export const isTaskOverdue = (task) => {
  if (!task?.dueDate || task.status === 'Completed') return false
  return isBefore(parseISO(task.dueDate), startOfDay(new Date()))
}

export const getDaysOverdue = (task) => {
  if (!isTaskOverdue(task)) return 0
  return differenceInCalendarDays(startOfDay(new Date()), parseISO(task.dueDate))
}

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
  const categories = ['Design', 'Development', 'QA', 'Research', 'Operations', 'Content']
  return categories.map((category) => ({
    name: category,
    value: active.filter((task) => task.category === category).length,
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

export const buildCsv = (tasks) => {
  const headers = ['Title', 'Assigned Intern', 'Week', 'Due Date', 'Priority', 'Status', 'Category', 'Estimated Time']
  const rows = tasks.map((task) => [task.title, task.assignedInternId, task.week, task.dueDate, task.priority, task.status, task.category, task.estimatedTime])
  const csvRows = [headers, ...rows].map((row) => row.join(','))
  return csvRows.join('\n')
}
