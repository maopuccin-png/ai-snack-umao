import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId || !supabase) {
    return Response.json({ prevSession: null })
  }

  try {
    const { data } = await supabase
      .from('user_sessions')
      .select('topics, mood, entry_drink, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return Response.json({ prevSession: data ?? null })
  } catch {
    return Response.json({ prevSession: null })
  }
}
