export default function UserProfile({ profile, isLoggedIn }) {
  if (!isLoggedIn) {
    return (
      <section className="user-info">
        <h2>ユーザー情報</h2>
        <div id="user-profile">
          <p>ログインしていません</p>
        </div>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="user-info">
        <h2>ユーザー情報</h2>
        <div id="user-profile">
          <p>プロフィールを取得してください</p>
        </div>
      </section>
    )
  }

  return (
    <section className="user-info">
      <h2>ユーザー情報</h2>
      <div className="profile-card">
        <img
          src={profile.pictureUrl}
          alt={profile.displayName}
          className="profile-image"
        />
        <h3>{profile.displayName}</h3>
        {profile.statusMessage && (
          <p className="status-message">{profile.statusMessage}</p>
        )}
        <p className="user-id">User ID: {profile.userId}</p>
      </div>
    </section>
  )
}
