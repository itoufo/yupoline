import * as fortuneTeller from './bots/fortune-teller.js'
import * as businessConsultant from './bots/business-consultant.js'

// Bot設定
const BOTS = {
  fortune: {
    userId: process.env.FORTUNE_BOT_USER_ID || process.env.LINE_CHANNEL_ACCESS_TOKEN ? 'fortune' : null,
    config: {
      channelAccessToken: process.env.FORTUNE_BOT_CHANNEL_ACCESS_TOKEN || process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.FORTUNE_BOT_CHANNEL_SECRET || process.env.LINE_CHANNEL_SECRET
    },
    handler: fortuneTeller
  },
  business: {
    userId: process.env.BUSINESS_BOT_USER_ID,
    config: {
      channelAccessToken: process.env.BUSINESS_BOT_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.BUSINESS_BOT_CHANNEL_SECRET
    },
    handler: businessConsultant
  }
}

// 各Botのクライアントを初期化
Object.values(BOTS).forEach(bot => {
  if (bot.config.channelAccessToken && bot.config.channelSecret) {
    bot.handler.initializeClient(bot.config)
  }
})

// destinationからBotを特定
function getBotByDestination(destination) {
  for (const [key, bot] of Object.entries(BOTS)) {
    if (bot.userId === destination) {
      return bot
    }
  }

  // デフォルトは占い師Bot（後方互換性のため）
  console.log(`Unknown destination: ${destination}, using fortune teller bot as default`)
  return BOTS.fortune
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

    // destinationからBotを特定
    const destination = body.destination
    const bot = getBotByDestination(destination)

    if (!bot || !bot.handler) {
      console.error(`No handler found for destination: ${destination}`)
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Unknown bot destination' })
      }
    }

    console.log(`Routing to ${destination} bot handler`)

    // 適切なBotハンドラーでイベントを処理
    const results = await bot.handler.handleEvents(body.events)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, results, destination })
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
