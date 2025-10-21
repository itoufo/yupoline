import { getApiKey } from './auth'

const API_BASE_URL = import.meta.env.PROD
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions'

async function fetchWithAuth(url, options = {}) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Not authenticated')
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (response.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

// ユーザー一覧取得
export async function getUsers({ page = 1, limit = 50, search = '', botType = '' } = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(botType && { botType })
  })

  return fetchWithAuth(`${API_BASE_URL}/admin/get-users?${params}`)
}

// メッセージ配信
export async function broadcastMessage(data) {
  return fetchWithAuth(`${API_BASE_URL}/admin/broadcast-message`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 配信履歴取得（Supabase直接クエリ用のヘルパー）
// 注: 実際のプロジェクトではこれもAPI経由にすることを推奨
export async function getBroadcastHistory() {
  // TODO: 配信履歴取得API実装後に更新
  return { broadcasts: [] }
}
