import { NavLink } from 'react-router-dom'
import { FiHome, FiList, FiCalendar, FiFileText, FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi'

const navItems = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/tasks', label: 'Tasks', icon: FiList },
  { to: '/calendar', label: 'Calendar', icon: FiCalendar },
  { to: '/activity', label: 'Activity Log', icon: FiFileText },
]

function Sidebar({ collapsed, setCollapsed, onOpenCreate }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar__top">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          {!collapsed && (
            <div>
              <p className="brand-label">SafeX</p>
              <p className="brand-sub">Intern Portal</p>
            </div>
          )}
        </div>
        <button className="icon-button" type="button" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      <button className="sidebar__cta" type="button" onClick={onOpenCreate}>
        <FiPlus />
        {!collapsed && <span>Create Task</span>}
      </button>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
