export default function Actions({ onGetProfile, onSendMessage, onCloseLiff }) {
  return (
    <section className="actions">
      <h2>機能</h2>
      <button onClick={onGetProfile} className="btn btn-primary">
        プロフィール取得
      </button>
      <button onClick={onSendMessage} className="btn btn-secondary">
        メッセージ送信
      </button>
      <button onClick={onCloseLiff} className="btn btn-danger">
        LIFFを閉じる
      </button>
    </section>
  )
}
