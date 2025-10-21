// 環境変数設定
export const CONFIG = {
  LIFF_ID: import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID_HERE',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'
}

// 設定の検証
export function validateConfig() {
  const missingConfigs = []

  if (CONFIG.LIFF_ID === 'YOUR_LIFF_ID_HERE') {
    missingConfigs.push('VITE_LIFF_ID')
  }
  if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
    missingConfigs.push('VITE_SUPABASE_URL')
  }
  if (CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    missingConfigs.push('VITE_SUPABASE_ANON_KEY')
  }

  if (missingConfigs.length > 0) {
    console.warn('以下の設定が未設定です:', missingConfigs.join(', '))
    return false
  }

  return true
}
