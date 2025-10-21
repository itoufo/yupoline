import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      <h1 className="page-title">ダッシュボード</h1>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>総ユーザー数</h3>
          <p className="dashboard-stat">-</p>
          <small>データ取得中...</small>
        </div>

        <div className="dashboard-card">
          <h3>今月の配信数</h3>
          <p className="dashboard-stat">-</p>
          <small>データ取得中...</small>
        </div>

        <div className="dashboard-card">
          <h3>配信成功率</h3>
          <p className="dashboard-stat">-</p>
          <small>データ取得中...</small>
        </div>
      </div>

      <div className="dashboard-info">
        <h2>クイックアクション</h2>
        <div className="quick-actions">
          <a href="/admin/users" className="quick-action-button">
            👥 ユーザー一覧を見る
          </a>
          <a href="/admin/broadcast" className="quick-action-button">
            📨 メッセージを配信
          </a>
          <a href="/admin/history" className="quick-action-button">
            📜 配信履歴を確認
          </a>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
