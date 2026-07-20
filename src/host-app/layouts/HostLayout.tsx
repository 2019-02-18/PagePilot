import { NavLink, Outlet } from 'react-router-dom'
import './HostLayout.css'

const menuItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/batch', label: '体检任务管理', icon: '📋' },
  { path: '/data-detail', label: '体检数据明细', icon: '📊' },
  { path: '/abnormal-screening', label: '异常筛查', icon: '⚠️' },
  { path: '/recheck-list', label: '复查名单', icon: '📝' },
]

export default function HostLayout() {
  return (
    <div className="host-layout">
      <header className="topbar">
        <div className="topbar-logo">
          <span className="logo-icon">健</span>
          <span className="logo-text">中小学生健康体检管理后台</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-user">数据操作员</span>
        </div>
      </header>
      <aside className="sidebar">
        <nav className="side-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `side-item${isActive ? ' active' : ''}`
              }
              data-pagepilot-nav={item.label}
            >
              <span className="side-icon">{item.icon}</span>
              <span className="side-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
