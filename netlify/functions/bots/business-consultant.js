import { Client } from '@line/bot-sdk'
import {
  supabase,
  getOrCreateUser,
  saveActivityLog
} from '../utils/supabase.js'

let client = null

// クライアントを初期化
export function initializeClient(config) {
  client = new Client(config)
  return client
}

// メッセージイベントの処理
async function handleMessageEvent(event) {
  const userId = event.source.userId
  const messageText = event.message.text

  try {
    // ユーザー情報を取得または作成
    const profile = await client.getProfile(userId)
    await getOrCreateUser(userId, profile)

    // アクティビティログを保存
    await saveActivityLog(userId, 'message', { message: messageText })

    // TODO: ステップメール機能の実装
    // 現在は基本的な応答のみ
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `${profile.displayName}様、こんにちは！\n\nビジネスコンサルBotです。\nステップメール機能は現在準備中です。`
    })
  } catch (error) {
    console.error('Error handling message:', error)

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。一時的なエラーが発生しました。もう一度お試しください。'
    })
  }
}

// ウェルカムメッセージ
async function handleWelcomeMessage(event, profile) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `${profile.displayName}様、フォローありがとうございます！\n\nビジネスコンサルBotです。\n\nステップメールでビジネスに役立つ情報をお届けします✨`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '📧 ステップメール開始',
            text: 'ステップメール開始'
          }
        }
      ]
    }
  })
}

// Postbackイベントの処理
async function handlePostbackEvent(event) {
  const userId = event.source.userId
  const data = event.postback.data

  const profile = await client.getProfile(userId)
  await getOrCreateUser(userId, profile)

  // TODO: Postback処理の実装
  return null
}

// ビジネスコンサルBotのイベント処理
export async function handleEvents(webhookEvents) {
  const results = await Promise.all(
    webhookEvents.map(async (webhookEvent) => {
      try {
        if (webhookEvent.type === 'message' && webhookEvent.message.type === 'text') {
          return await handleMessageEvent(webhookEvent)
        } else if (webhookEvent.type === 'postback') {
          return await handlePostbackEvent(webhookEvent)
        } else if (webhookEvent.type === 'follow') {
          // フォローイベント
          const profile = await client.getProfile(webhookEvent.source.userId)
          await getOrCreateUser(webhookEvent.source.userId, profile)
          await saveActivityLog(webhookEvent.source.userId, 'follow')
          return handleWelcomeMessage(webhookEvent, profile)
        }
        return null
      } catch (err) {
        console.error('Business consultant event handling error:', err)
        return null
      }
    })
  )

  return results
}
