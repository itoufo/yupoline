import { Client } from '@line/bot-sdk'
import { supabase } from '../utils/supabase.js'

// Bot設定
const BOTS = {
  fortune: {
    client: new Client({
      channelAccessToken: process.env.FORTUNE_BOT_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.FORTUNE_BOT_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET
    })
  },
  business: {
    client: new Client({
      channelAccessToken: process.env.BUSINESS_BOT_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.BUSINESS_BOT_CHANNEL_SECRET
    })
  }
}

// 簡易認証チェック
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

// メッセージを送信
async function sendMessage(client, userId, messageText) {
  try {
    await client.pushMessage(userId, {
      type: 'text',
      text: messageText
    })
    return { success: true }
  } catch (error) {
    console.error(`Failed to send to ${userId}:`, error.message)
    return { success: false, error: error.message }
  }
}

// 配信を実行
async function executeBroadcast(broadcastId) {
  // 配信情報を取得
  const { data: broadcast, error: fetchError } = await supabase
    .from('yupoline_broadcast_messages')
    .select('*')
    .eq('id', broadcastId)
    .single()

  if (fetchError) throw fetchError

  // Bot クライアントを取得
  const bot = BOTS[broadcast.bot_type]
  if (!bot) {
    throw new Error(`Unknown bot type: ${broadcast.bot_type}`)
  }

  // 配信対象ユーザーを取得
  let targetUsers = []

  if (broadcast.target_type === 'all') {
    // 全ユーザーに配信
    const { data: users } = await supabase
      .from('yupoline_users')
      .select('line_user_id')

    targetUsers = users.map(u => u.line_user_id)
  } else if (broadcast.target_type === 'specific') {
    // 特定ユーザーに配信
    targetUsers = broadcast.target_users || []
  }

  // 配信ステータスを更新
  await supabase
    .from('yupoline_broadcast_messages')
    .update({
      status: 'sending',
      sent_at: new Date().toISOString(),
      total_target_count: targetUsers.length
    })
    .eq('id', broadcastId)

  // メッセージを送信
  let sentCount = 0
  let failedCount = 0

  for (const userId of targetUsers) {
    const result = await sendMessage(bot.client, userId, broadcast.message_text)

    // ログを保存
    await supabase
      .from('yupoline_broadcast_logs')
      .insert({
        broadcast_message_id: broadcastId,
        line_user_id: userId,
        status: result.success ? 'success' : 'failed',
        error_message: result.error || null
      })

    if (result.success) {
      sentCount++
    } else {
      failedCount++
    }

    // レート制限対策（少し待つ）
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // 配信完了ステータスを更新
  await supabase
    .from('yupoline_broadcast_messages')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount
    })
    .eq('id', broadcastId)

  return {
    broadcastId,
    totalTarget: targetUsers.length,
    sentCount,
    failedCount
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // 認証チェック
    checkAuth(event)

    const body = JSON.parse(event.body)
    const {
      botType,
      title,
      messageText,
      targetType = 'all',
      targetUsers = [],
      scheduledAt = null, // ISO 8601形式の日時文字列
      createdBy = 'admin'
    } = body

    // バリデーション
    if (!botType || !title || !messageText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    // 配信メッセージをデータベースに保存
    const { data: broadcast, error: insertError } = await supabase
      .from('yupoline_broadcast_messages')
      .insert({
        bot_type: botType,
        title,
        message_text: messageText,
        message_type: 'text',
        target_type: targetType,
        target_users: targetUsers,
        status: scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt,
        created_by: createdBy
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 即時配信の場合は実行
    if (!scheduledAt) {
      const result = await executeBroadcast(broadcast.id)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Broadcast sent successfully',
          broadcast,
          result
        })
      }
    }

    // 予約配信の場合は登録のみ
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Broadcast scheduled successfully',
        broadcast
      })
    }
  } catch (error) {
    console.error('Broadcast error:', error)

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
