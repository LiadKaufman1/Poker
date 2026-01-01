import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://demo.supabase.co'
const supabaseKey = 'demo-key-replace-with-real'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const saveRoom = async (roomCode, roomData) => {
  const { error } = await supabase
    .from('rooms')
    .upsert({ 
      code: roomCode, 
      data: roomData,
      updated_at: new Date()
    })
  return !error
}

export const loadRoom = async (roomCode) => {
  const { data } = await supabase
    .from('rooms')
    .select('data')
    .eq('code', roomCode)
    .single()
  return data?.data || null
}