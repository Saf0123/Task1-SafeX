import { useEffect, useState } from 'react'
import { FiX, FiAlertCircle } from 'react-icons/fi'
import '../styles/tasks.css'

const STATUSES   = ['Not Started', 'In Progress', 'Under Review', 'Completed']
const PRIORITIES = ['High', 'Medium', 'Low']
const CATEGORIES = ['Design', 'Development', 'QA', 'Research', 'Operations', 'Content']
const WEEKS      = ['Week-01','Week-02','Week-03','Week-04','Week-05','Week-06','Week-07','Week-08','Week-09','Week-10','Week-11','Week-12']

const emptyForm = {
  title: '', description: '', assignedInternId: 'int-1',
  week: 'Week-01', dueDate: '', priority: 'Medium',
  status: 'Not Started', category: 'Development',
  estimatedTime: '4h', notes: '',
}

function TaskModal({ isOpen, task, interns, onClose, onSubmit }) {
  const [form, setForm]       = useState(emptyForm)
  const [errors, setErrors]   = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (task) {
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
    } else {
      setForm(emptyForm)
    }
    setErrors({})
    setSubmitted(false)
  }, [task, isOpen])

  if (!isOpen) return null

  const validate = (values) => {
    const errs = {}
    if (!values.title.trim())        errs.title    = 'Title is required.'
    if (values.title.length > 100)   errs.title    = 'Title must be 100 characters or fewer.'
    if (!values.dueDate)             errs.dueDate  = 'Due date is required.'
    if (!values.assignedInternId)    errs.intern   = 'Please assign an intern.'
    return errs
  }

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (submitted && errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSubmit(form)
  }

  const handleReset = () => {
    setForm(task ? {
      title: task.title, description: task.description,
      assignedInternId: task.assignedInternId, week: task.week,
      dueDate: task.dueDate, priority: task.priority,
      status: task.status, category: task.category,
      estimatedTime: task.estimatedTime, notes: task.notes,
    } : emptyForm)
    setErrors({})
    setSubmitted(false)
  }

  const today = new Date().toISOString().split('T')[0]
  const isPastDue = form.dueDate && form.dueDate < today

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer drawer--compact" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <div>
            <p className="drawer__eyebrow">{task ? 'Edit task' : 'Create task'}</p>
            <h3>{task ? 'Update task details' : 'Add a new task'}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        <form className="drawer__content" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="field">
            <span>Title <span style={{ color: '#dc2626' }}>*</span></span>
            <input
              value={form.title}
              maxLength={100}
              placeholder="Short, descriptive task title"
              onChange={(e) => handleChange('title', e.target.value)}
              style={errors.title ? { borderColor: '#dc2626' } : undefined}
            />
            {errors.title && (
              <p className="field-error"><FiAlertCircle size={12} style={{ marginRight: 4 }} />{errors.title}</p>
            )}
            <p className={`field-hint ${form.title.length > 80 ? 'field-hint--warn' : ''}`}>{form.title.length}/100</p>
          </div>

          {/* Description */}
          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              maxLength={500}
              placeholder="Optional — describe what needs to be done"
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <p className={`field-hint ${form.description.length > 400 ? 'field-hint--warn' : ''}`}>{form.description.length}/500</p>
          </label>

          <div className="drawer__grid">
            {/* Intern */}
            <div className="field">
              <span>Assigned Intern <span style={{ color: '#dc2626' }}>*</span></span>
              <select
                value={form.assignedInternId}
                onChange={(e) => handleChange('assignedInternId', e.target.value)}
                style={errors.intern ? { borderColor: '#dc2626' } : undefined}
              >
                {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              {errors.intern && <p className="field-error">{errors.intern}</p>}
            </div>

            {/* Priority */}
            <label className="field">
              <span>Priority</span>
              <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>

            {/* Status */}
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            {/* Category */}
            <label className="field">
              <span>Category</span>
              <select value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <div className="drawer__grid">
            {/* Week */}
            <label className="field">
              <span>Week</span>
              <select value={form.week} onChange={(e) => handleChange('week', e.target.value)}>
                {WEEKS.map((w) => <option key={w}>{w}</option>)}
              </select>
            </label>

            {/* Estimated Time */}
            <label className="field">
              <span>Estimated Time</span>
              <input
                value={form.estimatedTime}
                placeholder="e.g. 4h"
                onChange={(e) => handleChange('estimatedTime', e.target.value)}
              />
            </label>

            {/* Due Date */}
            <div className="field">
              <span>Due Date <span style={{ color: '#dc2626' }}>*</span></span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                style={errors.dueDate ? { borderColor: '#dc2626' } : undefined}
              />
              {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
              {isPastDue && !errors.dueDate && (
                <p className="field-error" style={{ color: '#d97706' }}>
                  <FiAlertCircle size={12} style={{ marginRight: 4 }} />
                  Warning: due date is in the past.
                </p>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <label className="field">
            <span>Internal Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              placeholder="Optional internal notes for this task"
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </label>

          {/* Actions */}
          <div className="drawer__footer">
            <button type="button" className="secondary-button" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default TaskModal
