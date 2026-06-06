import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, rating, entryDrink } = await req.json()

  if (supabase && sessionId) {
    supabase.from('surveys').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      rating,
      entry_drink: entryDrink ?? null,
    }).then(() => {/* silent */})
  }

  return Response.json({ ok: true })
}
