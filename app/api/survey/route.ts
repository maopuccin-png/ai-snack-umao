import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, rating, revisit, entryDrink } = await req.json()

  if (!supabase) return Response.json({ error: 'supabase not configured' }, { status: 500 })
  if (!sessionId) return Response.json({ error: 'missing sessionId' }, { status: 400 })

  const { error } = await supabase.from('surveys').insert({
    session_id: sessionId,
    nickname: nickname ?? null,
    rating,
    revisit: revisit ?? null,
    entry_drink: entryDrink ?? null,
  })

  if (error) {
    console.error('survey insert error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
