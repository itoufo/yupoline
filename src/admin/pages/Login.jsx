import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setApiKey } from '../utils/auth'
import './Login.css'

function Login() {
  const [apiKey, setApiKeyInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!apiKey.trim()) {
      setError('API Keyを入力してください')
      return
    }

    setLoading(true)

    try {
      // API Keyを保存
      setApiKey(apiKey.trim())

      // 簡易テスト: ユーザー一覧取得で認証確認
      const testUrl = import.meta.env.PROD
        ? '/.netlify/functions/admin/get-users?page=1&limit=1'
        : 'http://localhost:8888/.netlify/functions/admin/get-users?page=1&limit=1'

      const response = await fetch(testUrl, {
        headers: {
          'X-API-Key': apiKey.trim()
        }
      })

      if (response.ok) {
        // 認証成功
        navigate('/admin')
      } else {
        setError('無効なAPI Keyです')
        setApiKey('')
      }
    } catch (err) {
      setError('認証エラー: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Yupoline Admin</h1>
        <p className="login-subtitle">管理画面にログイン</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="API Keyを入力"
              className="form-input"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="login-help">
          <p>API Keyは環境変数 ADMIN_API_KEY で設定されたキーです</p>
        </div>
      </div>
    </div>
  )
}

export default Login
