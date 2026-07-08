import { useEffect, useState } from 'react'
import { FiArchive, FiCopy, FiTrash2, FiSave, FiX, FiAlertTriangle, FiRotateCcw, FiPlus } from 'react-icons/fi'
import { formatDisplayDate, getPriorityColor, getTaskStatusColor, isTaskOverdue, getDaysOverdue } from '../utils/taskUtils'
import '../styles/tasks.css'

const STATUSES   = ['Not Started', 'In Progress', 'Under Review', 'Completed']
const PRIORITIES = ['High', 'Medium', 'Low']
const CATEGORIES = ['Design', 'Development', 'QA', 'Research', 'Operations', 'Content']
const WEEKS      = ['Week-01','Week-02','Week-03','Week-04','Week-05','Week-06','Week-07','Week-08','Week-09','Week-10','Week-11','Week-12']
const TABS       = ['Overview', 'Notes', 'Activity', 'History']

const emptyForm = {
  title: '', description: '', assignedInternId: 'int-1',
  week: 'Week-01', dueDate: '', priority: 'Medium',
  status: 'Not Started', category: 'Development',
  estimatedTime: '4h', notes: '',
}

function formatTime(ts) {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now - d) / 60000)
    if (diff < 1) return 'just now'
    if (diff < 60) return `${diff}m ago`
    const h = Math.floor(diff / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '' }
}

function TaskDrawer({
  task, interns, onClose, onSave, onDuplicate, onArchive, onDelete, isOpen,
  onRestore, activityLog = [], onAddNote, onDeleteNote,
}) {
  const [form, setForm]         = useState(emptyForm)
  const [activeTab, setActiveTab] = useState('Overview')
  const [noteText, setNoteText]   = useState('')

  useEffect(() => {
    if (task && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        title:           task.title || '',
        description:     task.description || '',
        assignedInternId: task.assignedInternId || 'int-1',
        week:            task.week || 'Week-01',
        dueDate:         task.dueDate || '',
        priority:        task.priority || 'Medium',
        status:          task.status || 'Not Started',
        category:        task.category || 'Development',
        estimatedTime:   task.estimatedTime || '4h',
        notes:           task.notes || '',
      })
      setActiveTab('Overview')
    } else {
      setForm(emptyForm)
    }
  }, [task, isOpen])

  if (!task || !isOpen) return null

  const overdue = isTaskOverdue(task)

  const handleSave = () => {
    if (!form.title.trim()) {
      window.alert('Task title is required.')
      return
    }
    if (!form.dueDate) {
      window.alert('Due date is required.')
      return
    }
    onSave(form)
    onClose()
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    const note = {
      id:        `note-${Date.now()}`,
      text:      noteText.trim(),
      timestamp: new Date().toISOString(),
      manager:   'Ayesha Noor',
    }
    onAddNote?.(note)
    setNoteText('')
  }

  // Activity log entries for this task (match by title)
  const taskActivity = activityLog.filter(
    (entry) => entry.taskTitle === task.title
  )

  const notesList = task.notesList || []

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="drawer__header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="drawer__eyebrow">
              {task.archived ? 'Archived Task' : 'Task Details'}
              {task.week && <span style={{ marginLeft: 8, color: '#3b82f6' }}>· {task.week}</span>}
            </p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.title}
            </h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="drawer-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`drawer-tab-btn ${activeTab === tab ? 'drawer-tab-btn--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Notes' && notesList.length > 0 && (
                <span style={{ marginLeft: 5, background: '#3b82f6', color: 'white', borderRadius: 999, fontSize: '0.64rem', padding: '1px 5px', fontWeight: 700 }}>
                  {notesList.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Body ── */}
        <div className="drawer-tab-body">

          {/* ========== OVERVIEW ========== */}
          {activeTab === 'Overview' && (
            <>
              {overdue && (
                <div className="drawer-overdue-banner">
                  <FiAlertTriangle size={16} />
                  Overdue by {getDaysOverdue(task)} day{getDaysOverdue(task) !== 1 ? 's' : ''}
                </div>
              )}

              <div className="drawer__content">
                <label className="field">
                  <span>Title</span>
                  <input
                    value={form.title}
                    maxLength={100}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                  <span className="field-hint" style={{ textAlign: 'right' }}>{form.title.length}/100</span>
                </label>

                <label className="field">
                  <span>Description</span>
                  <textarea
                    value={form.description}
                    rows={4}
                    maxLength={500}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <span className="field-hint" style={{ textAlign: 'right' }}>{form.description.length}/500</span>
                </label>

                <div className="drawer__grid">
                  <label className="field">
                    <span>Assigned Intern</span>
                    <select value={form.assignedInternId} onChange={(e) => setForm((f) => ({ ...f, assignedInternId: e.target.value }))}>
                      {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Priority</span>
                    <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                      {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Category</span>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                </div>

                <div className="drawer__grid">
                  <label className="field">
                    <span>Week</span>
                    <select value={form.week} onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}>
                      {WEEKS.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </label>
                  <label className="field">
                    <span>Estimated Time</span>
                    <input
                      value={form.estimatedTime}
                      placeholder="e.g. 4h"
                      onChange={(e) => setForm((f) => ({ ...f, estimatedTime: e.target.value }))}
                    />
                  </label>
                  <label className="field">
                    <span>Due Date</span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Internal Notes</span>
                  <textarea
                    value={form.notes}
                    rows={3}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </label>

                {/* Meta row */}
                <div className="drawer__meta">
                  <div>
                    <p className="drawer__label">Priority</p>
                    <span
                      className="pill"
                      style={{ color: getPriorityColor(task.priority), background: `${getPriorityColor(task.priority)}18`, fontWeight: 700, fontSize: '0.74rem' }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div>
                    <p className="drawer__label">Status</p>
                    <span
                      className="pill"
                      style={{ color: getTaskStatusColor(task.status), background: `${getTaskStatusColor(task.status)}18`, fontWeight: 700, fontSize: '0.74rem' }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div>
                    <p className="drawer__label">Due Date</p>
                    <span style={{ fontSize: '0.84rem', color: overdue ? '#dc2626' : undefined, fontWeight: overdue ? 700 : undefined }}>
                      {formatDisplayDate(task.dueDate)}
                    </span>
                  </div>
                  {task.archived && (
                    <div>
                      <p className="drawer__label">Archived</p>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Yes</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========== NOTES ========== */}
          {activeTab === 'Notes' && (
            <div>
              {onAddNote && (
                <div className="notes-add-form">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add an internal note..."
                    rows={3}
                  />
                  <div className="notes-add-form__row">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setNoteText('')}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                    >
                      <FiPlus size={13} />
                      Add Note
                    </button>
                  </div>
                </div>
              )}

              {notesList.length === 0 ? (
                <p className="notes-empty">No notes yet. Add one above.</p>
              ) : (
                <div className="notes-list">
                  {[...notesList].reverse().map((note) => (
                    <div key={note.id} className="note-item">
                      <div className="note-item__header">
                        <div>
                          <span className="note-item__manager">{note.manager}</span>
                          <p className="note-item__meta">{note.timestamp ? new Date(note.timestamp).toLocaleString() : ''}</p>
                        </div>
                        {onDeleteNote && (
                          <button
                            type="button"
                            className="note-item__delete"
                            onClick={() => onDeleteNote(note.id)}
                            aria-label="Delete note"
                          >
                            <FiX size={14} />
                          </button>
                        )}
                      </div>
                      <p className="note-item__text">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== ACTIVITY ========== */}
          {activeTab === 'Activity' && (
            <div>
              {taskActivity.length === 0 ? (
                <p className="drawer-activity-empty">No activity recorded for this task.</p>
              ) : (
                <div className="drawer-activity-list">
                  {taskActivity.map((entry) => (
                    <div key={entry.id} className="dash-activity-item">
                      <div className="dash-activity-icon" style={{ background: '#f1f5f9', color: '#64748b', flexShrink: 0 }}>
                        ·
                      </div>
                      <div className="dash-activity-body">
                        <p className="dash-activity-action">{entry.action}</p>
                        <p className="dash-activity-detail">
                          {entry.manager}{entry.internName ? ` → ${entry.internName}` : ''}
                        </p>
                      </div>
                      <span className="dash-activity-time">{formatTime(entry.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== HISTORY ========== */}
          {activeTab === 'History' && (
            <div>
              {(!task.history || task.history.length === 0) ? (
                <p className="history-empty">No change history available.</p>
              ) : (
                <div className="history-list">
                  {[...task.history].reverse().map((item, idx) => (
                    <div key={`${item}-${idx}`} className="history-item">
                      <div className="history-item__dot" />
                      <span className="history-item__text">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {task.createdAt && (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 12 }}>
                  Created: {new Date(task.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="drawer__footer">
          <button type="button" className="secondary-button" onClick={onDuplicate}>
            <FiCopy size={14} />
            Duplicate
          </button>
          {task.archived ? (
            onRestore && (
              <button type="button" className="secondary-button" onClick={onRestore}>
                <FiRotateCcw size={14} />
                Restore
              </button>
            )
          ) : (
            <button type="button" className="secondary-button" onClick={onArchive}>
              <FiArchive size={14} />
              Archive
            </button>
          )}
          <button type="button" className="secondary-button danger" onClick={onDelete}>
            <FiTrash2 size={14} />
            Delete
          </button>
          {activeTab === 'Overview' && (
            <button type="button" className="primary-button" onClick={handleSave}>
              <FiSave size={14} />
              Save
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

export default TaskDrawer
