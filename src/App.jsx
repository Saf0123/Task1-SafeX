import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TaskModal from './components/TaskModal'
import ToastStack from './components/ToastStack'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import CalendarPage from './pages/CalendarPage'
import ActivityPage from './pages/ActivityPage'
import { AppProvider, useAppContext } from './context/AppContext'
import { useToast } from './hooks/useToast'
import './App.css'

function AppShell() {
  const { state, dispatch, interns, visibleTasks, reportData } = useAppContext()
  const { toasts, addToast, removeToast } = useToast()

  const openCreateTask = () => dispatch({ type: 'OPEN_MODAL' })
  const closeModal = () => dispatch({ type: 'CLOSE_MODAL' })

  const handleSubmitTask = (values) => {
    if (state.ui.editingTaskId) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: state.ui.editingTaskId, values } })
      addToast('Task updated successfully')
    } else {
      dispatch({ type: 'CREATE_TASK', payload: values })
      addToast('Task created successfully')
    }
    dispatch({ type: 'CLOSE_MODAL' })
  }

  const handleEditTask = (taskId, values) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, values } })
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
    addToast('Task updated')
  }

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      dispatch({ type: 'DELETE_TASK', payload: taskId })
      addToast('Task deleted', 'error')
    }
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
  }

  const handleDuplicateTask = (taskId) => {
    dispatch({ type: 'DUPLICATE_TASK', payload: taskId })
    addToast('Task duplicated')
  }

  const handleArchiveTask = (taskId) => {
    if (window.confirm('Archive this task?')) {
      dispatch({ type: 'ARCHIVE_TASK', payload: taskId })
      addToast('Task archived', 'warning')
    }
    dispatch({ type: 'SET_SELECTED_TASK', payload: null })
  }

  const handleRestoreTask = (taskId) => {
    dispatch({ type: 'RESTORE_TASK', payload: taskId })
    addToast('Task restored')
  }

  const handleBulkAssign   = (taskIds, internId) => dispatch({ type: 'BULK_ASSIGN',   payload: taskIds, assignedInternId: internId || 'int-1' })
  const handleBulkDelete   = (taskIds) => dispatch({ type: 'BULK_DELETE',   payload: taskIds })
  const handleBulkArchive  = (taskIds) => dispatch({ type: 'BULK_ARCHIVE',  payload: taskIds })
  const handleBulkComplete = (taskIds) => dispatch({ type: 'BULK_COMPLETE', payload: taskIds })
  const handleBulkRestore  = (taskIds) => dispatch({ type: 'BULK_RESTORE',  payload: taskIds })
  const handleBulkChangeStatus   = (taskIds, status)   => dispatch({ type: 'BULK_CHANGE_STATUS',   payload: { taskIds, status } })
  const handleBulkChangePriority = (taskIds, priority) => dispatch({ type: 'BULK_CHANGE_PRIORITY', payload: { taskIds, priority } })
  const handleDragDrop = (taskId, status) => dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: taskId, status } })

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout
              sidebarCollapsed={state.ui.sidebarCollapsed}
              setSidebarCollapsed={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              searchQuery={state.ui.searchQuery}
              setSearchQuery={(value) => dispatch({ type: 'SET_SEARCH_QUERY', payload: value })}
              theme={state.ui.theme}
              setTheme={(value) => dispatch({ type: 'SET_THEME', payload: value })}
              currentWeek={state.ui.currentWeek}
              onOpenCreate={openCreateTask}
            />
          }
        >
          <Route path="/" element={<DashboardPage tasks={visibleTasks} interns={interns} onCreateTask={openCreateTask} />} />
          <Route
            path="/tasks"
            element={
              <TasksPage
                tasks={visibleTasks}
                interns={interns}
                onCreateTask={openCreateTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onDuplicateTask={handleDuplicateTask}
                onArchiveTask={handleArchiveTask}
                onRestoreTask={handleRestoreTask}
                onBulkAssign={handleBulkAssign}
                onBulkDelete={handleBulkDelete}
                onBulkArchive={handleBulkArchive}
                onBulkComplete={handleBulkComplete}
                onBulkRestore={handleBulkRestore}
                onBulkChangeStatus={handleBulkChangeStatus}
                onBulkChangePriority={handleBulkChangePriority}
                onOpenTask={(taskId) => dispatch({ type: 'SET_SELECTED_TASK', payload: taskId })}
                selectedTaskId={state.ui.selectedTaskId}
                setSelectedTaskId={(taskId) => dispatch({ type: 'SET_SELECTED_TASK', payload: taskId })}
                onDragDrop={handleDragDrop}
                showToast={addToast}
              />
            }
          />
          <Route path="/calendar" element={<CalendarPage tasks={visibleTasks} interns={interns} onOpenTask={(taskId) => dispatch({ type: 'SET_SELECTED_TASK', payload: taskId })} />} />
          <Route path="/activity" element={<ActivityPage activityLog={state.activityLog} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <TaskModal
        isOpen={state.ui.modalOpen}
        task={state.tasks.find((task) => task.id === state.ui.editingTaskId) || null}
        interns={interns}
        onClose={closeModal}
        onSubmit={handleSubmitTask}
      />
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  )
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default App
