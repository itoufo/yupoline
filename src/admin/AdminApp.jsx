import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './utils/auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Broadcast from './pages/Broadcast'
import History from './pages/History'
import AdminLayout from './components/AdminLayout'

// 認証チェック用のラッパーコンポーネント
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function AdminApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="broadcast" element={<Broadcast />} />
          <Route path="history" element={<History />} />
        </Route>
        {/* デフォルトルート */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AdminApp
