import { Client } from '@line/bot-sdk'
import { supabase } from './utils/supabase.js'

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
async function executeBroadcast(broadcast) {
  console.log(`Executing broadcast ID: ${broadcast.id}`)

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
    .eq('id', broadcast.id)

  // メッセージを送信
  let sentCount = 0
  let failedCount = 0

  for (const userId of targetUsers) {
    const result = await sendMessage(bot.client, userId, broadcast.message_text)

    // ログを保存
    await supabase
      .from('yupoline_broadcast_logs')
      .insert({
        broadcast_message_id: broadcast.id,
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
    .eq('id', broadcast.id)

  console.log(`Broadcast ${broadcast.id} completed: ${sentCount} sent, ${failedCount} failed`)

  return {
    broadcastId: broadcast.id,
    totalTarget: targetUsers.length,
    sentCount,
    failedCount
  }
}

// Scheduled Function handler (毎分実行)
export const handler = async (event) => {
  console.log('Running scheduled broadcast check...')

  try {
    const now = new Date()

    // 実行予定の配信を取得（現在時刻より前で、status が scheduled のもの）
    const { data: broadcasts, error } = await supabase
      .from('yupoline_broadcast_messages')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })

    if (error) throw error

    if (!broadcasts || broadcasts.length === 0) {
      console.log('No scheduled broadcasts to execute')
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No scheduled broadcasts' })
      }
    }

    console.log(`Found ${broadcasts.length} broadcasts to execute`)

    // 各配信を実行
    const results = []
    for (const broadcast of broadcasts) {
      try {
        const result = await executeBroadcast(broadcast)
        results.push(result)
      } catch (error) {
        console.error(`Error executing broadcast ${broadcast.id}:`, error)

        // エラー状態を記録
        await supabase
          .from('yupoline_broadcast_messages')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', broadcast.id)

        results.push({
          broadcastId: broadcast.id,
          error: error.message
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Scheduled broadcasts executed',
        results
      })
    }
  } catch (error) {
    console.error('Scheduled broadcast error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
