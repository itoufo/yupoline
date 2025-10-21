import { useState, useEffect } from 'react'
import { CONFIG, validateConfig } from '../lib/config'
import { initSupabase } from '../lib/supabase'

export function useLiff() {
  const [liffObject, setLiffObject] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // LIFF初期化
    const initializeLiff = async () => {
      try {
        // 設定の検証
        if (!validateConfig()) {
          throw new Error('環境変数が正しく設定されていません。README.mdを確認してください。')
        }

        // Supabase初期化
        initSupabase()

        // LIFF初期化
        const liff = window.liff
        if (!liff) {
          throw new Error('LIFF SDK が読み込まれていません')
        }

        await liff.init({ liffId: CONFIG.LIFF_ID })
        console.log('LIFF initialized successfully')

        setLiffObject(liff)
        setIsLoggedIn(liff.isLoggedIn())
        setIsReady(true)
      } catch (err) {
        console.error('LIFF initialization error:', err)
        setError(err.message)
        setIsReady(true)
      }
    }

    initializeLiff()
  }, [])

  return {
    liff: liffObject,
    isLoggedIn,
    isReady,
    error
  }
}
