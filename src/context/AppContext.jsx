import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { interns } from '../data/mockData'
import { STORAGE_KEYS, buildActivityEntry, createTaskRecord, duplicateTaskRecord, getInitialAppState, updateTaskRecord, archiveTaskRecord, writeStoredState, buildReport, filterTasks } from '../services/taskService'

const AppContext = createContext(null)

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, ui: { ...state.ui, theme: action.payload } }
    case 'TOGGLE_SIDEBAR':
      return { ...state, ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed } }
    case 'SET_SEARCH_QUERY':
      return { ...state, ui: { ...state.ui, searchQuery: action.payload } }
    case 'SET_TASK_FILTERS':
      return { ...state, ui: { ...state.ui, taskFilters: { ...state.ui.taskFilters, ...action.payload } } }
    case 'SET_CALENDAR_FILTERS':
      return { ...state, ui: { ...state.ui, calendarFilters: { ...state.ui.calendarFilters, ...action.payload } } }
    case 'SET_REPORT_FILTERS':
      return { ...state, ui: { ...state.ui, reportFilters: { ...state.ui.reportFilters, ...action.payload } } }
    case 'SET_REPORT_TYPE':
      return { ...state, ui: { ...state.ui, reportType: action.payload } }
    case 'SET_ACTIVITY_FILTERS':
      return { ...state, ui: { ...state.ui, activityFilters: { ...state.ui.activityFilters, ...action.payload } } }
    case 'SET_VIEW':
      return { ...state, ui: { ...state.ui, activeView: action.payload } }
    case 'OPEN_MODAL':
      return { ...state, ui: { ...state.ui, modalOpen: true, editingTaskId: action.payload || null } }
    case 'CLOSE_MODAL':
      return { ...state, ui: { ...state.ui, modalOpen: false, editingTaskId: null } }
    case 'SET_SELECTED_TASK':
      return { ...state, ui: { ...state.ui, selectedTaskId: action.payload } }
    case 'CREATE_TASK': {
      const task = createTaskRecord(action.payload)
      return {
        ...state,
        tasks: [task, ...state.tasks],
        activityLog: [buildActivityEntry({ action: 'Task Created', task, internId: task.assignedInternId, oldValue: '—', newValue: task.status, category: task.category }), ...state.activityLog],
      }
    }
    case 'UPDATE_TASK': {
      const task = state.tasks.find((item) => item.id === action.payload.id)
      const updated = updateTaskRecord(task, action.payload.values)
      return {
        ...state,
        tasks: state.tasks.map((item) => item.id === action.payload.id ? updated : item),
        activityLog: [buildActivityEntry({ action: 'Task Updated', task: updated, internId: updated.assignedInternId, oldValue: task?.status || '—', newValue: updated.status, category: updated.category }), ...state.activityLog],
      }
    }
    case 'DELETE_TASK': {
      const task = state.tasks.find((item) => item.id === action.payload)
      return {
        ...state,
        tasks: state.tasks.filter((item) => item.id !== action.payload),
        activityLog: [buildActivityEntry({ action: 'Task Deleted', task, internId: task?.assignedInternId, oldValue: 'Active', newValue: 'Deleted', category: task?.category || 'General' }), ...state.activityLog],
      }
    }
    case 'ARCHIVE_TASK': {
      const task = state.tasks.find((item) => item.id === action.payload)
      const archived = archiveTaskRecord(task)
      return {
        ...state,
        tasks: state.tasks.map((item) => item.id === action.payload ? archived : item),
        activityLog: [buildActivityEntry({ action: 'Task Archived', task: archived, internId: archived.assignedInternId, oldValue: 'Active', newValue: 'Archived', category: archived.category }), ...state.activityLog],
      }
    }
    case 'DUPLICATE_TASK': {
      const task = state.tasks.find((item) => item.id === action.payload)
      const duplicate = duplicateTaskRecord(task)
      return {
        ...state,
        tasks: [duplicate, ...state.tasks],
        activityLog: [buildActivityEntry({ action: 'Task Created', task: duplicate, internId: duplicate.assignedInternId, oldValue: '—', newValue: 'Duplicated', category: duplicate.category }), ...state.activityLog],
      }
    }
    case 'BULK_ASSIGN': {
      const taskIds = action.payload
      const nextTasks = state.tasks.map((task) => taskIds.includes(task.id) ? { ...task, assignedInternId: action.assignedInternId, history: [...task.history, 'Task assigned'] } : task)
      return {
        ...state,
        tasks: nextTasks,
        activityLog: [buildActivityEntry({ action: 'Bulk Assign', task: nextTasks.find((task) => taskIds.includes(task.id)), internId: action.assignedInternId, oldValue: 'Multiple', newValue: 'Assigned', category: 'Operations' }), ...state.activityLog],
      }
    }
    case 'BULK_DELETE': {
      const taskIds = action.payload
      return {
        ...state,
        tasks: state.tasks.filter((task) => !taskIds.includes(task.id)),
        activityLog: [buildActivityEntry({ action: 'Bulk Delete', task: null, internId: null, oldValue: 'Multiple', newValue: 'Deleted', category: 'Operations' }), ...state.activityLog],
      }
    }
    case 'BULK_ARCHIVE': {
      const taskIds = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) => taskIds.includes(task.id) ? archiveTaskRecord(task) : task),
        activityLog: [buildActivityEntry({ action: 'Bulk Archive', task: null, internId: null, oldValue: 'Multiple', newValue: 'Archived', category: 'Operations' }), ...state.activityLog],
      }
    }
    case 'BULK_COMPLETE': {
      const taskIds = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) => taskIds.includes(task.id) ? { ...task, status: 'Completed', history: [...task.history, 'Status changed'] } : task),
        activityLog: [buildActivityEntry({ action: 'Bulk Complete', task: null, internId: null, oldValue: 'Multiple', newValue: 'Completed', category: 'Operations' }), ...state.activityLog],
      }
    }
    case 'UPDATE_TASK_STATUS': {
      const task = state.tasks.find((item) => item.id === action.payload.id)
      const updated = { ...task, status: action.payload.status, history: [...(task.history || []), 'Status changed'] }
      return {
        ...state,
        tasks: state.tasks.map((item) => item.id === action.payload.id ? updated : item),
        activityLog: [buildActivityEntry({ action: 'Status Changed', task: updated, internId: updated.assignedInternId, oldValue: task?.status, newValue: updated.status, category: updated.category }), ...state.activityLog],
      }
    }
    case 'RESET':
      return getInitialAppState()

    case 'RESTORE_TASK': {
      const task = state.tasks.find((item) => item.id === action.payload)
      if (!task) return state
      const restored = { ...task, archived: false, history: [...(task.history || []), 'Task restored'] }
      return {
        ...state,
        tasks: state.tasks.map((item) => item.id === action.payload ? restored : item),
        activityLog: [buildActivityEntry({ action: 'Task Restored', task: restored, internId: restored.assignedInternId, oldValue: 'Archived', newValue: 'Active', category: restored.category }), ...state.activityLog],
      }
    }

    case 'BULK_RESTORE': {
      const taskIds = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) => taskIds.includes(task.id) ? { ...task, archived: false, history: [...(task.history || []), 'Task restored'] } : task),
        activityLog: [buildActivityEntry({ action: 'Bulk Restore', task: null, internId: null, oldValue: 'Archived', newValue: 'Active', category: 'Operations' }), ...state.activityLog],
      }
    }

    case 'BULK_CHANGE_STATUS': {
      const { taskIds, status } = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) => taskIds.includes(task.id) ? { ...task, status, history: [...(task.history || []), `Status changed to ${status}`] } : task),
        activityLog: [buildActivityEntry({ action: 'Status Changed', task: null, internId: null, oldValue: 'Multiple', newValue: status, category: 'Operations' }), ...state.activityLog],
      }
    }

    case 'BULK_CHANGE_PRIORITY': {
      const { taskIds, priority } = action.payload
      return {
        ...state,
        tasks: state.tasks.map((task) => taskIds.includes(task.id) ? { ...task, priority, history: [...(task.history || []), `Priority changed to ${priority}`] } : task),
        activityLog: [buildActivityEntry({ action: 'Priority Changed', task: null, internId: null, oldValue: 'Multiple', newValue: priority, category: 'Operations' }), ...state.activityLog],
      }
    }

    case 'ADD_NOTE': {
      const { taskId, note } = action.payload
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return state
      const updatedTask = {
        ...task,
        notesList: [...(task.notesList || []), note],
        history: [...(task.history || []), 'Note added'],
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => t.id === taskId ? updatedTask : t),
        activityLog: [buildActivityEntry({ action: 'Note Added', task: updatedTask, internId: updatedTask.assignedInternId, oldValue: '—', newValue: 'Note added', category: updatedTask.category, details: note.text }), ...state.activityLog],
      }
    }

    case 'DELETE_NOTE': {
      const { taskId, noteId } = action.payload
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return state
      const updatedTask = {
        ...task,
        notesList: (task.notesList || []).filter((n) => n.id !== noteId),
        history: [...(task.history || []), 'Note deleted'],
      }
      return {
        ...state,
        tasks: state.tasks.map((t) => t.id === taskId ? updatedTask : t),
        activityLog: [buildActivityEntry({ action: 'Note Deleted', task: updatedTask, internId: updatedTask.assignedInternId, oldValue: 'Note', newValue: 'Deleted', category: updatedTask.category }), ...state.activityLog],
      }
    }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialAppState)

  useEffect(() => {
    writeStoredState(STORAGE_KEYS.tasks, state.tasks)
    writeStoredState(STORAGE_KEYS.activity, state.activityLog)
    writeStoredState(STORAGE_KEYS.sidebarCollapsed, state.ui.sidebarCollapsed)
    writeStoredState(STORAGE_KEYS.theme, state.ui.theme)
    writeStoredState(STORAGE_KEYS.taskFilters, state.ui.taskFilters)
    writeStoredState(STORAGE_KEYS.calendarFilters, state.ui.calendarFilters)
    writeStoredState(STORAGE_KEYS.reportFilters, state.ui.reportFilters)
    writeStoredState(STORAGE_KEYS.reportType, state.ui.reportType)
    writeStoredState(STORAGE_KEYS.activityFilters, state.ui.activityFilters)
  }, [state])

  const value = useMemo(() => ({
    state,
    dispatch,
    interns,
    currentWeek: state.ui.currentWeek,
    visibleTasks: filterTasks(state.tasks, state.ui.taskFilters, state.ui.searchQuery),
    reportData: buildReport(state.tasks, state.ui.reportFilters, state.ui.reportType),
  }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used within AppProvider')
  return context
}
