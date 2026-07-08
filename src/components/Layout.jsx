import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function Layout({ sidebarCollapsed, setSidebarCollapsed, searchQuery, setSearchQuery, theme, setTheme, currentWeek, onOpenCreate }) {
  return (
    <div className={`app-shell ${theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onOpenCreate={onOpenCreate}
      />
      <div className={`main-panel ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          theme={theme}
          setTheme={setTheme}
          currentWeek={currentWeek}
          onOpenCreate={onOpenCreate}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
