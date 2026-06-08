import { GoogleGenerativeAI } from '@google/generative-ai'
import { CHARACTERS, CharacterType } from '@/lib/characters'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

const PROMPT_FILES: Record<CharacterType, string> = {
  mama:     'mama.md',
  realist:  'realist.md',
  accepter: 'accepter.md',
  observer: 'observer.md',
}

function loadPrompt(characterId: CharacterType): string {
  try {
    const filePath = path.join(process.cwd(), 'prompts', PROMPT_FILES[characterId])
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return CHARACTERS[characterId].systemPrompt
  }
}

export const maxDuration = 60

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

  const allMsgs = messages as { role: string; content: string; characterId?: string }[]
  const lastUserMsg = allMsgs.filter(m => m.role === 'user').at(-1)?.content ?? ''

  // Build conversation context as text to avoid Gemini's strict alternating turn requirement
  const conversationText = allMsgs
    .slice(0, -1)
    .map(m => {
      if (m.role === 'user') return `${nickname ?? 'お客さん'}: ${m.content}`
      const speakerName = m.characterId && CHARACTERS[m.characterId as CharacterType]
        ? CHARACTERS[m.characterId as CharacterType].name
        : character.name
      return `${speakerName}: ${m.content}`
    })
    .join('\n')

  const prompt = conversationText
    ? `これまでの会話:\n${conversationText}\n\n${nickname ?? 'お客さん'}: ${lastUserMsg}`
    : `${nickname ?? 'お客さん'}: ${lastUserMsg}`

  const systemPrompt = loadPrompt(characterId as CharacterType)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: `${systemPrompt}\n\nユーザーの名前は「${nickname ?? 'お客さん'}」です。\n\n【重要】返答の先頭や文中に「うまお:」「オチノリ:」「天使:」「クロちゃん:」などキャラクター名のプレフィックスを絶対に含めないでください。セリフのみを返してください。`,
  })

  const result = await model.generateContent(prompt)
  const rawText = result.response.text()

  // キャラクター名プレフィックス（「うまお: 」等）が混入した場合に除去
  const charNames = Object.values(CHARACTERS).map(c => c.name)
  const cleaned = charNames.reduce(
    (text, name) => text.replace(new RegExp(`${name}[:：]\\s*`, 'g'), ''),
    rawText
  ).trim()

  const { message, callNext } = parseCallNext(cleaned)

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
