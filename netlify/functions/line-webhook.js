import { Client, middleware } from '@line/bot-sdk'
import {
  supabase,
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  saveConversation,
  getConversationHistory,
  getOrCreateSession,
  updateSession,
  completeSession,
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

    // アクティブな鑑定セッションがあるか確認
    const fortuneSession = await getActiveSession(userId, 'fortune_telling')

    // 鑑定セッション中の場合は優先的に処理
    if (fortuneSession && ['ask_birthdate', 'ask_blood_type', 'ask_category'].includes(fortuneSession.current_state)) {
      return await handleFortuneTelling(event, userProfile, profile)
    }

    // メッセージの種類を判定
    if (messageText === '無料鑑定' || messageText.includes('鑑定')) {
      return await handleFortuneTelling(event, userProfile, profile)
    } else if (messageText === '無料相談' || messageText.includes('相談')) {
      return await handleConsultation(event, userProfile, profile)
    } else {
      // アクティブな相談セッションがあるか確認
      const consultationSession = await getActiveSession(userId, 'consultation')

      if (consultationSession && consultationSession.status === 'active') {
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

// アクティブなセッションを取得（新規作成しない）
async function getActiveSession(lineUserId, sessionType) {
  const { data, error } = await supabase
    .from('yupoline_conversation_sessions')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('session_type', sessionType)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// 無料鑑定の処理
async function handleFortuneTelling(event, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  try {
    // 「無料鑑定」メッセージの場合は新しいセッションを開始
    if (messageText === '無料鑑定') {
      // 既存のアクティブセッションを完了
      const existingSession = await getActiveSession(userId, 'fortune_telling')
      if (existingSession) {
        await completeSession(existingSession.id)
      }

      // 新しいセッションを作成
      const session = await getOrCreateSession(userId, 'fortune_telling', 'ask_birthdate')

      // アクティビティログを保存
      await saveActivityLog(userId, 'fortune_telling_start', { message: messageText })

      // 誕生日を聞く
      return askBirthdate(event, profile)
    }

    // 既存のセッションを取得
    const session = await getActiveSession(userId, 'fortune_telling')

    if (!session) {
      // セッションがない場合は新規作成して誕生日を聞く
      const newSession = await getOrCreateSession(userId, 'fortune_telling', 'ask_birthdate')
      return askBirthdate(event, profile)
    }

    // アクティビティログを保存
    await saveActivityLog(userId, 'fortune_telling_request', { message: messageText, state: session.current_state })

    // セッションの状態に応じて処理を分岐
    switch (session.current_state) {
      case 'ask_birthdate':
        return await handleBirthdateResponse(event, session, userProfile, profile)

      case 'ask_blood_type':
        return await handleBloodTypeResponse(event, session, userProfile, profile)

      case 'ask_category':
        return await handleCategoryResponse(event, session, userProfile, profile)

      default:
        // 不明な状態の場合は新しいセッションを開始
        await updateSession(session.id, 'ask_birthdate', {})
        return askBirthdate(event, profile)
    }
  } catch (error) {
    console.error('Fortune telling error:', error)
    throw error
  }
}

// 誕生日を聞く
function askBirthdate(event, profile) {
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `🔮 ${profile.displayName}様\n\n鑑定のために、まずはあなたの誕生日を教えてください。\n\n例：1990年1月15日\n　　1990/01/15`
  })
}

// 誕生日の回答を処理
async function handleBirthdateResponse(event, session, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  // 誕生日をパース
  const birthDate = parseBirthdate(messageText)

  if (!birthDate) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。誕生日の形式が認識できませんでした。\n\n「1990年1月15日」や「1990/01/15」の形式で教えてください。'
    })
  }

  // セッションデータを更新
  const sessionData = { birthDate }
  await updateSession(session.id, 'ask_blood_type', sessionData)

  // プロファイルに誕生日を保存
  await updateUserProfile(userId, { birth_date: birthDate })

  // 血液型を聞く
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ありがとうございます✨\n\n次に、血液型を教えてください。`,
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: 'A型', text: 'A型' } },
        { type: 'action', action: { type: 'message', label: 'B型', text: 'B型' } },
        { type: 'action', action: { type: 'message', label: 'O型', text: 'O型' } },
        { type: 'action', action: { type: 'message', label: 'AB型', text: 'AB型' } }
      ]
    }
  })
}

// 血液型の回答を処理
async function handleBloodTypeResponse(event, session, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  // 血液型を解析
  const bloodType = parseBloodType(messageText)

  if (!bloodType) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。血液型が認識できませんでした。\n\nA型、B型、O型、AB型のいずれかを選択してください。',
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: 'A型', text: 'A型' } },
          { type: 'action', action: { type: 'message', label: 'B型', text: 'B型' } },
          { type: 'action', action: { type: 'message', label: 'O型', text: 'O型' } },
          { type: 'action', action: { type: 'message', label: 'AB型', text: 'AB型' } }
        ]
      }
    })
  }

  // セッションデータを更新
  const sessionData = { ...session.session_data, bloodType }
  await updateSession(session.id, 'ask_category', sessionData)

  // プロファイルに血液型を保存
  await updateUserProfile(userId, { blood_type: bloodType })

  // 占いたいカテゴリを聞く
  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `${bloodType}型なのですね✨\n\nそれでは、何について占いますか？`,
    quickReply: {
      items: [
        { type: 'action', action: { type: 'message', label: '💕 恋愛運', text: '恋愛運' } },
        { type: 'action', action: { type: 'message', label: '💼 仕事運', text: '仕事運' } },
        { type: 'action', action: { type: 'message', label: '💰 金運', text: '金運' } },
        { type: 'action', action: { type: 'message', label: '🍀 総合運', text: '総合運' } },
        { type: 'action', action: { type: 'message', label: '👥 対人運', text: '対人運' } }
      ]
    }
  })
}

// カテゴリの回答を処理して占いを実行
async function handleCategoryResponse(event, session, userProfile, profile) {
  const userId = event.source.userId
  const messageText = event.message.text

  // カテゴリを解析
  const category = parseCategory(messageText)

  if (!category) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '申し訳ございません。カテゴリが認識できませんでした。\n\n以下から選択してください。',
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: '💕 恋愛運', text: '恋愛運' } },
          { type: 'action', action: { type: 'message', label: '💼 仕事運', text: '仕事運' } },
          { type: 'action', action: { type: 'message', label: '💰 金運', text: '金運' } },
          { type: 'action', action: { type: 'message', label: '🍀 総合運', text: '総合運' } },
          { type: 'action', action: { type: 'message', label: '👥 対人運', text: '対人運' } }
        ]
      }
    })
  }

  // セッションデータを更新
  const sessionData = { ...session.session_data, category }
  await updateSession(session.id, 'processing', sessionData)

  // 会話履歴を取得
  const history = await getConversationHistory(userId, 5)

  // 鑑定リクエストを構築
  const { birthDate, bloodType } = session.session_data
  const fortuneRequest = `誕生日: ${birthDate}, 血液型: ${bloodType}, 占いたいこと: ${category}`

  // GPTで鑑定を実行
  const enrichedProfile = { ...userProfile, birth_date: birthDate, blood_type: bloodType }
  const { message: fortuneResult, metadata } = await performFortuneTelling(
    fortuneRequest,
    enrichedProfile,
    history
  )

  // 会話履歴を保存
  await saveConversation(
    userId,
    'fortune_telling',
    fortuneRequest,
    fortuneResult,
    { ...metadata, category, birthDate, bloodType }
  )

  // セッションを完了
  await completeSession(session.id)

  // 応答を返す
  return client.replyMessage(event.replyToken, [
    {
      type: 'text',
      text: `🔮 ${profile.displayName}様への${category}鑑定結果\n\n${fortuneResult}`
    },
    {
      type: 'text',
      text: '他にもお悩みがあれば、お気軽にご相談くださいね✨',
      quickReply: {
        items: [
          { type: 'action', action: { type: 'message', label: '🔮 もう一度鑑定', text: '無料鑑定' } },
          { type: 'action', action: { type: 'message', label: '💬 相談する', text: '無料相談' } }
        ]
      }
    }
  ])
}

// 誕生日のパース
function parseBirthdate(text) {
  // YYYY年MM月DD日 形式
  let match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (match) {
    const [_, year, month, day] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // YYYY/MM/DD 形式
  match = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (match) {
    const [_, year, month, day] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // YYYY-MM-DD 形式
  match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    const [_, year, month, day] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return null
}

// 血液型のパース
function parseBloodType(text) {
  const normalized = text.replace(/\s+/g, '').toUpperCase()

  if (normalized.includes('A') && normalized.includes('B')) return 'AB'
  if (normalized.includes('A')) return 'A'
  if (normalized.includes('B')) return 'B'
  if (normalized.includes('O')) return 'O'

  return null
}

// カテゴリのパース
function parseCategory(text) {
  const categories = {
    '恋愛': '恋愛運',
    '仕事': '仕事運',
    '金運': '金運',
    '総合': '総合運',
    '対人': '対人運'
  }

  for (const [key, value] of Object.entries(categories)) {
    if (text.includes(key)) return value
  }

  return null
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
