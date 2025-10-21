import { supabase } from '../utils/supabase.js'

// 簡易認証チェック（環境変数でAPIキーを設定）
function checkAuth(event) {
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key']
  const validApiKey = process.env.ADMIN_API_KEY

  if (!validApiKey) {
    throw new Error('ADMIN_API_KEY not configured')
  }

  if (apiKey !== validApiKey) {
    throw new Error('Unauthorized')
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // 認証チェック
    checkAuth(event)

    // クエリパラメータ
    const params = event.queryStringParameters || {}
    const page = parseInt(params.page) || 1
    const limit = parseInt(params.limit) || 50
    const search = params.search || ''
    const botType = params.botType || '' // 'fortune' or 'business'

    const offset = (page - 1) * limit

    // ユーザー一覧を取得
    let query = supabase
      .from('yupoline_users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 検索フィルター
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,line_user_id.ilike.%${search}%`)
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) throw error

    // プロファイル情報も取得
    const userIds = users.map(u => u.line_user_id)
    const { data: profiles } = await supabase
      .from('yupoline_user_profiles')
      .select('*')
      .in('line_user_id', userIds)

    // アクティビティ統計を取得（最終活動日時など）
    const { data: activities } = await supabase
      .from('yupoline_activity_logs')
      .select('line_user_id, created_at')
      .in('line_user_id', userIds)
      .order('created_at', { ascending: false })

    // データを結合
    const usersWithDetails = users.map(user => {
      const profile = profiles?.find(p => p.line_user_id === user.line_user_id)
      const lastActivity = activities?.find(a => a.line_user_id === user.line_user_id)

      return {
        ...user,
        profile,
        last_activity_at: lastActivity?.created_at
      }
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: usersWithDetails,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      })
    }
  } catch (error) {
    console.error('Get users error:', error)

    if (error.message === 'Unauthorized') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
