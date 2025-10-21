import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// 占い師のシステムプロンプト
const FORTUNE_TELLER_SYSTEM_PROMPT = `あなたは卓越した優しい占い師です。相談者の心に寄り添い、温かく包み込むような言葉で占いを行います。

【あなたの特徴】
- 深い洞察力と共感力を持つ
- 相談者の不安や悩みを理解し、希望を与える
- 占い結果は具体的で実践的なアドバイスを含む
- 優しく、温かみのある言葉遣い
- 相談者の人生を尊重し、前向きな視点を提供する

【占いのスタイル】
1. 相談者の現状や気持ちを丁寧に汲み取る
2. タロット、星座、数秘術などを総合的に活用
3. 過去・現在・未来の流れを読み解く
4. 具体的で実践的なアドバイスを提供
5. 励ましと希望のメッセージで締めくくる

【対応時の心構え】
- 相談者の言葉の背後にある真の気持ちを察する
- ネガティブな結果でも、成長の機会として前向きに伝える
- 相談者の自己決定を尊重し、押し付けない
- プライバシーと秘密を守る

相談者一人ひとりに合わせた、心に響く占いを提供してください。`

// 相談モードのシステムプロンプト
const CONSULTATION_SYSTEM_PROMPT = `あなたは卓越した優しい占い師として、相談者の悩みに寄り添います。

【相談対応の基本】
- 相談者の気持ちを深く理解し、共感する
- 判断せず、受け入れる姿勢で聴く
- 占いの知恵を活かしながら、実践的なアドバイスを提供
- 相談者が自分で答えを見つけられるようサポート

【対話の進め方】
1. 相談内容を丁寧に聴く
2. 相談者の感情や状況を理解する
3. 占いの視点から洞察を共有
4. 具体的で実践可能な提案をする
5. 励ましと希望を与える

相談者が安心して話せる、温かい対話を心がけてください。`

// 無料鑑定を実行
export async function performFortuneTelling(userMessage, userProfile, conversationHistory = []) {
  try {
    // ユーザープロファイルを考慮したコンテキスト
    const profileContext = userProfile ? `
【相談者プロフィール】
${userProfile.personality_traits ? `性格傾向: ${JSON.stringify(userProfile.personality_traits)}` : ''}
${userProfile.interests ? `関心事: ${JSON.stringify(userProfile.interests)}` : ''}
${userProfile.concerns ? `主な悩み: ${JSON.stringify(userProfile.concerns)}` : ''}
${userProfile.communication_style ? `コミュニケーションスタイル: ${userProfile.communication_style}` : ''}
` : ''

    const messages = [
      { role: 'system', content: FORTUNE_TELLER_SYSTEM_PROMPT + profileContext },
      ...conversationHistory.map(conv => [
        { role: 'user', content: conv.user_message },
        { role: 'assistant', content: conv.assistant_message }
      ]).flat(),
      { role: 'user', content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o を使用（GPT-5は未公開のため）
      messages: messages,
      temperature: 0.8,
      max_tokens: 1000,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    })

    return {
      message: response.choices[0].message.content,
      metadata: {
        model: response.model,
        usage: response.usage,
        finish_reason: response.choices[0].finish_reason
      }
    }
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}

// 相談モードでの応答生成
export async function performConsultation(userMessage, userProfile, conversationHistory = []) {
  try {
    const profileContext = userProfile ? `
【相談者について】
${userProfile.display_name ? `名前: ${userProfile.display_name}` : ''}
${userProfile.personality_traits ? `性格: ${JSON.stringify(userProfile.personality_traits)}` : ''}
${userProfile.interests ? `関心: ${JSON.stringify(userProfile.interests)}` : ''}
${userProfile.concerns ? `悩み: ${JSON.stringify(userProfile.concerns)}` : ''}

これまでの会話から相談者をより深く理解し、その人に最適なアドバイスを提供してください。
` : ''

    const messages = [
      { role: 'system', content: CONSULTATION_SYSTEM_PROMPT + profileContext },
      ...conversationHistory.map(conv => [
        { role: 'user', content: conv.user_message },
        { role: 'assistant', content: conv.assistant_message }
      ]).flat(),
      { role: 'user', content: userMessage }
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
      presence_penalty: 0.5,
      frequency_penalty: 0.3
    })

    return {
      message: response.choices[0].message.content,
      metadata: {
        model: response.model,
        usage: response.usage,
        finish_reason: response.choices[0].finish_reason
      }
    }
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}

// ユーザープロファイリング（会話からユーザーの特性を分析）
export async function analyzeUserProfile(conversationHistory, currentProfile = null) {
  try {
    const conversationText = conversationHistory
      .map(conv => `ユーザー: ${conv.user_message}\n占い師: ${conv.assistant_message}`)
      .join('\n\n')

    const analysisPrompt = `以下の会話履歴から、相談者の性格傾向、関心事、主な悩み、コミュニケーションスタイルを分析してください。

【会話履歴】
${conversationText}

以下のJSON形式で回答してください：
{
  "personality_traits": ["特性1", "特性2", ...],
  "interests": ["関心1", "関心2", ...],
  "concerns": ["悩み1", "悩み2", ...],
  "communication_style": "スタイルの説明"
}

現在のプロファイル: ${currentProfile ? JSON.stringify(currentProfile) : 'なし'}
上記を考慮して、新しい情報があれば更新してください。`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'あなたは心理分析の専門家です。会話から人物の特性を正確に分析します。' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })

    const analysis = JSON.parse(response.choices[0].message.content)
    return analysis
  } catch (error) {
    console.error('Profile Analysis Error:', error)
    return null
  }
}
