import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { userId, sessionId, topics, mood, entryDrink } = await req.json()

  if (supabase && userId) {
    supabase.from('user_sessions').insert({
      user_id: userId,
      session_id: sessionId ?? null,
      topics: topics ?? null,
      mood: mood ?? null,
      entry_drink: entryDrink ?? null,
    }).then(() => {})
  }

  return Response.json({ ok: true })
}
