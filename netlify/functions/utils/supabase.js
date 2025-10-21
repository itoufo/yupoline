import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ユーザーの作成または取得
export async function getOrCreateUser(lineUserId, profile) {
  const { data, error } = await supabase
    .from('yupoline_users')
    .upsert({
      line_user_id: lineUserId,
      display_name: profile?.displayName,
      picture_url: profile?.pictureUrl,
      status_message: profile?.statusMessage,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'line_user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ユーザープロファイルの取得
export async function getUserProfile(lineUserId) {
  const { data, error } = await supabase
    .from('yupoline_user_profiles')
    .select('*')
    .eq('line_user_id', lineUserId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ユーザープロファイルの更新
export async function updateUserProfile(lineUserId, profileData) {
  const { data, error } = await supabase
    .from('yupoline_user_profiles')
    .upsert({
      line_user_id: lineUserId,
      ...profileData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'line_user_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 会話履歴の保存
export async function saveConversation(lineUserId, conversationType, userMessage, assistantMessage, metadata = {}) {
  const { data, error } = await supabase
    .from('yupoline_conversations')
    .insert({
      line_user_id: lineUserId,
      conversation_type: conversationType,
      user_message: userMessage,
      assistant_message: assistantMessage,
      message_metadata: metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// 会話履歴の取得（最新N件）
export async function getConversationHistory(lineUserId, limit = 10) {
  const { data, error } = await supabase
    .from('yupoline_conversations')
    .select('*')
    .eq('line_user_id', lineUserId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data.reverse() // 古い順に並べ替え
}

// アクティブなセッションの取得または作成
export async function getOrCreateSession(lineUserId, sessionType) {
  // 既存のアクティブセッションを探す
  const { data: existingSessions, error: fetchError } = await supabase
    .from('yupoline_conversation_sessions')
    .select('*')
    .eq('line_user_id', lineUserId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)

  if (fetchError) throw fetchError

  if (existingSessions && existingSessions.length > 0) {
    // セッションの最終アクティビティ時刻を更新
    const { data: updatedSession, error: updateError } = await supabase
      .from('yupoline_conversation_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', existingSessions[0].id)
      .select()
      .single()

    if (updateError) throw updateError
    return updatedSession
  }

  // 新しいセッションを作成
  const { data: newSession, error: createError } = await supabase
    .from('yupoline_conversation_sessions')
    .insert({
      line_user_id: lineUserId,
      session_type: sessionType,
      status: 'active',
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .select()
    .single()

  if (createError) throw createError
  return newSession
}

// アクティビティログの保存
export async function saveActivityLog(lineUserId, action, metadata = {}) {
  const { data, error } = await supabase
    .from('yupoline_activity_logs')
    .insert({
      line_user_id: lineUserId,
      action: action,
      metadata: metadata,
      created_at: new Date().toISOString()
    })

  if (error) throw error
  return data
}
