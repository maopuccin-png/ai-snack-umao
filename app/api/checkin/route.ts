import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, entryDrink } = await req.json()

  if (supabase && sessionId && entryDrink) {
    supabase.from('checkins').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      entry_drink: entryDrink,
    }).then(() => {/* silent */})
  }

  return Response.json({ ok: true })
}
