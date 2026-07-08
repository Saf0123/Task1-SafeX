import { FiSearch, FiSliders, FiDownload, FiTable, FiColumns, FiCheckCircle } from 'react-icons/fi'

function FilterBar({ searchValue, onSearchChange, onCreate, onToggleView, view, onOpenFilters, onBulkAction, onExport, filters }) {
  return (
    <div className="toolbar-card">
      <div className="toolbar-card__main">
        <button className="primary-button" type="button" onClick={onCreate}>
          <FiCheckCircle />
          Create Task
        </button>
        <label className="toolbar-search">
          <FiSearch />
          <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search tasks, interns, notes" />
        </label>
        <button className="secondary-button" type="button" onClick={onOpenFilters}>
          <FiSliders />
          Filters
        </button>
        <button className="secondary-button" type="button" onClick={onBulkAction}>
          <FiCheckCircle />
          Bulk Actions
        </button>
        <button className="secondary-button" type="button" onClick={() => onToggleView(view === 'table' ? 'kanban' : 'table')}>
          {view === 'table' ? <FiColumns /> : <FiTable />}
          {view === 'table' ? 'Kanban' : 'Table'}
        </button>
        <button className="secondary-button" type="button" onClick={onExport}>
          <FiDownload />
          Export
        </button>
      </div>
      <div className="toolbar-card__meta">
        <span>{filters.week || 'Week 1'}</span>
        <span>{filters.status || 'All statuses'}</span>
        <span>{filters.priority || 'All priorities'}</span>
      </div>
    </div>
  )
}

export default FilterBar
