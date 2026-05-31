import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, amount } = await req.json()

  if (!sessionId || !amount) {
    return Response.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (supabase) {
    const { error } = await supabase.from('tips').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      amount,
    })
    if (error) {
      console.error('Supabase tip insert error:', error.message)
    }
  }

  return Response.json({ ok: true })
}
