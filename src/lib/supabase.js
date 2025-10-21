import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './config'

// Supabase クライアント初期化
let supabaseClient = null

export function initSupabase() {
  try {
    supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
    console.log('Supabase initialized successfully')
    return supabaseClient
  } catch (error) {
    console.error('Supabase initialization error:', error)
    throw error
  }
}

export function getSupabaseClient() {
  if (!supabaseClient) {
    initSupabase()
  }
  return supabaseClient
}

// ユーザーデータを保存
export async function saveUserData(userId, profile) {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('yupoline_users')
      .upsert({
        line_user_id: userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl,
        status_message: profile.statusMessage,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'line_user_id'
      })

    if (error) throw error
    console.log('User data saved:', data)
    return data
  } catch (error) {
    console.error('Error saving user data:', error)
    throw error
  }
}

// ユーザーデータを取得
export async function getUserData(userId) {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('yupoline_users')
      .select('*')
      .eq('line_user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

// アクティビティログを保存
export async function saveActivityLog(userId, action, metadata = {}) {
  try {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('yupoline_activity_logs')
      .insert({
        line_user_id: userId,
        action: action,
        metadata: metadata,
        created_at: new Date().toISOString()
      })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving activity log:', error)
    throw error
  }
}
