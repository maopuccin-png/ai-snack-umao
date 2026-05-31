import { GoogleGenerativeAI } from '@google/generative-ai'
import { CHARACTERS, CharacterType } from '@/lib/characters'
import { supabase } from '@/lib/supabase'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

const CALL_MAP: Record<string, CharacterType> = {
  'リュウ': 'realist',
  'さくら': 'accepter',
  'ケンジ': 'observer',
}

function parseCallNext(text: string): { message: string; callNext: CharacterType | null } {
  const match = text.match(/\[呼ぶ:([^\]]+)\]/)
  if (!match) return { message: text.trim(), callNext: null }
  return {
    message: text.replace(match[0], '').trim(),
    callNext: CALL_MAP[match[1]] ?? null,
  }
}

export async function POST(req: Request) {
  const { messages, characterId, nickname, turnCount, sessionId, mood } = await req.json()

  const character = CHARACTERS[characterId as CharacterType]
  if (!character) {
    return Response.json({ error: 'Invalid character' }, { status: 400 })
  }

  const allMsgs = messages as { role: string; content: string }[]
  const lastUserMsg = allMsgs.filter(m => m.role === 'user').at(-1)?.content ?? ''

  // Build conversation context as text to avoid Gemini's strict alternating turn requirement
  const conversationText = allMsgs
    .slice(0, -1)
    .map(m => (m.role === 'user' ? `${nickname ?? 'お客さん'}: ${m.content}` : `${character.name}: ${m.content}`))
    .join('\n')

  const prompt = conversationText
    ? `これまでの会話:\n${conversationText}\n\n${nickname ?? 'お客さん'}: ${lastUserMsg}`
    : `${nickname ?? 'お客さん'}: ${lastUserMsg}`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `${character.systemPrompt}\n\nユーザーの名前は「${nickname ?? 'お客さん'}」です。`,
  })

  const result = await model.generateContent(prompt)
  const rawText = result.response.text()
  const { message, callNext } = parseCallNext(rawText)

  // Save to Supabase (fire and forget — don't block the response)
  if (supabase && sessionId) {
    supabase.from('messages').insert({
      session_id: sessionId,
      nickname: nickname ?? null,
      mood: mood ?? null,
      role: 'assistant',
      content: message,
      character_id: characterId,
    }).then(() => {/* silent */})
  }

  return Response.json({ message, character, callNext })
}
