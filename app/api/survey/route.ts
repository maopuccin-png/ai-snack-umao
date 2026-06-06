import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, nickname, rating } = await req.json()

  if (supabase && sessionId) {
    supabase.from('surveys').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      rating,
    }).then(() => {/* silent */})
  }

  return Response.json({ ok: true })
}
