import { useState, useEffect } from 'react'
import { getUsers } from '../utils/api'
import './Users.css'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    loadUsers()
  }, [page, search])

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getUsers({ page, limit: 50, search })
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('ja-JP')
  }

  return (
    <div className="users-page">
      <h1 className="page-title">ユーザー一覧</h1>

      <div className="users-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="ユーザー名またはIDで検索"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍 検索
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>表示名</th>
                  <th>LINE User ID</th>
                  <th>誕生日</th>
                  <th>血液型</th>
                  <th>登録日時</th>
                  <th>最終活動</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      ユーザーが見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-name">
                          {user.picture_url && (
                            <img src={user.picture_url} alt="" className="user-avatar" />
                          )}
                          {user.display_name || '-'}
                        </div>
                      </td>
                      <td><code>{user.line_user_id}</code></td>
                      <td>{user.profile?.birth_date ? formatDate(user.profile.birth_date).split(' ')[0] : '-'}</td>
                      <td>{user.profile?.blood_type ? `${user.profile.blood_type}型` : '-'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.last_activity_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="pagination-button"
              >
                ← 前へ
              </button>
              <span className="pagination-info">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="pagination-button"
              >
                次へ →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Users
