import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const { sessionId, recipient } = await req.json()
  if (!recipient) return Response.json({ error: 'recipient required' }, { status: 400 })

  if (supabase) {
    await supabase.from('ichigo_recipients').insert({
      session_id: sessionId ?? null,
      recipient,
    })
  }

  return Response.json({ ok: true })
}
