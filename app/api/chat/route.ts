import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
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
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

async function generateWithGroq(systemPrompt: string, prompt: string, maxTokens = 300): Promise<string> {
  if (!groq) throw new Error('Groq not configured')
  const completion = await groq.chat.completions.create({
    model: 'qwen-qwq-32b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
  })
  return completion.choices[0]?.message?.content ?? ''
}

async function generateWithOpenAI(systemPrompt: string, prompt: string, maxTokens = 300): Promise<string> {
  if (!openai) throw new Error('OpenAI not configured')
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
  })
  return completion.choices[0]?.message?.content ?? ''
}

function getDateContext(): string {
  const now = new Date()
  const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
  const month = now.getMonth() + 1
  const season =
    month >= 3 && month <= 5 ? '春' :
    month >= 6 && month <= 8 ? '夏' :
    month >= 9 && month <= 11 ? '秋' : '冬'
  return `今日は${days[now.getDay()]}、季節は${season}です。`
}

const MOOD_LABELS: Record<string, string> = {
  listen:   'ただ聞いてほしかった',
  organize: '頭を整理したかった',
  advice:   'アドバイスが欲しかった',
  unsure:   'なんとなくモヤッていた',
}

const DRINK_LABELS: Record<string, string> = {
  moyamoya:    'もやもやソーダ',
  tameiki:     'ため息カフェラテ',
  hitoyasumi:  'ひとやすみ茶',
  lemonade:    'なんとなくレモネード',
}

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
  const { messages, characterId, nickname, turnCount, sessionId, mood, prevContext, event } = await req.json()

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
  const dateCtx = getDateContext()

  let fullSystemPrompt = `${systemPrompt}\n\n${dateCtx}`

  if (characterId === 'mama' && prevContext) {
    const daysAgo = Math.round((Date.now() - new Date(prevContext.created_at).getTime()) / 86400000)
    let prevStr = '\n\n【前回の来訪情報】\n'
    prevStr += daysAgo === 0 ? '今日も来てくれたのね。' : `${daysAgo}日前に来店してくれていたわ。`
    if (prevContext.topics) prevStr += `話していた内容は「${prevContext.topics}」よ。`
    if (prevContext.mood) prevStr += `その時の気分は「${MOOD_LABELS[prevContext.mood] ?? prevContext.mood}」だったわ。`
    if (prevContext.entry_drink) prevStr += `選んだドリンクは「${DRINK_LABELS[prevContext.entry_drink] ?? prevContext.entry_drink}」よ。`
    prevStr += '\n自然なタイミングで「この前どうなったのかしら？」などと一言添えてもいいわよ。まずは今日来てくれた気持ちを受け止めることを優先してね。'
    fullSystemPrompt += prevStr
  }

  if (characterId === 'mama' && event === 'web3ai') {
    fullSystemPrompt += '\n\n【イベント情報】\n今夜は「Web3AI概論」の修了イベントとして受講生が集まっています。\n今夜のお題：「もうすぐWeb３AI概論が終わっちゃう！今まで一番しんどかったことや、あなたのモヤっとしたこと、よかったら聞かせて？」\nお題をふまえて、授業や学習についての感想・モヤモヤを自然に引き出してあげてね。ただし無理に誘導せず、お客さんが話したいことから始めていいのよ。'
  }

  if (characterId === 'mama' && event === 'chibatech') {
    fullSystemPrompt += `\n\n【イベント情報】
CHIBATECHというテックイベントの会場に出張開店しています。

来場者は展示を楽しんでいる途中に立ち寄ることがあります。

展示やAIの話題が出たら、
自然にその話題も一緒に楽しんでください。

イベントを無理に話題にする必要はありません。

学生のお客様だと分かった場合は、
帰る前にICHIGOプレゼントの案内をしてください。

会話が一区切りしたら、
「展示も楽しんできてね😊」
など、一言添えて自然に送り出してください。`
  }

  fullSystemPrompt += `\n\nユーザーの名前は「${nickname ?? 'お客さん'}」です。\n\n【重要】返答の先頭や文中に「うまお:」「オチノリ:」「天使:」「クロちゃん:」などキャラクター名のプレフィックスを絶対に含めないでください。セリフのみを返してください。`

  const maxTokens = event === 'chibatech' ? 150 : 300
  let rawText: string
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: fullSystemPrompt,
      generationConfig: { maxOutputTokens: maxTokens },
    })
    const result = await model.generateContent(prompt)
    rawText = result.response.text()
  } catch (err: unknown) {
    const isQuotaError = err instanceof Error && (
      err.message.includes('429') ||
      err.message.includes('quota') ||
      err.message.includes('RESOURCE_EXHAUSTED') ||
      err.message.includes('503')
    )
    if (isQuotaError) {
      try {
        console.warn('Gemini quota exceeded, falling back to Groq')
        rawText = await generateWithGroq(fullSystemPrompt, prompt, maxTokens)
      } catch (groqErr: unknown) {
        if (openai) {
          console.warn('Groq failed, falling back to OpenAI')
          rawText = await generateWithOpenAI(fullSystemPrompt, prompt, maxTokens)
        } else {
          throw groqErr
        }
      }
    } else {
      throw err
    }
  }

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
