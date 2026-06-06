'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CHARACTERS, TRIGGERS, MOOD_OPENERS,
  CharacterType, MoodType,
} from '@/lib/characters'
import {
  AWAY_MESSAGES, RETURN_MESSAGES,
  FAREWELL, TIP_THANKS, GREETINGS, MAMA_CLOSING, getSummary,
} from '@/lib/mockResponses'

// ─── ドリンク選択肢 ───────────────────────────────────────────────────────
const DRINK_OPTIONS = [
  { id: 'moyamoya',   emoji: '🍹', name: 'もやもやソーダ',       response: 'そっかあ。気になってることがある日なんだね。話せるところからでいいよ。' },
  { id: 'tameiki',    emoji: '☕', name: 'ため息カフェラテ',      response: 'うんうん、おつかれさま。ふぅ、ってしたあとちょっと、ゆるまるといいな。今日はゆっくりしていってね。' },
  { id: 'hitoyasumi', emoji: '🍵', name: 'ひとやすみ茶',         response: 'うんうん。たまには立ち止まる日も大事。ゆったりしていってね。' },
  { id: 'lemonade',   emoji: '🍋', name: 'なんとなくレモネード', response: 'ふふっ。そういう日もあるよね。席は空いてるから、のんびりしていってね。' },
] as const

type DrinkId = typeof DRINK_OPTIONS[number]['id']

// ─── Types ────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  characterId: CharacterType
  isJoining?: boolean
  isDrinkSelection?: boolean
  isAway?: boolean
  isReturn?: boolean
  isIntro?: boolean
}

type CharStatus = 'absent' | 'present' | 'away'

// ─── Helpers ──────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function detectTrigger(text: string, skip: Set<CharacterType>): CharacterType | null {
  for (const [char, words] of Object.entries(TRIGGERS)) {
    if (!skip.has(char as CharacterType) && (words as string[]).some(w => text.includes(w))) {
      return char as CharacterType
    }
  }
  return null
}

const CHAR_ORDER: CharacterType[] = ['mama', 'realist', 'accepter', 'observer']

// ─── @メンション ──────────────────────────────────────────────────────────
const MENTION_MAP: Record<string, CharacterType> = {
  'うまお': 'mama', 'ママ': 'mama',
  'オチノリ': 'realist',
  '天使': 'accepter',
  'クロちゃん': 'observer', 'クロ': 'observer',
}
const MENTION_NAMES = [
  { name: 'うまお',    cid: 'mama'     as CharacterType },
  { name: 'オチノリ',  cid: 'realist'  as CharacterType },
  { name: '天使',      cid: 'accepter' as CharacterType },
  { name: 'クロちゃん',cid: 'observer' as CharacterType },
]

function parseMention(text: string): CharacterType | null {
  const m = text.match(/@(\S+)/)
  if (!m) return null
  return MENTION_MAP[m[1]] ?? null
}

function renderWithMention(text: string) {
  return text.split(/(@\S+)/).map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-amber-400 font-medium">{part}</span>
      : part
  )
}

// ─── Tip Modal ────────────────────────────────────────────────────────────
function TipModal({
  activeChars,
  onTip,
  onClose,
}: {
  activeChars: CharacterType[]
  onTip: (amount: number) => void
  onClose: () => void
}) {
  const RECIPIENT = '0xb091A00C0Fa5200B768d9eB3f89C7C4C73BAC710'
  type Step = 'wallet' | 'connecting' | 'amount' | 'sending' | 'done'
  const [step, setStep] = useState<Step>('wallet')
  const [amount, setAmount] = useState(5)

  const connect = () => {
    setStep('connecting')
    setTimeout(() => setStep('amount'), 1200)
  }
  const send = () => {
    setStep('sending')
    setTimeout(() => { setStep('done'); onTip(amount) }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1030] border border-gray-800 rounded-2xl w-full max-w-sm p-6">
        {step === 'done' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🪙</div>
            <p className="text-white font-bold text-lg mb-1">{amount} SNACK 送金完了！</p>
            <p className="text-gray-500 text-xs mb-6">気持ちが届きました</p>
            <button onClick={onClose} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">
              閉じる
            </button>
          </div>
        )}
        {step === 'sending' && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3 animate-bounce">🪙</div>
            <p className="text-gray-400 text-sm animate-pulse">送金中…</p>
          </div>
        )}
        {step === 'connecting' && (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm animate-pulse">ウォレット接続中…</p>
          </div>
        )}
        {step === 'amount' && (
          <>
            <h2 className="text-white font-bold mb-1">金額を選ぶ</h2>
            <p className="text-gray-600 text-xs mb-4">1 SNACK ≈ 気持ちのひとかけら</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[1, 5, 10].map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                    amount === a
                      ? 'border-amber-600 bg-amber-950/30 text-amber-300'
                      : 'border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  {a} SNACK
                </button>
              ))}
            </div>
            <div className="mb-4 p-2.5 bg-[#0d0d18] rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-600 mb-0.5">送金先</p>
              <p className="text-[10px] text-gray-400 font-mono break-all">{RECIPIENT}</p>
            </div>
            <button onClick={send} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">
              送金する 🪙
            </button>
          </>
        )}
        {step === 'wallet' && (
          <>
            <h2 className="text-white font-bold mb-1">投げ銭する 🪙</h2>
            <p className="text-gray-500 text-xs mb-5 leading-relaxed">
              いい時間だったら、SNACK トークンで気持ちを送れます。完全任意です。
            </p>
            <div className="space-y-2 mb-5">
              {[
                { icon: '🦊', name: 'MetaMask',     desc: '最もポピュラーなウォレット' },
                { icon: '🔗', name: 'WalletConnect', desc: 'モバイルウォレット対応' },
              ].map(w => (
                <button
                  key={w.name}
                  onClick={connect}
                  className="w-full flex items-center gap-3 p-3 bg-[#0d0d18] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors text-left"
                >
                  <span className="text-2xl">{w.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-300">{w.name}</p>
                    <p className="text-[10px] text-gray-600">{w.desc}</p>
                  </div>
                  <span className="text-xs text-amber-600">接続 →</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-full py-2 text-gray-700 text-xs">
              今回はいいです
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Exit Modal ───────────────────────────────────────────────────────────
function ExitModal({
  presentChars,
  userMessages,
  turnCount,
  sessionId,
  nickname,
  entryDrink,
  onConfirm,
  onCancel,
}: {
  presentChars: CharacterType[]
  userMessages: string[]
  turnCount: number
  sessionId: string
  nickname: string
  entryDrink: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  type Step = 'confirm' | 'survey' | 'thanks'
  const [step, setStep] = useState<Step>('confirm')
  const [closingWord] = useState(() => pick(MAMA_CLOSING))
  const summary = getSummary(userMessages)
  const farewells = useRef(
    presentChars.map(cid => ({ cid, msg: pick(FAREWELL[cid]) }))
  )

  const submitRating = (rating: number) => {
    fetch('/api/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, nickname, rating, entryDrink }),
    }).catch(() => {/* silent */})
    setStep('thanks')
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1030] border border-gray-800 rounded-2xl w-full max-w-sm p-6">

        {/* Step 1: 挨拶 + 退店確認 */}
        {step === 'confirm' && (
          <>
            <h2 className="text-white font-bold mb-1">もう帰る？</h2>
            <p className="text-gray-600 text-xs mb-5">
              今日は{summary}について話しました（{turnCount}回のやりとり）
            </p>
            <div className="space-y-4 mb-6">
              {farewells.current.map(({ cid, msg }) => {
                const c = CHARACTERS[cid]
                return (
                  <div key={cid} className="flex gap-3 items-start">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border"
                      style={{ borderColor: c.color, backgroundColor: c.bgColor }}
                    >
                      {c.emoji}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: c.color }}>{c.title}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{msg}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 py-3 border border-gray-800 text-gray-500 rounded-xl text-sm">
                もう少し話す
              </button>
              <button onClick={() => setStep('survey')} className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">
                退店する
              </button>
            </div>
          </>
        )}

        {/* Step 2: アンケート */}
        {step === 'survey' && (
          <>
            <p className="text-white text-sm font-medium mb-1">今日はどうだった？</p>
            <p className="text-gray-600 text-[11px] mb-5">少し近いものを選んでね</p>
            <div className="space-y-2 mb-5">
              {([
                { label: 'うんうん、わかってもらえた', rating: 5 },
                { label: 'わりと話せた', rating: 4 },
                { label: 'まあまあかな', rating: 3 },
                { label: 'ちょっと伝わらなかったかも', rating: 2 },
                { label: '今日は噛み合わなかったなあ', rating: 1 },
              ] as { label: string; rating: number }[]).map(({ label, rating }) => (
                <button
                  key={rating}
                  onClick={() => submitRating(rating)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-800 text-gray-400 text-sm hover:border-amber-700/60 hover:text-amber-300 hover:bg-amber-950/10 transition-all active:scale-[0.98]"
                >
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('thanks')} className="w-full text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
              回答せずに帰る
            </button>
          </>
        )}

        {/* Step 3: ママの締めの一言 */}
        {step === 'thanks' && (
          <>
            <div className="flex gap-3 items-start mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2"
                style={{ borderColor: CHARACTERS.mama.color, backgroundColor: CHARACTERS.mama.bgColor }}
              >
                {CHARACTERS.mama.emoji}
              </div>
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: CHARACTERS.mama.color }}>
                  {CHARACTERS.mama.title}
                </p>
                <p className="text-gray-200 text-sm leading-relaxed">「{closingWord}」</p>
              </div>
            </div>
            <button
              onClick={onConfirm}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium"
            >
              帰る
            </button>
          </>
        )}

      </div>
    </div>
  )
}

// ─── Main Chat ────────────────────────────────────────────────────────────
function ChatContent() {
  const router = useRouter()
  const params = useSearchParams()
  const nickname = params.get('nickname') || 'あなた'
  const mood = (params.get('mood') || 'unsure') as MoodType

  const sessionId = useRef(crypto.randomUUID())
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDrink, setSelectedDrink] = useState<DrinkId | null>(null)
  const [mentionCandidates, setMentionCandidates] = useState<typeof MENTION_NAMES>([])

  // @入力を検知してオートコンプリート候補を更新
  const handleInputChange = (val: string) => {
    setInput(val)
    const m = val.match(/@(\S*)$/)
    if (m) {
      const q = m[1].toLowerCase()
      setMentionCandidates(MENTION_NAMES.filter(n => n.name.toLowerCase().startsWith(q)))
    } else {
      setMentionCandidates([])
    }
  }

  const insertMention = (name: string) => {
    const replaced = input.replace(/@\S*$/, `@${name} `)
    setInput(replaced)
    setMentionCandidates([])
  }
  const [charStatus, setCharStatus] = useState<Record<CharacterType, CharStatus>>({
    mama: 'present', realist: 'absent', accepter: 'absent', observer: 'absent',
  })
  // Track which turn each regular joined (for away logic)
  const joinedAtTurn = useRef<Partial<Record<CharacterType, number>>>({})
  const awayReturnAt = useRef<Partial<Record<CharacterType, number>>>({})

  const [focusedChar, setFocusedChar] = useState<CharacterType>('mama')

  const handleFocusChar = async (cid: CharacterType) => {
    if (cid === focusedChar) return
    setFocusedChar(cid)
    const turn = turnRef.current

    let current = messages
    // absent → join first
    if (charStatus[cid] === 'absent') {
      const reg = CHARACTERS[cid]
      await new Promise(r => setTimeout(r, 300))
      const joinMsg: Message = {
        id: `j${Date.now()}`, role: 'assistant',
        content: reg.joinLine, characterId: cid, isJoining: true,
      }
      current = [...current, joinMsg]
      setMessages(current)
      setCharStatus(prev => ({ ...prev, [cid]: 'present' }))
      joinedAtTurn.current[cid] = turn
      await new Promise(r => setTimeout(r, 500))
    }
    // away → return
    if (charStatus[cid] === 'away') {
      const retMsgs = RETURN_MESSAGES[cid]
      if (retMsgs) {
        const retMsg: Message = {
          id: `ret${Date.now()}`, role: 'assistant',
          content: pick(retMsgs), characterId: cid, isReturn: true,
        }
        current = [...current, retMsg]
        setMessages(current)
        setCharStatus(prev => ({ ...prev, [cid]: 'present' }))
        delete awayReturnAt.current[cid]
        await new Promise(r => setTimeout(r, 400))
      }
    }
    // greeting
    const greetMsg: Message = {
      id: `gr${Date.now()}`, role: 'assistant',
      content: pick(GREETINGS[cid]), characterId: cid,
    }
    setMessages(prev => [...prev, greetMsg])
  }

  const [showTip, setShowTip] = useState(false)
  const [showExit, setShowExit] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef(0)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Opening sequence
  useEffect(() => {
    const openMsg: Message = {
      id: 'open',
      role: 'assistant',
      content: MOOD_OPENERS[mood],
      characterId: 'mama',
    }
    const drinkSelectionMsg: Message = {
      id: 'drink',
      role: 'assistant',
      content: 'まずは今日の一杯、選んでみる？',
      characterId: 'mama',
      isDrinkSelection: true,
    }
    const introMsg: Message = {
      id: 'intro',
      role: 'assistant',
      content: '今夜のメンバーを紹介するわね。',
      characterId: 'mama',
      isIntro: true,
    }
    setMessages([openMsg, introMsg, drinkSelectionMsg])
  }, [mood])

  // ドリンク選択ハンドラ
  const handleDrinkSelect = (drinkId: DrinkId) => {
    setSelectedDrink(drinkId)
    const option = DRINK_OPTIONS.find(d => d.id === drinkId)!
    setMessages(prev => [
      ...prev,
      {
        id: `dr${Date.now()}`,
        role: 'assistant',
        content: option.response,
        characterId: 'mama',
      },
      {
        id: 'follow',
        role: 'assistant',
        content: `${option.emoji} ${option.name}、お待たせしました！で、今日はどうしたの？`,
        characterId: 'mama',
      },
    ])
  }

  const callAPI = async (msgs: Message[], characterId: CharacterType) => {
    const apiMessages = msgs.filter(m => !m.isJoining && !m.isDrinkSelection && !m.isAway && !m.isReturn)
      .map(m => ({ role: m.role, content: m.content, characterId: m.characterId }))
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        characterId,
        nickname,
        mood,
        turnCount: turnRef.current,
        sessionId: sessionId.current,
      }),
    })
    if (!res.ok) throw new Error('API error')
    return res.json()
  }

  const addMsg = (msgs: Message[], msg: Message) => {
    const next = [...msgs, msg]
    setMessages(next)
    return next
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.value = ''
    setLoading(true)
    turnRef.current++
    const turn = turnRef.current

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: text, characterId: 'mama' }
    let current = addMsg(messages, userMsg)

    // Save user message to DB (fire and forget)
    fetch('/api/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.current, nickname, mood, role: 'user', content: text }),
    }).catch(() => {/* silent */})

    try {
      // ── Check if any "away" characters should return ──
      for (const [cid, returnAt] of Object.entries(awayReturnAt.current)) {
        if (returnAt !== undefined && turn >= returnAt && charStatus[cid as CharacterType] === 'away') {
          const returnMsgs = RETURN_MESSAGES[cid as CharacterType]
          if (returnMsgs) {
            await new Promise(r => setTimeout(r, 300))
            const returnMsg: Message = {
              id: `ret${Date.now()}`,
              role: 'assistant',
              content: pick(returnMsgs),
              characterId: cid as CharacterType,
              isReturn: true,
            }
            current = addMsg(current, returnMsg)
            setCharStatus(prev => ({ ...prev, [cid]: 'present' }))
            delete awayReturnAt.current[cid as CharacterType]
          }
        }
      }

      // ── @メンション分岐 ──
      const mentionedChar = parseMention(text)

      if (mentionedChar) {
        // 不在なら入店させる
        if (charStatus[mentionedChar] === 'absent') {
          const reg = CHARACTERS[mentionedChar]
          await new Promise(r => setTimeout(r, 400))
          const joinMsg: Message = {
            id: `j${Date.now()}`, role: 'assistant',
            content: reg.joinLine, characterId: mentionedChar, isJoining: true,
          }
          current = addMsg(current, joinMsg)
          setCharStatus(prev => ({ ...prev, [mentionedChar]: 'present' }))
          joinedAtTurn.current[mentionedChar] = turn
          await new Promise(r => setTimeout(r, 600))
        }
        // 席外し中なら呼び戻す
        if (charStatus[mentionedChar] === 'away') {
          const retMsgs = RETURN_MESSAGES[mentionedChar]
          if (retMsgs) {
            const retMsg: Message = {
              id: `ret${Date.now()}`, role: 'assistant',
              content: pick(retMsgs), characterId: mentionedChar, isReturn: true,
            }
            current = addMsg(current, retMsg)
            setCharStatus(prev => ({ ...prev, [mentionedChar]: 'present' }))
            delete awayReturnAt.current[mentionedChar]
            await new Promise(r => setTimeout(r, 400))
          }
        }
        // 指名キャラが直接返す
        const mentionRes = await callAPI(current, mentionedChar)
        current = addMsg(current, {
          id: `mn${Date.now()}`, role: 'assistant',
          content: mentionRes.message, characterId: mentionedChar,
        })
      } else if (focusedChar !== 'mama') {
        // ── 指名キャラに直接送る ──
        const focusRes = await callAPI(current, focusedChar)
        current = addMsg(current, {
          id: `f${Date.now()}`, role: 'assistant',
          content: focusRes.message, characterId: focusedChar,
        })
      } else {
        // ── 通常フロー：ママが返す ──
        const mamaRes = await callAPI(current, 'mama')
        const mamaMsg: Message = { id: `m${Date.now()}`, role: 'assistant', content: mamaRes.message, characterId: 'mama' }
        current = addMsg(current, mamaMsg)

        // ── 常連参加判定 ──
        const presentSet = new Set(CHAR_ORDER.filter(c => charStatus[c] === 'present') as CharacterType[])
        const absentSet  = new Set(CHAR_ORDER.filter(c => charStatus[c] === 'absent')  as CharacterType[])

        let triggerChar: CharacterType | null = mamaRes.callNext ?? null
        if (!triggerChar && turn >= 1 && absentSet.size > 0) {
          const allUserText = current.filter(m => m.role === 'user').map(m => m.content).join(' ')
          triggerChar = detectTrigger(allUserText, presentSet)
        }
        if (triggerChar === 'mama' || !absentSet.has(triggerChar as CharacterType)) triggerChar = null

        if (triggerChar) {
          const reg = CHARACTERS[triggerChar]
          await new Promise(r => setTimeout(r, 500))
          current = addMsg(current, {
            id: `j${Date.now()}`, role: 'assistant',
            content: reg.joinLine, characterId: triggerChar, isJoining: true,
          })
          setCharStatus(prev => ({ ...prev, [triggerChar!]: 'present' }))
          joinedAtTurn.current[triggerChar] = turn
          await new Promise(r => setTimeout(r, 700))
          const regRes = await callAPI(current, triggerChar)
          current = addMsg(current, {
            id: `r${Date.now()}`, role: 'assistant',
            content: regRes.message, characterId: triggerChar,
          })
        } else if (presentSet.size > 1) {
          for (const cid of [...presentSet].filter(c => c !== 'mama')) {
            const charWords = TRIGGERS[cid] as string[] | undefined
            if (charWords?.some(w => text.includes(w))) {
              await new Promise(r => setTimeout(r, 600))
              const res = await callAPI(current, cid)
              current = addMsg(current, {
                id: `e${Date.now()}`, role: 'assistant',
                content: res.message, characterId: cid,
              })
              break
            }
          }
        }
      }

      // ── Random "away" for present regulars ──
      const presentRegulars = CHAR_ORDER.filter(c => c !== 'mama' && charStatus[c] === 'present') as CharacterType[]
      for (const cid of presentRegulars) {
        const joinedAt = joinedAtTurn.current[cid] ?? 0
        if (turn - joinedAt >= 4 && Math.random() < 0.05) {
          const awayMsgs = AWAY_MESSAGES[cid]
          if (awayMsgs) {
            await new Promise(r => setTimeout(r, 400))
            const awayMsg: Message = {
              id: `away${Date.now()}`,
              role: 'assistant',
              content: pick(awayMsgs),
              characterId: cid,
              isAway: true,
            }
            current = addMsg(current, awayMsg)
            setCharStatus(prev => ({ ...prev, [cid]: 'away' }))
            awayReturnAt.current[cid] = turn + 2
            break // one away per turn
          }
        }
      }
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, {
        id: `err${Date.now()}`,
        role: 'assistant',
        content: 'ごめんなさい、少し混んでいるみたい。もう一度話しかけてみて。',
        characterId: 'mama',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleTip = async (amount: number) => {
    // Save tip to DB (fire and forget)
    fetch('/api/tip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.current, nickname, amount }),
    }).catch(() => {/* silent */})

    const presentChars = CHAR_ORDER.filter(c => charStatus[c] === 'present') as CharacterType[]
    for (const cid of presentChars) {
      await new Promise(r => setTimeout(r, 300))
      const thankMsg: Message = {
        id: `tip${Date.now()}${cid}`,
        role: 'assistant',
        content: TIP_THANKS[cid],
        characterId: cid,
      }
      setMessages(prev => [...prev, thankMsg])
    }
  }

  const presentChars = CHAR_ORDER.filter(c => charStatus[c] === 'present') as CharacterType[]
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content)

  return (
    <div className="min-h-screen flex flex-col max-w-xl mx-auto relative" style={{ background: 'rgba(8,6,18,0.78)' }}>

      {/* ── Header ── */}
      <header className="px-4 py-3 border-b border-gray-900 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(8,6,18,0.85)' }}>
        <div>
          <h1 className="text-sm font-bold text-amber-500" style={{ fontFamily: 'Georgia, serif' }}>
            スナック メタバース UMAO
          </h1>
          <p className="text-[10px] text-gray-600 mt-0.5">
            ママのうまおと常連のお客さんがいます。話しかけてみてくださいね！
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTip(true)}
            className="text-xs text-amber-700 hover:text-amber-500 transition-colors border border-amber-900/50 rounded-lg px-2.5 py-1.5"
          >
            🪙 投げ銭
          </button>
          <button
            onClick={() => setShowExit(true)}
            className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors"
          >
            退店
          </button>
        </div>
      </header>

      {/* ── Character row ── */}
      <div className="px-4 py-3 flex gap-4 border-b border-gray-900 overflow-x-auto sticky top-[52px] z-10 backdrop-blur-md" style={{ background: 'rgba(8,6,18,0.85)' }}>
        {CHAR_ORDER.map(cid => {
          const c = CHARACTERS[cid]
          const status = charStatus[cid]
          const isPresent = status === 'present'
          const isAway = status === 'away'
          const isFocused = cid === focusedChar
          return (
            <button
              key={cid}
              onClick={() => handleFocusChar(cid)}
              className={`flex flex-col items-center gap-1 transition-all duration-500 flex-shrink-0 cursor-pointer active:scale-95 ${
                isPresent ? 'opacity-100' : isAway ? 'opacity-40' : 'opacity-20'
              }`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all relative"
                style={{
                  border: isFocused
                    ? `2.5px solid ${c.color}`
                    : `2px solid ${isPresent ? c.color + '80' : '#2a2a3a'}`,
                  backgroundColor: isFocused ? c.bgColor : isPresent ? c.bgColor + '60' : 'transparent',
                  boxShadow: isFocused ? `0 0 8px ${c.color}55` : 'none',
                }}
              >
                {c.emoji}
                {isAway && (
                  <span className="absolute -bottom-0.5 -right-0.5 text-[8px] bg-[#0d0d18] px-0.5 rounded text-gray-500">
                    外
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium" style={{ color: isFocused ? c.color : isPresent ? c.color + 'aa' : '#444' }}>
                {c.name}
              </span>
              {isFocused && (
                <span className="text-[8px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: c.color + '22', color: c.color }}>
                  話し中
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-4">
        {messages.map(msg => {
          const char = CHARACTERS[msg.characterId]

          // User bubble
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[78%]">
                  <p className="text-[10px] text-gray-600 text-right mb-1">{nickname}</p>
                  <div className="bg-[#1c1730] text-gray-200 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                    {renderWithMention(msg.content)}
                  </div>
                </div>
              </div>
            )
          }

          // Drink selection card
          if (msg.isDrinkSelection) {
            const chosen = DRINK_OPTIONS.find(d => d.id === selectedDrink)
            return (
              <div key={msg.id} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5 border-2"
                  style={{ borderColor: char.color, backgroundColor: char.bgColor }}
                >
                  {char.emoji}
                </div>
                <div className="max-w-[85%]">
                  <p className="text-[10px] mb-1 font-medium" style={{ color: char.color }}>{char.title}</p>
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-gray-300 border mb-2"
                    style={{ backgroundColor: char.bgColor, borderColor: `${char.color}22` }}
                  >
                    {msg.content}
                  </div>
                  {chosen ? (
                    <div className="border border-amber-900/40 rounded-xl px-4 py-2.5 bg-amber-950/10 flex items-center gap-2">
                      <span className="text-xl">{chosen.emoji}</span>
                      <p className="text-amber-300 text-xs font-medium">{chosen.name}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {DRINK_OPTIONS.map(d => (
                        <button
                          key={d.id}
                          onClick={() => handleDrinkSelect(d.id)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-800 bg-[#13111e] hover:border-amber-700/60 hover:bg-amber-950/10 transition-all active:scale-95 text-left"
                        >
                          <span className="text-lg">{d.emoji}</span>
                          <span className="text-xs text-gray-400 leading-tight">{d.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          }

          // Intro card
          if (msg.isIntro) {
            return (
              <div key={msg.id} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5 border-2"
                  style={{ borderColor: char.color, backgroundColor: char.bgColor }}
                >
                  {char.emoji}
                </div>
                <div className="max-w-[85%]">
                  <p className="text-[10px] mb-1 font-medium" style={{ color: char.color }}>{char.title}</p>
                  <div
                    className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-300 border mb-2"
                    style={{ backgroundColor: char.bgColor, borderColor: `${char.color}22` }}
                  >
                    {msg.content}
                  </div>
                  <div className="border border-gray-800 rounded-xl overflow-hidden">
                    {CHAR_ORDER.map((cid, i) => {
                      const c = CHARACTERS[cid]
                      return (
                        <div
                          key={cid}
                          className={`flex items-center gap-3 px-3 py-2.5 ${i !== CHAR_ORDER.length - 1 ? 'border-b border-gray-800' : ''}`}
                          style={{ backgroundColor: `${c.bgColor}` }}
                        >
                          <span className="text-xl flex-shrink-0">{c.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: c.color }}>{c.name}</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed">{c.intro}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          // Join announcement
          if (msg.isJoining) {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span
                  className="text-xs px-3 py-1 rounded-full bg-[#13111e] border"
                  style={{ color: char.color, borderColor: `${char.color}30` }}
                >
                  {char.name}：「{msg.content}」
                </span>
              </div>
            )
          }

          // Away / Return notice
          if (msg.isAway || msg.isReturn) {
            return (
              <div key={msg.id} className="flex justify-center py-0.5">
                <span className="text-[10px] px-3 py-1 rounded-full text-gray-600 bg-[#13111e]">
                  {char.name}「{msg.content}」
                </span>
              </div>
            )
          }

          // Normal assistant bubble
          return (
            <div key={msg.id} className="flex gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5 border-2"
                style={{ borderColor: char.color, backgroundColor: char.bgColor }}
              >
                {char.emoji}
              </div>
              <div className="max-w-[78%]">
                <p className="text-[10px] mb-1 font-medium" style={{ color: char.color }}>{char.title}</p>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-gray-200 border"
                  style={{ backgroundColor: char.bgColor, borderColor: `${char.color}22` }}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2"
              style={{ borderColor: CHARACTERS.mama.color, backgroundColor: CHARACTERS.mama.bgColor }}
            >
              🌹
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm border"
              style={{ backgroundColor: CHARACTERS.mama.bgColor, borderColor: `${CHARACTERS.mama.color}22` }}
            >
              <span className="text-gray-500 tracking-widest">···</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 pt-3 pb-2 border-t border-gray-900 sticky bottom-0 backdrop-blur-md" style={{ background: 'rgba(8,6,18,0.85)' }}>
        {/* Row 1: textarea + 話しかけるボタン */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            {mentionCandidates.length > 0 && (
              <div className="absolute bottom-full mb-1 left-0 bg-[#1a1030] border border-gray-800 rounded-xl overflow-hidden z-20 w-48">
                {mentionCandidates.map(({ name, cid }) => {
                  const c = CHARACTERS[cid]
                  return (
                    <button
                      key={cid}
                      onMouseDown={e => { e.preventDefault(); insertMention(name) }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#251d3a] text-left transition-colors"
                    >
                      <span>{c.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: c.color }}>@{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend() }
              }}
              placeholder="なんか言う… @名前 で指名もできます"
              rows={2}
              autoComplete="off"
              className="w-full bg-[#13111e] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-gray-700 resize-none leading-relaxed"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all bg-amber-700 hover:bg-amber-600 disabled:bg-[#13111e] disabled:text-gray-700 text-white flex-shrink-0"
            style={{ height: '62px' }}
          >
            話しかける
          </button>
        </div>
        {/* Row 2: 投げ銭・退店ボタン */}
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setShowTip(true)}
            className="flex-1 py-2 rounded-xl border border-amber-900/40 text-amber-700 hover:text-amber-500 hover:border-amber-700 transition-colors text-xs font-medium"
          >
            🪙 投げ銭する
          </button>
          <button
            onClick={() => setShowExit(true)}
            className="flex-1 py-2 rounded-xl border border-gray-800 text-gray-600 hover:text-gray-400 hover:border-gray-700 transition-colors text-xs font-medium"
          >
            退店する
          </button>
        </div>
        <p className="text-[10px] text-gray-800 mt-1.5 text-right">Shift+Enter で改行</p>
      </div>

      {/* ── Modals ── */}
      {showTip && (
        <TipModal
          activeChars={presentChars}
          onTip={async (amount) => { await handleTip(amount) }}
          onClose={() => setShowTip(false)}
        />
      )}
      {showExit && (
        <ExitModal
          presentChars={presentChars}
          userMessages={userMsgs}
          turnCount={turnRef.current}
          sessionId={sessionId.current}
          nickname={nickname}
          entryDrink={selectedDrink}
          onConfirm={() => router.push('/')}
          onCancel={() => setShowExit(false)}
        />
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ChatContent />
    </Suspense>
  )
}
