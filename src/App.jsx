import { useState, useEffect } from 'react'
import { useLiff } from './hooks/useLiff'
import { saveUserData, getUserData, saveActivityLog } from './lib/supabase'
import UserProfile from './components/UserProfile'
import Actions from './components/Actions'
import DataDisplay from './components/DataDisplay'
import Loading from './components/Loading'
import ErrorMessage from './components/ErrorMessage'

function App() {
  const { liff, isLoggedIn, isReady, error: liffError } = useLiff()
  const [userProfile, setUserProfile] = useState(null)
  const [userData, setUserData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // 初回ログイン時の処理
  useEffect(() => {
    const fetchInitialProfile = async () => {
      if (isReady && isLoggedIn && liff && !userProfile) {
        try {
          const profile = await liff.getProfile()
          setUserProfile(profile)

          // 初回アクセスログ
          await saveActivityLog(profile.userId, 'app_open')
        } catch (err) {
          console.error('プロフィール取得エラー:', err)
        }
      }
    }

    fetchInitialProfile()
  }, [isReady, isLoggedIn, liff, userProfile])

  // プロフィール取得
  const handleGetProfile = async () => {
    try {
      if (!liff) {
        setError('LIFFが初期化されていません')
        return
      }

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      setLoading(true)
      setError(null)

      const profile = await liff.getProfile()
      setUserProfile(profile)

      // Supabaseにユーザーデータを保存
      await saveUserData(profile.userId, profile)
      await saveActivityLog(profile.userId, 'get_profile')

      // 保存されたデータを取得して表示
      const data = await getUserData(profile.userId)
      setUserData(data)

      setLoading(false)
    } catch (err) {
      setError('プロフィール取得エラー: ' + err.message)
      setLoading(false)
    }
  }

  // メッセージ送信
  const handleSendMessage = async () => {
    try {
      if (!liff) {
        setError('LIFFが初期化されていません')
        return
      }

      if (!liff.isInClient()) {
        alert('この機能はLINEアプリ内でのみ利用可能です')
        return
      }

      await liff.sendMessages([
        {
          type: 'text',
          text: 'Yupoline からのメッセージです！'
        }
      ])

      if (userProfile) {
        await saveActivityLog(userProfile.userId, 'send_message')
      }

      alert('メッセージを送信しました')
    } catch (err) {
      setError('メッセージ送信エラー: ' + err.message)
    }
  }

  // LIFFを閉じる
  const handleCloseLiff = () => {
    if (!liff) {
      setError('LIFFが初期化されていません')
      return
    }

    if (liff.isInClient()) {
      liff.closeWindow()
    } else {
      alert('LIFFブラウザではないため閉じることができません')
    }
  }

  // ローディング中
  if (!isReady) {
    return (
      <div className="container">
        <header>
          <h1>Yupoline</h1>
        </header>
        <main>
          <Loading />
        </main>
        <footer>
          <p>&copy; 2024 Yupoline</p>
        </footer>
      </div>
    )
  }

  // LIFF初期化エラー
  if (liffError) {
    return (
      <div className="container">
        <header>
          <h1>Yupoline</h1>
        </header>
        <main>
          <ErrorMessage message={`LIFF初期化エラー: ${liffError}`} />
        </main>
        <footer>
          <p>&copy; 2024 Yupoline</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="container">
      <header>
        <h1>Yupoline</h1>
      </header>

      <main>
        {loading && <Loading />}
        {error && <ErrorMessage message={error} />}

        {!loading && (
          <div className="app-content">
            <UserProfile profile={userProfile} isLoggedIn={isLoggedIn} />
            <Actions
              onGetProfile={handleGetProfile}
              onSendMessage={handleSendMessage}
              onCloseLiff={handleCloseLiff}
            />
            <DataDisplay data={userData} />
          </div>
        )}
      </main>

      <footer>
        <p>&copy; 2024 Yupoline</p>
      </footer>
    </div>
  )
}

export default App
