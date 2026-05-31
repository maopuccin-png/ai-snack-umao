import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, mood, role, content } = await req.json()

  if (!sessionId || !role || !content) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (supabase) {
    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      mood: mood ?? null,
      role,
      content,
      character_id: null,
    })
    if (error) {
      console.error('Supabase message insert error:', error.message)
    }
  }

  return Response.json({ ok: true })
}
