export default function DataDisplay({ data }) {
  if (!data) {
    return (
      <section className="data-section">
        <h2>データ管理</h2>
        <div id="data-display">
          <p>データはここに表示されます</p>
        </div>
      </section>
    )
  }

  return (
    <section className="data-section">
      <h2>データ管理</h2>
      <div id="data-display">
        <h3>保存されたデータ</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </section>
  )
}
