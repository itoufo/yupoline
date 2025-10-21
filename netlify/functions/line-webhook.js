import { Client, middleware } from '@line/bot-sdk'
import {
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  saveConversation,
  getConversationHistory,
  getOrCreateSession,
  saveActivityLog
} from './utils/supabase.js'
import {
  performFortuneTelling,
  performConsultation,
  analyzeUserProfile
} from './utils/openai.js'

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
}

const client = new Client(config)

// メッセージイベントの処理
async function handleMessageEvent(event) {
  const userId = event.source.userId
  const messageText = event.message.text

  try {
    // ユーザー情報を取得または作成
    const profile = await client.getProfile(userId)
    await getOrCreateUser(userId, profile)

    // ユーザープロファイルを取得
    const userProfile = await getUserProfile(userId)

    // メッセージの種類を判定
    if (messageText === '無料鑑定' || messageText.includes('鑑定')) {
      return await handleFortuneTelling(event, userProfile, profile)
    } else if (messageText === '無料相談' || messageText.includes('相談')) {
      return await handleConsultation(event, userProfile, profile)
    } else {
      // アクティブなセッションがあるか確認
      const session = await getOrCreateSession(userId, 'consultation')

      if (session && session.status === 'active') {
        // 既存の相談セッション継続
        return await handleConsultation(event, userProfile, profile)
      } else {
        // 初回メッセージまたはメニュー表示
        return await handleWelcomeMessage(event, profile)
      }
    }
  } catch (error) {
    console.error('Error handling message:', error)

    // エラーメッセージを返す
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。一時的なエラーが発生しました。もう一度お試しください。'
    })
  }
}

// 無料鑑定の処理
async function handleFortuneTelling(event, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  try {
    // セッションを作成
    await getOrCreateSession(userId, 'fortune_telling')

    // アクティビティログを保存
    await saveActivityLog(userId, 'fortune_telling_request', { message: messageText })

    // 会話履歴を取得（最新5件）
    const history = await getConversationHistory(userId, 5)

    // 鑑定リクエストメッセージ
    let fortuneRequest = messageText
    if (messageText === '無料鑑定') {
      fortuneRequest = '今日の運勢を占ってください'
    }

    // GPTで鑑定を実行
    const { message: fortuneResult, metadata } = await performFortuneTelling(
      fortuneRequest,
      userProfile,
      history
    )

    // 会話履歴を保存
    await saveConversation(
      userId,
      'fortune_telling',
      fortuneRequest,
      fortuneResult,
      metadata
    )

    // プロファイリング更新（5回会話ごと）
    if (history.length > 0 && history.length % 5 === 0) {
      const analysis = await analyzeUserProfile(history, userProfile)
      if (analysis) {
        await updateUserProfile(userId, analysis)
      }
    }

    // 応答を返す
    return client.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: `🔮 ${profile.displayName}様への鑑定結果\n\n${fortuneResult}`
      },
      {
        type: 'text',
        text: '他にもお悩みがあれば、お気軽にご相談くださいね✨',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔮 もう一度鑑定',
                text: '無料鑑定'
              }
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '💬 相談する',
                text: '無料相談'
              }
            }
          ]
        }
      }
    ])
  } catch (error) {
    console.error('Fortune telling error:', error)
    throw error
  }
}

// 無料相談の処理
async function handleConsultation(event, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  try {
    // セッションを作成または更新
    await getOrCreateSession(userId, 'consultation')

    // アクティビティログを保存
    await saveActivityLog(userId, 'consultation_message', { message: messageText })

    // 会話履歴を取得（最新10件）
    const history = await getConversationHistory(userId, 10)

    // 相談メッセージ
    let consultationMessage = messageText
    if (messageText === '無料相談') {
      consultationMessage = 'こんにちは。どんなことでお悩みですか？お気軽にお話しください。'

      // 初回メッセージ
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: `💖 ${profile.displayName}様、ようこそ\n\nこんにちは。どんなことでお悩みですか？\n\n恋愛、仕事、人間関係、将来のこと...何でもお気軽にお話しくださいね。\n\nあなたの心に寄り添い、一緒に考えていきましょう✨`
      })
    }

    // GPTで応答を生成
    const { message: response, metadata } = await performConsultation(
      consultationMessage,
      userProfile,
      history
    )

    // 会話履歴を保存
    await saveConversation(
      userId,
      'consultation',
      consultationMessage,
      response,
      metadata
    )

    // プロファイリング更新（3回会話ごと）
    const updatedHistory = await getConversationHistory(userId, 10)
    if (updatedHistory.length > 0 && updatedHistory.length % 3 === 0) {
      const analysis = await analyzeUserProfile(updatedHistory, userProfile)
      if (analysis) {
        await updateUserProfile(userId, analysis)
      }
    }

    // 応答を返す
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: response,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'message',
              label: '🔮 鑑定してほしい',
              text: '無料鑑定'
            }
          },
          {
            type: 'action',
            action: {
              type: 'message',
              label: '💬 続けて相談',
              text: 'はい'
            }
          }
        ]
      }
    })
  } catch (error) {
    console.error('Consultation error:', error)
    throw error
  }
}

// ウェルカムメッセージ
async function handleWelcomeMessage(event, profile) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `✨ ${profile.displayName}様、こんにちは\n\n私は優しい占い師です。\nあなたの心に寄り添い、未来への道しるべをお示しいたします。\n\n【ご利用方法】\n🔮 無料鑑定 - 今日の運勢や気になることを占います\n💬 無料相談 - お悩みをじっくりお聴きします\n\nどちらかお選びください✨`,
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'message',
            label: '🔮 無料鑑定',
            text: '無料鑑定'
          }
        },
        {
          type: 'action',
          action: {
            type: 'message',
            label: '💬 無料相談',
            text: '無料相談'
          }
        }
      ]
    }
  })
}

// Postbackイベントの処理（リッチメニューなど）
async function handlePostbackEvent(event) {
  const userId = event.source.userId
  const data = event.postback.data

  const profile = await client.getProfile(userId)
  await getOrCreateUser(userId, profile)

  if (data === 'fortune_telling') {
    event.message = { text: '無料鑑定' }
    return handleMessageEvent(event)
  } else if (data === 'consultation') {
    event.message = { text: '無料相談' }
    return handleMessageEvent(event)
  }
}

// メインハンドラー
export const handler = async (event) => {
  try {
    // CORSヘッダーを設定
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }

    // OPTIONSリクエスト（プリフライト）の処理
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      }
    }

    // POSTリクエストのみ受け付ける
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method Not Allowed' })
      }
    }

    // Webhookイベントをパース
    const body = JSON.parse(event.body)

    // 署名検証
    const signature = event.headers['x-line-signature']
    // TODO: 本番環境では署名検証を実装

    // 各イベントを処理
    const results = await Promise.all(
      body.events.map(async (webhookEvent) => {
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
          console.error('Event handling error:', err)
          return null
        }
      })
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    }
  }
}
