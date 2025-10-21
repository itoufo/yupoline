import { useState } from 'react'
import { broadcastMessage } from '../utils/api'
import './Broadcast.css'

function Broadcast() {
  const [formData, setFormData] = useState({
    botType: 'fortune',
    title: '',
    messageText: '',
    targetType: 'all',
    scheduledAt: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.title.trim() || !formData.messageText.trim()) {
      setError('タイトルとメッセージを入力してください')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        scheduledAt: formData.scheduledAt || null
      }

      const result = await broadcastMessage(payload)

      if (formData.scheduledAt) {
        setSuccess(`予約配信を登録しました（配信予定: ${new Date(formData.scheduledAt).toLocaleString('ja-JP')}）`)
      } else {
        setSuccess(`即時配信を完了しました！送信: ${result.result?.sentCount || 0}件、失敗: ${result.result?.failedCount || 0}件`)
      }

      // フォームをリセット
      setFormData({
        botType: 'fortune',
        title: '',
        messageText: '',
        targetType: 'all',
        scheduledAt: ''
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="broadcast-page">
      <h1 className="page-title">メッセージ配信</h1>

      <div className="broadcast-container">
        <form onSubmit={handleSubmit} className="broadcast-form">
          <div className="form-group">
            <label htmlFor="botType">配信Bot</label>
            <select
              id="botType"
              name="botType"
              value={formData.botType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="fortune">占い師Bot</option>
              <option value="business">ビジネスコンサルBot</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">タイトル（管理用）*</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="例: 新機能のお知らせ"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="messageText">メッセージ本文*</label>
            <textarea
              id="messageText"
              name="messageText"
              value={formData.messageText}
              onChange={handleChange}
              placeholder="配信するメッセージを入力してください"
              className="form-textarea"
              rows="8"
              required
            />
            <small className="form-help">
              文字数: {formData.messageText.length}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="targetType">配信対象</label>
            <select
              id="targetType"
              name="targetType"
              value={formData.targetType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="all">全ユーザー</option>
              <option value="specific">特定ユーザー（未実装）</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scheduledAt">配信日時（オプション）</label>
            <input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={handleChange}
              className="form-input"
            />
            <small className="form-help">
              未入力の場合は即時配信されます
            </small>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? '送信中...' : (formData.scheduledAt ? '予約配信を登録' : '今すぐ配信')}
          </button>
        </form>

        <div className="broadcast-preview">
          <h3>プレビュー</h3>
          <div className="preview-box">
            <div className="preview-header">
              <strong>{formData.botType === 'fortune' ? '占い師Bot' : 'ビジネスコンサルBot'}</strong>
            </div>
            <div className="preview-message">
              {formData.messageText || 'メッセージがここに表示されます'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Broadcast
