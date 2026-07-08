import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  FiColumns, FiList, FiFilter, FiArchive, FiCopy, FiTrash2,
  FiCheckCircle, FiPlus, FiSearch, FiX, FiDownload,
  FiArrowUp, FiArrowDown, FiMoreVertical, FiEdit2,
  FiRefreshCw, FiEye, FiRotateCcw, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi'
import { formatDisplayDate, getPriorityColor, getTaskStatusColor, isTaskOverdue, getDaysOverdue } from '../utils/taskUtils'
import { normalizeWeek } from '../services/taskService'
import { useAppContext } from '../context/AppContext'
import { exportCsv, exportPdf } from '../services/exportService'
import { useToast } from '../hooks/useToast'
import TaskDrawer from '../components/TaskDrawer'
import ToastStack from '../components/ToastStack'
import '../styles/tasks.css'

// ── Constants ──────────────────────────────────────
const STATUSES  = ['Not Started', 'In Progress', 'Under Review', 'Completed']
const PRIORITIES = ['High', 'Medium', 'Low']
const CATEGORIES = ['Design', 'Development', 'QA', 'Research', 'Operations', 'Content']
const WEEK_OPTS  = ['Week-01','Week-02','Week-03','Week-04','Week-05','Week-06','Week-07','Week-08','Week-09','Week-10','Week-11','Week-12']
const SORT_OPTS  = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'dueDate',   label: 'Due Date' },
  { value: 'priority',  label: 'Priority' },
  { value: 'status',    label: 'Status' },
  { value: 'title',     label: 'Alphabetical' },
  { value: 'intern',    label: 'Intern' },
  { value: 'estimatedTime', label: 'Est. Hours' },
]
const DEFAULT_FILTERS = {
  week: 'All', intern: 'All', status: 'All', priority: 'All',
  category: 'All', overdueOnly: false, archived: false,
}
const PRIORITY_ORDER = { High: 3, Medium: 2, Low: 1 }
const STATUS_ORDER   = { 'Not Started': 1, 'In Progress': 2, 'Under Review': 3, 'Completed': 4 }

// ── Helpers ────────────────────────────────────────
function parseSortValue(task, field, interns) {
  switch (field) {
    case 'dueDate':       return task.dueDate || ''
    case 'priority':      return PRIORITY_ORDER[task.priority] || 0
    case 'status':        return STATUS_ORDER[task.status] || 0
    case 'title':         return (task.title || '').toLowerCase()
    case 'intern':        return interns.find((i) => i.id === task.assignedInternId)?.name?.toLowerCase() || ''
    case 'estimatedTime': return parseFloat(task.estimatedTime) || 0
    default:              return task.createdAt || ''
  }
}

// ── Main Component ─────────────────────────────────
function TasksPage({
  // eslint-disable-next-line no-unused-vars
  tasks: _tp, interns: _ip,
  onCreateTask, onEditTask, onDeleteTask, onDuplicateTask,
  onArchiveTask, onRestoreTask,
  onBulkAssign, onBulkDelete, onBulkArchive, onBulkComplete,
  onBulkRestore, onBulkChangeStatus, onBulkChangePriority,
  onDragDrop,
  showToast: parentToast,
}) {
  const { state, dispatch, interns } = useAppContext()
  const { toasts, addToast, removeToast } = useToast()
  const notify = useCallback((msg, type = 'success') => {
    addToast(msg, type)
    parentToast?.(msg, type)
  }, [addToast, parentToast])

  // ── Filter state — init from global taskFilters (set by Dashboard navigation) ──
  const [filters, setFilters] = useState(() => {
    const f = state.ui.taskFilters || {}
    return {
      week:       f.week       || 'All',
      intern:     f.intern     || 'All',
      status:     f.status     || 'All',
      priority:   f.priority   || 'All',
      category:   f.category   || 'All',
      overdueOnly: Boolean(f.overdueOnly),
      archived:    Boolean(f.archived),
    }
  })

  // ── Other local state ──
  const [view, setView]       = useState(() => localStorage.getItem('safex-tasks-view') || 'table')
  const [search, setSearch]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField]     = useState(() => localStorage.getItem('safex-tasks-sort-field') || 'createdAt')
  const [sortDir, setSortDir]         = useState(() => localStorage.getItem('safex-tasks-sort-dir') || 'desc')
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(() => parseInt(localStorage.getItem('safex-tasks-page-size') || '25', 10))
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkInternId, setBulkInternId]   = useState('')
  const [bulkStatus, setBulkStatus]       = useState('')
  const [bulkPriority, setBulkPriority]   = useState('')
  const [exportOpen, setExportOpen]       = useState(false)
  const [openRowMenu, setOpenRowMenu]     = useState(null)
  const [drawerTaskId, setDrawerTaskId]   = useState(() => state.ui.selectedTaskId || null)

  const exportRef = useRef(null)
  const rowMenuRef = useRef(null)

  // Persist view / sort / pageSize
  useEffect(() => { localStorage.setItem('safex-tasks-view', view) },         [view])
  useEffect(() => { localStorage.setItem('safex-tasks-sort-field', sortField) }, [sortField])
  useEffect(() => { localStorage.setItem('safex-tasks-sort-dir', sortDir) },   [sortDir])
  useEffect(() => { localStorage.setItem('safex-tasks-page-size', pageSize) }, [pageSize])

  // Clear global selectedTaskId if it was used to open the drawer
  useEffect(() => {
    if (state.ui.selectedTaskId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDrawerTaskId(state.ui.selectedTaskId)
      dispatch({ type: 'SET_SELECTED_TASK', payload: null })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false)
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target)) setOpenRowMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset page when filters/search/sort change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [filters, search, sortField, sortDir])

  // ── Data ──
  const allTasks = state.tasks

  const allFilteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allTasks
      .filter((t) => (filters.archived ? t.archived : !t.archived))
      .filter((t) => filters.week     === 'All' || normalizeWeek(t.week) === filters.week)
      .filter((t) => filters.intern   === 'All' || t.assignedInternId === filters.intern)
      .filter((t) => filters.status   === 'All' || t.status === filters.status)
      .filter((t) => filters.priority === 'All' || t.priority === filters.priority)
      .filter((t) => filters.category === 'All' || t.category === filters.category)
      .filter((t) => !filters.overdueOnly || isTaskOverdue(t))
      .filter((t) => {
        if (!q) return true
        return (
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q) ||
          t.priority?.toLowerCase().includes(q) ||
          t.status?.toLowerCase().includes(q) ||
          t.week?.toLowerCase().includes(q) ||
          interns.find((i) => i.id === t.assignedInternId)?.name?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const va = parseSortValue(a, sortField, interns)
        const vb = parseSortValue(b, sortField, interns)
        if (typeof va === 'string') {
          return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
        }
        return sortDir === 'asc' ? va - vb : vb - va
      })
  }, [allTasks, filters, search, sortField, sortDir, interns])

  const totalPages    = Math.max(1, Math.ceil(allFilteredSorted.length / pageSize))
  const safePage      = Math.min(page, totalPages)
  const paginatedRows = allFilteredSorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // ── Active filter chips ──
  const filterChips = useMemo(() => {
    const chips = []
    if (filters.week !== 'All')     chips.push({ key: 'week',       label: `Week: ${filters.week}` })
    if (filters.intern !== 'All')   chips.push({ key: 'intern',     label: `Intern: ${interns.find((i) => i.id === filters.intern)?.name || filters.intern}` })
    if (filters.status !== 'All')   chips.push({ key: 'status',     label: `Status: ${filters.status}` })
    if (filters.priority !== 'All') chips.push({ key: 'priority',   label: `Priority: ${filters.priority}` })
    if (filters.category !== 'All') chips.push({ key: 'category',   label: `Category: ${filters.category}` })
    if (filters.overdueOnly)        chips.push({ key: 'overdueOnly', label: 'Overdue Only' })
    if (filters.archived)           chips.push({ key: 'archived',   label: 'Archived' })
    return chips
  }, [filters, interns])

  const removeChip = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'overdueOnly' || key === 'archived' ? false : 'All',
    }))
  }

  // ── Selection helpers ──
  const isAllSelected = paginatedRows.length > 0 && paginatedRows.every((t) => selectedIds.includes(t.id))

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedRows.find((t) => t.id === id)))
    } else {
      setSelectedIds((prev) => {
        const newIds = paginatedRows.map((t) => t.id).filter((id) => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  // ── Drawer task ──
  const drawerTask = allTasks.find((t) => t.id === drawerTaskId) || null

  // ── Action wrappers with toast ──
  const handleEdit = useCallback((taskId, values) => {
    onEditTask(taskId, values)
    notify('Task updated')
  }, [onEditTask, notify])

  const handleDelete = useCallback((taskId) => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      onDeleteTask(taskId)
      setDrawerTaskId(null)
      notify('Task deleted', 'error')
    }
  }, [onDeleteTask, notify])

  const handleDuplicate = useCallback((taskId) => {
    onDuplicateTask(taskId)
    notify('Task duplicated')
  }, [onDuplicateTask, notify])

  const handleArchive = useCallback((taskId) => {
    if (window.confirm('Archive this task?')) {
      onArchiveTask(taskId)
      setDrawerTaskId(null)
      notify('Task archived', 'warning')
    }
  }, [onArchiveTask, notify])

  const handleRestore = useCallback((taskId) => {
    onRestoreTask?.(taskId)
    setDrawerTaskId(null)
    notify('Task restored')
  }, [onRestoreTask, notify])

  // ── Bulk actions ──
  const handleBulkAction = (action) => {
    if (!selectedIds.length) { notify('Select at least one task first', 'info'); return }
    switch (action) {
      case 'complete':
        onBulkComplete(selectedIds)
        notify(`${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''} marked complete`)
        break
      case 'archive':
        if (window.confirm(`Archive ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}?`)) {
          onBulkArchive(selectedIds)
          notify(`${selectedIds.length} tasks archived`, 'warning')
        }
        break
      case 'restore':
        onBulkRestore?.(selectedIds)
        notify(`${selectedIds.length} tasks restored`)
        break
      case 'delete':
        if (window.confirm(`Delete ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}? This cannot be undone.`)) {
          onBulkDelete(selectedIds)
          notify(`${selectedIds.length} tasks deleted`, 'error')
        }
        break
      case 'assign':
        if (bulkInternId) {
          onBulkAssign(selectedIds, bulkInternId)
          notify(`${selectedIds.length} tasks assigned`)
        } else {
          notify('Select an intern to assign', 'info')
          return
        }
        break
      case 'status':
        if (bulkStatus) {
          onBulkChangeStatus?.(selectedIds, bulkStatus)
          notify(`${selectedIds.length} tasks updated`)
        } else {
          notify('Select a status', 'info')
          return
        }
        break
      case 'priority':
        if (bulkPriority) {
          onBulkChangePriority?.(selectedIds, bulkPriority)
          notify(`${selectedIds.length} tasks updated`)
        } else {
          notify('Select a priority', 'info')
          return
        }
        break
      default:
        break
    }
    setSelectedIds([])
  }

  // ── Export ──
  const handleExport = (type) => {
    const tasks = type === 'filtered' ? allFilteredSorted : allTasks.filter((t) => !t.archived)
    const archived = allTasks.filter((t) => t.archived)
    if (type === 'archived') {
      exportCsv(archived, interns, 'safex-archived-tasks.csv')
    } else if (type === 'pdf') {
      exportPdf(allFilteredSorted, interns, 'safex-tasks.pdf').catch(() => notify('PDF export failed', 'error'))
    } else {
      exportCsv(tasks, interns, 'safex-tasks.csv')
    }
    setExportOpen(false)
    notify('Export started')
  }

  // ── Status quick-change inline ──
  const handleStatusChange = (taskId, newStatus) => {
    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: taskId, status: newStatus } })
    notify('Status updated')
  }

  // ── Refresh ──
  const handleRefresh = () => {
    setSearch('')
    setFilters(DEFAULT_FILTERS)
    setSelectedIds([])
    setPage(1)
    notify('View refreshed', 'info')
  }

  return (
    <>
      <div className="page tasks-page">

        {/* ── Page Header ── */}
        <div className="tasks-header">
          <div className="tasks-header__left">
            <p className="section-label">Task Workspace</p>
            <h2 className="tasks-header__title">Tasks</h2>
            <p className="tasks-header__subtitle">Manage, assign, and monitor weekly intern tasks.</p>
          </div>
          <div className="tasks-header__right">
            <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={onCreateTask}>
              <FiPlus size={15} />
              Create Task
            </button>
            <div className="export-wrapper" ref={exportRef}>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setExportOpen((o) => !o)}
              >
                <FiDownload size={14} />
                Export
              </button>
              {exportOpen && (
                <div className="export-dropdown">
                  <button type="button" className="export-option" onClick={() => handleExport('filtered')}>
                    <FiDownload size={14} /> CSV — Filtered Tasks
                  </button>
                  <button type="button" className="export-option" onClick={() => handleExport('all')}>
                    <FiDownload size={14} /> CSV — All Tasks
                  </button>
                  <button type="button" className="export-option" onClick={() => handleExport('archived')}>
                    <FiArchive size={14} /> CSV — Archived Tasks
                  </button>
                  <button type="button" className="export-option" onClick={() => handleExport('pdf')}>
                    <FiDownload size={14} /> PDF Report
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className={`toolbar-btn ${view === 'table' ? '' : 'toolbar-btn--active'}`}
              onClick={() => setView((v) => v === 'table' ? 'kanban' : 'table')}
            >
              {view === 'table' ? <FiColumns size={14} /> : <FiList size={14} />}
              {view === 'table' ? 'Kanban' : 'Table'}
            </button>
          </div>
        </div>

        {/* ── Sticky Toolbar ── */}
        <div className="tasks-toolbar">
          <div className="tasks-toolbar__row">
            {/* Search */}
            <label className="tasks-search">
              <FiSearch size={14} />
              <input
                type="text"
                placeholder="Search tasks, interns, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="tasks-search__clear" onClick={() => setSearch('')} aria-label="Clear search">
                  <FiX size={14} />
                </button>
              )}
            </label>

            {/* Filters button */}
            <button
              type="button"
              className={`toolbar-btn ${showFilters ? 'toolbar-btn--active' : ''}`}
              onClick={() => setShowFilters((s) => !s)}
            >
              <FiFilter size={14} />
              Filters
              {filterChips.length > 0 && (
                <span className="toolbar-btn__badge">{filterChips.length}</span>
              )}
            </button>

            {/* Sort */}
            <div className="sort-row">
              <span>Sort:</span>
              <select
                className="sort-row__select"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                {SORT_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="sort-dir-btn"
                onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDir === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
              </button>
            </div>

            {/* Rows per page */}
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              title="Rows per page"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            {/* Refresh */}
            <button type="button" className="toolbar-btn" onClick={handleRefresh} title="Reset all filters">
              <FiRefreshCw size={14} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="tasks-filter-panel">
              <div className="tasks-filter-panel__grid">
                <label className="field field--inline">
                  <span>Week</span>
                  <select value={filters.week} onChange={(e) => setFilters((p) => ({ ...p, week: e.target.value }))}>
                    <option value="All">All Weeks</option>
                    {WEEK_OPTS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </label>
                <label className="field field--inline">
                  <span>Intern</span>
                  <select value={filters.intern} onChange={(e) => setFilters((p) => ({ ...p, intern: e.target.value }))}>
                    <option value="All">All Interns</option>
                    {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </label>
                <label className="field field--inline">
                  <span>Status</span>
                  <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                    <option value="All">All Statuses</option>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label className="field field--inline">
                  <span>Priority</span>
                  <select value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
                    <option value="All">All Priorities</option>
                    {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </label>
                <label className="field field--inline">
                  <span>Category</span>
                  <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>
              <div className="tasks-filter-panel__footer">
                <div className="tasks-filter-panel__toggles">
                  <label className="filter-toggle-label">
                    <input
                      type="checkbox"
                      checked={filters.overdueOnly}
                      onChange={(e) => setFilters((p) => ({ ...p, overdueOnly: e.target.checked }))}
                    />
                    Overdue Only
                  </label>
                  <label className="filter-toggle-label">
                    <input
                      type="checkbox"
                      checked={filters.archived}
                      onChange={(e) => setFilters((p) => ({ ...p, archived: e.target.checked }))}
                    />
                    Show Archived
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="toolbar-btn" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Clear All
                  </button>
                  <button type="button" className="toolbar-btn toolbar-btn--active" onClick={() => setShowFilters(false)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {filterChips.length > 0 && (
            <div className="filter-chips">
              {filterChips.map((chip) => (
                <span key={chip.key} className="filter-chip">
                  {chip.label}
                  <button
                    type="button"
                    className="filter-chip__remove"
                    onClick={() => removeChip(chip.key)}
                    aria-label={`Remove ${chip.label} filter`}
                  >
                    <FiX size={11} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="filter-chip--clear-all"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Task Count ── */}
        <p className="tasks-count">
          {allFilteredSorted.length} task{allFilteredSorted.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
          {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
        </p>

        {/* ── Table View ── */}
        {view === 'table' ? (
          <>
            {allFilteredSorted.length === 0 ? (
              <div className="tasks-empty">
                <div className="tasks-empty__icon">📋</div>
                <p className="tasks-empty__title">No tasks found</p>
                <p className="tasks-empty__desc">
                  {filterChips.length > 0 || search
                    ? 'Try adjusting your filters or search query.'
                    : 'Create your first task to get started.'}
                </p>
                {(filterChips.length > 0 || search) && (
                  <button type="button" className="toolbar-btn" style={{ marginTop: 8 }} onClick={() => { setFilters(DEFAULT_FILTERS); setSearch('') }}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="tasks-table-wrapper" ref={rowMenuRef}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleAll}
                          title="Select all visible"
                        />
                      </th>
                      <th className="th-sortable task-title-col" onClick={() => { setSortField('title'); setSortDir(sortField === 'title' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Task
                          {sortField === 'title' && (sortDir === 'asc' ? <FiArrowUp size={11} className="th-sort-icon" /> : <FiArrowDown size={11} className="th-sort-icon" />)}
                        </span>
                      </th>
                      <th className="th-sortable" onClick={() => { setSortField('intern'); setSortDir(sortField === 'intern' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Intern
                          {sortField === 'intern' && (sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />)}
                        </span>
                      </th>
                      <th>Week</th>
                      <th className="th-sortable" onClick={() => { setSortField('priority'); setSortDir(sortField === 'priority' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Priority
                          {sortField === 'priority' && (sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />)}
                        </span>
                      </th>
                      <th className="th-sortable" onClick={() => { setSortField('status'); setSortDir(sortField === 'status' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Status
                          {sortField === 'status' && (sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />)}
                        </span>
                      </th>
                      <th>Category</th>
                      <th className="th-sortable" onClick={() => { setSortField('estimatedTime'); setSortDir(sortField === 'estimatedTime' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Est.
                          {sortField === 'estimatedTime' && (sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />)}
                        </span>
                      </th>
                      <th className="th-sortable" onClick={() => { setSortField('dueDate'); setSortDir(sortField === 'dueDate' && sortDir === 'asc' ? 'desc' : 'asc') }}>
                        <span className="th-content">
                          Due Date
                          {sortField === 'dueDate' && (sortDir === 'asc' ? <FiArrowUp size={11} /> : <FiArrowDown size={11} />)}
                        </span>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((task) => {
                      const intern  = interns.find((i) => i.id === task.assignedInternId)
                      const overdue = isTaskOverdue(task)
                      const isSelected = selectedIds.includes(task.id)
                      const pColor = getPriorityColor(task.priority)
                      const sColor = getTaskStatusColor(task.status)
                      return (
                        <tr
                          key={task.id}
                          className={isSelected ? 'is-selected' : ''}
                          onClick={() => setDrawerTaskId(task.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(task.id)}
                            />
                          </td>
                          <td className="task-title-col">
                            <p className="task-title-text">{task.title}</p>
                            <p className="task-desc-text">{task.description}</p>
                          </td>
                          <td>
                            <div className="intern-cell">
                              <div className="avatar--xs">{intern?.initials || '?'}</div>
                              {intern?.name || 'Unassigned'}
                            </div>
                          </td>
                          <td>{task.week}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <span
                              className="pill"
                              style={{ color: pColor, background: `${pColor}18`, fontWeight: 700, fontSize: '0.72rem' }}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              className="status-cell-select pill"
                              style={{ color: sColor, background: `${sColor}15` }}
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              title="Change status"
                            >
                              {STATUSES.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>{task.category}</td>
                          <td>{task.estimatedTime}</td>
                          <td>
                            <span className={`date-cell ${overdue ? 'is-overdue' : ''}`}>
                              {formatDisplayDate(task.dueDate)}
                              {overdue && (
                                <span className="overdue-badge">{getDaysOverdue(task)}d</span>
                              )}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="icon-button"
                                title="View details"
                                onClick={() => setDrawerTaskId(task.id)}
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                type="button"
                                className="icon-button"
                                title="Duplicate"
                                onClick={() => handleDuplicate(task.id)}
                              >
                                <FiCopy size={14} />
                              </button>
                              {/* More actions dropdown */}
                              <div className="row-more-wrapper">
                                <button
                                  type="button"
                                  className="icon-button"
                                  title="More actions"
                                  onClick={() => setOpenRowMenu((prev) => prev === task.id ? null : task.id)}
                                >
                                  <FiMoreVertical size={14} />
                                </button>
                                {openRowMenu === task.id && (
                                  <div className="row-more-dropdown">
                                    <button type="button" className="row-more-option" onClick={() => { setDrawerTaskId(task.id); setOpenRowMenu(null) }}>
                                      <FiEdit2 size={13} /> Edit / View
                                    </button>
                                    <button type="button" className="row-more-option" onClick={() => { handleDuplicate(task.id); setOpenRowMenu(null) }}>
                                      <FiCopy size={13} /> Duplicate
                                    </button>
                                    {task.archived ? (
                                      <button type="button" className="row-more-option" onClick={() => { handleRestore(task.id); setOpenRowMenu(null) }}>
                                        <FiRotateCcw size={13} /> Restore
                                      </button>
                                    ) : (
                                      <button type="button" className="row-more-option" onClick={() => { handleArchive(task.id); setOpenRowMenu(null) }}>
                                        <FiArchive size={13} /> Archive
                                      </button>
                                    )}
                                    <button type="button" className="row-more-option row-more-option--danger" onClick={() => { handleDelete(task.id); setOpenRowMenu(null) }}>
                                      <FiTrash2 size={13} /> Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination-row">
                  <span className="pagination-info">
                    Showing {Math.min((safePage - 1) * pageSize + 1, allFilteredSorted.length)}–{Math.min(safePage * pageSize, allFilteredSorted.length)} of {allFilteredSorted.length}
                  </span>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => setPage(1)}
                      disabled={safePage <= 1}
                      title="First page"
                    >
                      <FiChevronLeft size={12} />
                      <FiChevronLeft size={12} style={{ marginLeft: -6 }} />
                    </button>
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      <FiChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p
                      if (totalPages <= 5) {
                        p = i + 1
                      } else if (safePage <= 3) {
                        p = i + 1
                      } else if (safePage >= totalPages - 2) {
                        p = totalPages - 4 + i
                      } else {
                        p = safePage - 2 + i
                      }
                      return (
                        <button
                          key={p}
                          type="button"
                          className={`page-btn ${p === safePage ? 'page-btn--active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                    >
                      <FiChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="page-btn"
                      onClick={() => setPage(totalPages)}
                      disabled={safePage >= totalPages}
                      title="Last page"
                    >
                      <FiChevronRight size={12} />
                      <FiChevronRight size={12} style={{ marginLeft: -6 }} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Kanban View ── */
          <div className="kanban-board">
            {STATUSES.map((status) => {
              const colTasks = allFilteredSorted.filter((t) => t.status === status)
              return (
                <div key={status} className="kanban-column">
                  <div className="kanban-column__header">
                    <h4 style={{ color: getTaskStatusColor(status) }}>{status}</h4>
                    <span className="pill" style={{ color: getTaskStatusColor(status), background: `${getTaskStatusColor(status)}15`, fontSize: '0.72rem', fontWeight: 700 }}>
                      {colTasks.length}
                    </span>
                  </div>
                  <div
                    className="kanban-column__cards"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const taskId = e.dataTransfer.getData('text/plain')
                      if (taskId) onDragDrop(taskId, status)
                    }}
                  >
                    {colTasks.map((task) => {
                      const intern  = interns.find((i) => i.id === task.assignedInternId)
                      const overdue = isTaskOverdue(task)
                      const pColor  = getPriorityColor(task.priority)
                      return (
                        <button
                          key={task.id}
                          type="button"
                          className="kanban-card"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                          onClick={() => setDrawerTaskId(task.id)}
                        >
                          <p className="kanban-card__title">{task.title}</p>
                          <p className="kanban-card__meta">{intern?.name || 'Unassigned'}</p>
                          <div className="kanban-card__footer">
                            <span className="pill" style={{ color: pColor, background: `${pColor}15`, fontSize: '0.68rem', fontWeight: 700 }}>
                              {task.priority}
                            </span>
                            {overdue ? (
                              <span className="kanban-card__overdue">
                                {getDaysOverdue(task)}d overdue
                              </span>
                            ) : (
                              <p className="kanban-card__meta" style={{ margin: 0 }}>
                                {formatDisplayDate(task.dueDate)}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                    {colTasks.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', padding: '16px 0', margin: 0 }}>
                        No tasks
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bulk Action Bar ── */}
        {selectedIds.length > 0 && (
          <div className="bulk-bar">
            <span className="bulk-bar__count">{selectedIds.length} selected</span>
            <div className="bulk-bar__sep" />
            <div className="bulk-bar__actions">
              <button type="button" className="bulk-btn" onClick={() => handleBulkAction('complete')}>
                <FiCheckCircle size={13} /> Complete
              </button>
              {filters.archived ? (
                <button type="button" className="bulk-btn" onClick={() => handleBulkAction('restore')}>
                  <FiRotateCcw size={13} /> Restore
                </button>
              ) : (
                <button type="button" className="bulk-btn" onClick={() => handleBulkAction('archive')}>
                  <FiArchive size={13} /> Archive
                </button>
              )}
              {/* Assign */}
              <select
                className="bulk-assign-select"
                value={bulkInternId}
                onChange={(e) => setBulkInternId(e.target.value)}
                title="Select intern"
              >
                <option value="">Assign to...</option>
                {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <button type="button" className="bulk-btn" onClick={() => handleBulkAction('assign')}>
                Assign
              </button>
              {/* Change Status */}
              <select
                className="bulk-status-select"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                title="Set status"
              >
                <option value="">Set status...</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button type="button" className="bulk-btn" onClick={() => handleBulkAction('status')}>
                Apply
              </button>
              {/* Change Priority */}
              <select
                className="bulk-status-select"
                value={bulkPriority}
                onChange={(e) => setBulkPriority(e.target.value)}
                title="Set priority"
              >
                <option value="">Set priority...</option>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <button type="button" className="bulk-btn" onClick={() => handleBulkAction('priority')}>
                Apply
              </button>
              <button type="button" className="bulk-btn bulk-btn--danger" onClick={() => handleBulkAction('delete')}>
                <FiTrash2 size={13} /> Delete
              </button>
            </div>
            <button type="button" className="bulk-bar__clear" onClick={() => setSelectedIds([])}>
              <FiX size={13} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* ── Task Drawer ── */}
      <TaskDrawer
        isOpen={!!drawerTaskId}
        task={drawerTask}
        interns={interns}
        activityLog={state.activityLog}
        onClose={() => setDrawerTaskId(null)}
        onSave={(form) => { handleEdit(drawerTaskId, form); setDrawerTaskId(null) }}
        onDuplicate={() => { handleDuplicate(drawerTaskId); setDrawerTaskId(null) }}
        onArchive={() => handleArchive(drawerTaskId)}
        onDelete={() => handleDelete(drawerTaskId)}
        onRestore={() => handleRestore(drawerTaskId)}
        onAddNote={(note) => dispatch({ type: 'ADD_NOTE', payload: { taskId: drawerTaskId, note } })}
        onDeleteNote={(noteId) => dispatch({ type: 'DELETE_NOTE', payload: { taskId: drawerTaskId, noteId } })}
      />

      {/* ── Toast Notifications ── */}
      <ToastStack toasts={toasts} onRemove={removeToast} />
    </>
  )
}

export default TasksPage
