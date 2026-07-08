import { FiBell, FiSearch, FiPlus, FiMoon, FiSun } from 'react-icons/fi'

function Topbar({ searchQuery, setSearchQuery, theme, setTheme, currentWeek, onOpenCreate }) {
  return (
    <header className="topbar">
      <div>
        <p className="topbar__eyebrow">Weekly Task Tracker</p>
        <h1>SafeX Candidate Operations</h1>
      </div>

      <div className="topbar__actions">
        <div className="topbar__week">{currentWeek}</div>
        <label className="topbar__search">
          <FiSearch />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks or interns" />
        </label>
        <button className="icon-button" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
        <button className="icon-button" type="button" aria-label="Notifications">
          <FiBell />
        </button>
        <button className="topbar__create" type="button" onClick={onOpenCreate}>
          <FiPlus />
          <span>Create</span>
        </button>
        <div className="avatar-pill">
          <div className="avatar">AN</div>
          <div>
            <p className="avatar__name">Ayesha Noor</p>
            <p className="avatar__role">Manager</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
