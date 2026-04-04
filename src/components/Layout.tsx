import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>AuthPlex</h1>
          <span className="badge">Admin</span>
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/tenants">Tenants</NavLink>
        </nav>
        <div className="sidebar-footer">
          <button onClick={logout} className="btn-link">Logout</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
