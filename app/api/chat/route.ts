import { CHARACTERS, CharacterType } from '@/lib/characters'
import { getMockResponse } from '@/lib/mockResponses'

export async function POST(req: Request) {
  const { messages, characterId, turnCount } = await req.json()

  const character = CHARACTERS[characterId as CharacterType]
  if (!character) {
    return Response.json({ error: 'Invalid character' }, { status: 400 })
  }

  // Last user message for keyword detection
  const lastUserMsg: string =
    [...(messages as { role: string; content: string }[])]
      .reverse()
      .find(m => m.role === 'user')?.content ?? ''

  const { message, callNext } = getMockResponse(
    characterId as CharacterType,
    lastUserMsg,
    turnCount as number,
  )

  // Small artificial delay so it feels like thinking
  await new Promise(r => setTimeout(r, 500 + Math.random() * 600))

  return Response.json({ message, character, callNext })
}
