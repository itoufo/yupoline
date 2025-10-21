import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clearApiKey } from '../utils/auth'
import './AdminLayout.css'

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearApiKey()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h1 className="admin-title">Yupoline Admin</h1>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
            📊 ダッシュボード
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
            👥 ユーザー一覧
          </NavLink>
          <NavLink to="/admin/broadcast" className={({ isActive }) => isActive ? 'active' : ''}>
            📨 メッセージ配信
          </NavLink>
          <NavLink to="/admin/history" className={({ isActive }) => isActive ? 'active' : ''}>
            📜 配信履歴
          </NavLink>
        </nav>
        <button onClick={handleLogout} className="logout-button">
          🚪 ログアウト
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
