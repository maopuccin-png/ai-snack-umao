'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
  CHARACTERS, TRIGGERS, MOOD_OPENERS,
  CharacterType, MoodType,
} from '@/lib/characters'
import {
  AWAY_MESSAGES, RETURN_MESSAGES,
  FAREWELL, TIP_THANKS, GREETINGS, MAMA_CLOSING, MAMA_FAREWELL, getSummary,
} from '@/lib/mockResponses'

// ─── ドリンク選択肢 ───────────────────────────────────────────────────────
const DRINK_OPTIONS = [
  { id: 'yoreyore',    emoji: '🥃', name: 'よれよれハイボール',   sub: 'とにかく疲れ切ってる…！',   response: 'もう十分頑張ったじゃない。今夜はよれよれのままでいいのよ🥃' },
  { id: 'shimijimi',   emoji: '🍶', name: 'しみじみ日本酒',       sub: 'こんな時はしみじみ…',       response: 'しみじみする日もあるよね。ゆっくり飲みましょ🍶' },
  { id: 'yakekuso',    emoji: '🍸', name: 'やけくそカクテル',     sub: 'もうやけくそ！',             response: 'やけくそって言えるくらい、ちゃんと向き合ってたんじゃない🍸' },
  { id: 'otsukaresam', emoji: '🥂', name: 'おつかれシャンパン',   sub: '今日の自分を褒めたい',       response: '今日のあなた、よく頑張ったわね。まずは自分に乾杯しましょ🥂' },
  { id: 'moyamoya',    emoji: '🍹', name: 'もやもやソーダ',       sub: 'なんとなくモヤってる',       response: 'そっかあ。気になってることがある日なんだね。話せるところからでいいよ😊' },
  { id: 'tameiki',     emoji: '☕', name: 'ため息カフェラテ',      sub: 'ふぅ…って日なんだ',          response: 'うんうん、おつかれさま。ふぅ、ってしたあとちょっと、ゆるまるといいな。今日はゆっくりしていってね☕' },
  { id: 'hitoyasumi',  emoji: '🍵', name: 'ひとやすみ茶',         sub: 'ちょっと立ち止まりたい',     response: 'うんうん。たまには立ち止まる日も大事。ゆったりしていってね🍵' },
  { id: 'lemonade',    emoji: '🍋', name: 'なんとなくレモネード', sub: 'なんとなく来た',             response: 'ふふっ。そういう日もあるよね😊 席は空いてるから、のんびりしていってね。' },
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
function CharIcon({ char, size, className }: { char: { emoji: string; iconImage?: string; color: string; bgColor: string }; size: number; className?: string }) {
  if (char.iconImage) {
    return (
      <Image
        src={char.iconImage}
        alt=""
        width={size}
        height={size}
        className={`rounded-full flex-shrink-0 ${className ?? ''}`}
        style={{ border: `2px solid ${char.color}`, width: size, height: size, objectFit: 'cover' }}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 border-2 ${className ?? ''}`}
      style={{ width: size, height: size, fontSize: size * 0.5, borderColor: char.color, backgroundColor: char.bgColor }}
    >
      {char.emoji}
    </div>
  )
}

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

// ─── Farewell Step ────────────────────────────────────────────────────────
function FarewellStep({ farewellWord, onDone }: { farewellWord: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 8000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-4 w-16 h-16">
        <CharIcon char={CHARACTERS.mama} size={64} />
      </div>
      <p className="text-gray-200 text-sm leading-relaxed animate-pulse mb-5">
        「{farewellWord}」
      </p>
      <a
        href="https://www.instagram.com/ai_snack_umao"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 mx-auto w-fit px-4 py-2.5 rounded-xl border border-pink-800/50 bg-pink-950/20 text-pink-300 text-xs hover:border-pink-600 hover:bg-pink-950/40 transition-all"
      >
        <span>📸</span>
        <span>よかったら私のInstagramも<br />のぞいてみてね</span>
        <span className="text-pink-500">@ai_snack_umao</span>
      </a>
    </div>
  )
}

// ─── Chibatech Exit Modal ─────────────────────────────────────────────────
function ChibatechExitModal({
  sessionId,
  onConfirm,
  onCancel,
}: {
  sessionId: string
  onConfirm: () => void
  onCancel: () => void
}) {
  type Step = 'confirm' | 'student' | 'ichigo' | 'thanks' | 'farewell'
  const [step, setStep] = useState<Step>('confirm')
  const [recipient, setRecipient] = useState('')
  const [sending, setSending] = useState(false)

  const handleReceive = async () => {
    if (!recipient.trim()) return
    setSending(true)
    await fetch('/api/ichigo-recipient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, recipient: recipient.trim() }),
    }).catch(() => {})
    setSending(false)
    setStep('thanks')
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1030] border border-gray-800 rounded-2xl w-full max-w-sm p-6">

        {step === 'confirm' && (
          <>
            <h2 className="text-white font-bold mb-5">もう帰る？</h2>
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 py-3 border border-gray-800 text-gray-500 rounded-xl text-sm">もう少し話す</button>
              <button onClick={() => setStep('student')} className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">退店する</button>
            </div>
          </>
        )}

        {step === 'student' && (
          <>
            <div className="flex gap-3 items-start mb-5">
              <CharIcon char={CHARACTERS.mama} size={40} />
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: CHARACTERS.mama.color }}>{CHARACTERS.mama.title}</p>
                <p className="text-gray-200 text-sm leading-relaxed">今日は来てくれてありがとう。Web3 AI概論の受講生かしら？</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('ichigo')} className="flex-1 py-3 bg-pink-900/40 hover:bg-pink-900/60 border border-pink-800/50 text-pink-300 rounded-xl text-sm font-medium">はい</button>
              <button onClick={() => setStep('farewell')} className="flex-1 py-3 border border-gray-800 text-gray-500 rounded-xl text-sm">いいえ</button>
            </div>
          </>
        )}

        {step === 'ichigo' && (
          <>
            <div className="flex gap-3 items-start mb-4">
              <CharIcon char={CHARACTERS.mama} size={40} />
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: CHARACTERS.mama.color }}>{CHARACTERS.mama.title}</p>
                <p className="text-gray-200 text-sm leading-relaxed">来てくれたお礼に、ICHIGOを一杯おごるわね🍓よかったらDiscord IDかウォレットアドレスを教えて。</p>
              </div>
            </div>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="Discord ID またはウォレットアドレス"
              className="w-full bg-[#13111e] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-amber-900 mb-3"
            />
            <button
              onClick={handleReceive}
              disabled={!recipient.trim() || sending}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-[#13111e] disabled:text-gray-700 text-white rounded-xl text-sm font-medium mb-2"
            >
              {sending ? '送信中…' : '受け取る 🍓'}
            </button>
            <button onClick={() => setStep('farewell')} className="w-full text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
              気持ちだけで十分だよ
            </button>
          </>
        )}

        {step === 'thanks' && (
          <FarewellStep farewellWord="あとで🍓を送っておくわね。今日はありがとう！また来てね。" onDone={onConfirm} />
        )}

        {step === 'farewell' && (
          <FarewellStep farewellWord="ありがとうございました！よかったらまた来てね。" onDone={onConfirm} />
        )}

      </div>
    </div>
  )
}

// ─── Event Exit Modal ─────────────────────────────────────────────────────
function EventExitModal({
  presentChars,
  userMessages,
  sessionId,
  nickname,
  userId,
  mood,
  entryDrink,
  onConfirm,
  onCancel,
}: {
  presentChars: CharacterType[]
  userMessages: string[]
  sessionId: string
  nickname: string
  userId: string
  mood: string
  entryDrink: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  type Step = 'confirm' | 'survey' | 'survey2' | 'thanks' | 'farewell'
  const [step, setStep] = useState<Step>('confirm')
  const [rating, setRating] = useState<number | null>(null)
  const [courseGood, setCourseGood] = useState<number | null>(null)
  const [impression, setImpression] = useState('')
  const [closingWord] = useState(() => pick(MAMA_CLOSING))
  const [farewellWord] = useState(() => pick(MAMA_FAREWELL))
  const farewells = useRef(presentChars.map(cid => ({ cid, msg: pick(FAREWELL[cid]) })))

  const submitQ1 = (r: number) => { setRating(r); setStep('survey2') }

  const submitQ2 = () => {
    fetch('/api/event-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, nickname, rating, courseGood, impression: impression || null }),
    }).catch(() => {})
    setStep('thanks')
  }

  const goFarewell = () => {
    if (userId) {
      fetch('/api/session-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, topics: getSummary(userMessages), mood, entryDrink }),
      }).catch(() => {})
    }
    setStep('farewell')
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1030] border border-gray-800 rounded-2xl w-full max-w-sm p-6">

        {step === 'confirm' && (
          <>
            <h2 className="text-white font-bold mb-5">もう帰る？</h2>
            <div className="space-y-4 mb-6">
              {farewells.current.map(({ cid, msg }) => {
                const c = CHARACTERS[cid]
                return (
                  <div key={cid} className="flex gap-3 items-start">
                    <CharIcon char={c} size={32} />
                    <div>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: c.color }}>{c.title}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{msg}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={onCancel} className="flex-1 py-3 border border-gray-800 text-gray-500 rounded-xl text-sm">もう少し話す</button>
              <button onClick={() => setStep('survey')} className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">退店する</button>
            </div>
          </>
        )}

        {step === 'survey' && (
          <>
            <p className="text-white text-sm font-medium mb-1">今日はどうだった？</p>
            <p className="text-gray-600 text-[11px] mb-5">少し近いものを選んでね</p>
            <div className="space-y-2 mb-5">
              {([
                { label: 'うんうん、わかってもらえた', value: 5 },
                { label: 'わりと話せた', value: 4 },
                { label: 'まあまあかな', value: 3 },
                { label: 'ちょっと伝わらなかったかも', value: 2 },
                { label: '今日は噛み合わなかったなあ', value: 1 },
              ]).map(({ label, value }) => (
                <button key={value} onClick={() => submitQ1(value)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-gray-800 text-gray-400 text-sm hover:border-amber-700/60 hover:text-amber-300 hover:bg-amber-950/10 transition-all active:scale-[0.98]">
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('survey2')} className="w-full text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
              回答せずに進む
            </button>
          </>
        )}

        {step === 'survey2' && (
          <>
            <p className="text-white text-sm font-medium mb-5">Web3AI概論について聞かせて</p>
            <p className="text-gray-500 text-[11px] mb-2">受けてよかった？</p>
            <div className="space-y-2 mb-5">
              {([
                { label: '受けてよかった！', value: 5 },
                { label: 'だいたいよかった', value: 4 },
                { label: 'どちらとも言えない', value: 3 },
                { label: 'う〜ん、正直微妙', value: 2 },
                { label: 'ちょっと後悔かも', value: 1 },
              ]).map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setCourseGood(value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all active:scale-[0.98] ${
                    courseGood === value
                      ? 'border-amber-700/60 text-amber-300 bg-amber-950/10'
                      : 'border-gray-800 text-gray-400 hover:border-amber-700/60 hover:text-amber-300 hover:bg-amber-950/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-[11px] mb-2">一番印象に残ったことは？（任意）</p>
            <textarea
              value={impression}
              onChange={e => setImpression(e.target.value)}
              placeholder="なんとなくでいいよ。"
              rows={3}
              className="w-full bg-[#13111e] border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-gray-700 resize-none leading-relaxed mb-4"
            />
            <button onClick={submitQ2} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium mb-2">
              送る
            </button>
            <button onClick={() => setStep('thanks')} className="w-full text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
              回答せずに帰る
            </button>
          </>
        )}

        {step === 'thanks' && (
          <>
            <div className="flex gap-3 items-start mb-6">
              <CharIcon char={CHARACTERS.mama} size={40} />
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: CHARACTERS.mama.color }}>{CHARACTERS.mama.title}</p>
                <p className="text-gray-200 text-sm leading-relaxed">「{closingWord}」</p>
              </div>
            </div>
            <button onClick={goFarewell} className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium">
              帰る
            </button>
          </>
        )}

        {step === 'farewell' && <FarewellStep farewellWord={farewellWord} onDone={onConfirm} />}
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
  userId,
  mood,
  onConfirm,
  onCancel,
}: {
  presentChars: CharacterType[]
  userMessages: string[]
  turnCount: number
  sessionId: string
  nickname: string
  entryDrink: string | null
  userId: string
  mood: string
  onConfirm: () => void
  onCancel: () => void
}) {
  type Step = 'confirm' | 'survey' | 'survey2' | 'thanks' | 'farewell'
  const [step, setStep] = useState<Step>('confirm')
  const [rating, setRating] = useState<number | null>(null)
  const [closingWord] = useState(() => pick(MAMA_CLOSING))
  const [farewellWord] = useState(() => pick(MAMA_FAREWELL))
  const summary = getSummary(userMessages)
  const farewells = useRef(
    presentChars.map(cid => ({ cid, msg: pick(FAREWELL[cid]) }))
  )

  const submitQ1 = (r: number) => {
    setRating(r)
    setStep('survey2')
  }

  const submitQ2 = (revisit: number) => {
    fetch('/api/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, nickname, rating, revisit, entryDrink }),
    }).catch(() => {/* silent */})
    setStep('thanks')
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1a1030] border border-gray-800 rounded-2xl w-full max-w-sm p-6">

        {/* Step 1: 挨拶 + 退店確認 */}
        {step === 'confirm' && (
          <>
            <h2 className="text-white font-bold mb-5">もう帰る？</h2>
            <div className="space-y-4 mb-6">
              {farewells.current.map(({ cid, msg }) => {
                const c = CHARACTERS[cid]
                return (
                  <div key={cid} className="flex gap-3 items-start">
                    <CharIcon char={c} size={32} />
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
                { label: 'うんうん、わかってもらえた', value: 5 },
                { label: 'わりと話せた', value: 4 },
                { label: 'まあまあかな', value: 3 },
                { label: 'ちょっと伝わらなかったかも', value: 2 },
                { label: '今日は噛み合わなかったなあ', value: 1 },
              ]).map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => submitQ1(value)}
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

        {/* Step 2b: 再訪意向 */}
        {step === 'survey2' && (
          <>
            <p className="text-white text-sm font-medium mb-1">また気が向いたら、<br />ふらっと寄ってくれそう？</p>
            <p className="text-gray-600 text-[11px] mb-5">少し近いものを選んでね</p>
            <div className="space-y-2 mb-5">
              {([
                { label: 'うん、また来るね', value: 5 },
                { label: 'きっと来るね', value: 4 },
                { label: 'どちらとも言えない', value: 3 },
                { label: 'たぶん来ないかな', value: 2 },
                { label: '今日で満足かな', value: 1 },
              ]).map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => submitQ2(value)}
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
              <CharIcon char={CHARACTERS.mama} size={40} />
              <div>
                <p className="text-[10px] font-medium mb-1" style={{ color: CHARACTERS.mama.color }}>
                  {CHARACTERS.mama.title}
                </p>
                <p className="text-gray-200 text-sm leading-relaxed">「{closingWord}」</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (userId) {
                  fetch('/api/session-end', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId,
                      sessionId,
                      topics: getSummary(userMessages),
                      mood,
                      entryDrink,
                    }),
                  }).catch(() => {})
                }
                setStep('farewell')
              }}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-medium"
            >
              帰る
            </button>
          </>
        )}

        {/* Step 4: お見送り */}
        {step === 'farewell' && (
          <FarewellStep
            farewellWord={farewellWord}
            onDone={onConfirm}
          />
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
  const event = params.get('event')

  const sessionId = useRef(crypto.randomUUID())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef('')
  const prevContextRef = useRef<{ topics?: string; mood?: string; entry_drink?: string; created_at: string } | null>(null)

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
  const [showChibatechToast, setShowChibatechToast] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const userMsgCountRef = useRef(0)
  const toastShownRef = useRef(false)

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

  // Scroll to bottom on new messages (only after drink selection)
  useEffect(() => {
    if (selectedDrink !== null) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Load/generate persistent userId and fetch previous session context
  useEffect(() => {
    let uid = localStorage.getItem('umao_user_id')
    if (!uid) {
      uid = crypto.randomUUID()
      localStorage.setItem('umao_user_id', uid)
    }
    userIdRef.current = uid
    fetch(`/api/user-context?userId=${uid}`)
      .then(r => r.json())
      .then(data => { if (data.prevSession) prevContextRef.current = data.prevSession })
      .catch(() => {})
  }, [])

  // Opening sequence
  useEffect(() => {
    const openContent =
      event === 'web3ai' ? 'いらっしゃい〜。会いたかったわ！講義、おつかれさま。' :
      event === 'chibatech' ? 'いらっしゃい！🎉CHIBATECH盛り上がってるわね😊今日は来てくれてありがとう✨' :
      MOOD_OPENERS[mood]

    const openMsg: Message = {
      id: 'open',
      role: 'assistant',
      content: openContent,
      characterId: 'mama',
    }


    const drinkSelectionMsg: Message = {
      id: 'drink',
      role: 'assistant',
      content: event === 'chibatech' ? 'まずは今日の一杯、選んでみる？🥂' : 'まずは今日の一杯、選んでみる？',
      characterId: 'mama',
      isDrinkSelection: true,
    }
    const introMsg: Message = {
      id: 'intro',
      role: 'assistant',
      content: event === 'chibatech' ? '今、お店にいる常連さんを紹介するわね🍻' : '今夜のメンバーを紹介するわね。',
      characterId: 'mama',
      isIntro: true,
    }
    setMessages([openMsg, introMsg, drinkSelectionMsg])
  }, [mood, event])

  // ドリンク選択ハンドラ
  const handleDrinkSelect = (drinkId: DrinkId) => {
    setSelectedDrink(drinkId)
    fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.current, nickname, entryDrink: drinkId }),
    }).catch(() => {/* silent */})
    const option = DRINK_OPTIONS.find(d => d.id === drinkId)!
    const followMsg: Message = {
      id: 'follow',
      role: 'assistant',
      content: `${option.emoji} ${option.name}ね、お待たせしました！で、${event === 'web3ai' ? 'Web3 AI概論はどう？😊' : event === 'chibatech' ? '今日はどんな感じ？😊' : '今日はどうしたの？😊'}`,
      characterId: 'mama',
    }
    setMessages(prev => [
      ...prev,
      ...(event === 'web3ai' ? [] : [{
        id: `dr${Date.now()}`,
        role: 'assistant' as const,
        content: option.response,
        characterId: 'mama' as CharacterType,
      }]),
      followMsg,
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
        prevContext: characterId === 'mama' ? prevContextRef.current : undefined,
        event: event ?? undefined,
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

    if (event === 'chibatech' && !toastShownRef.current) {
      userMsgCountRef.current += 1
      if (userMsgCountRef.current >= 2) {
        toastShownRef.current = true
        setShowChibatechToast(true)
        requestAnimationFrame(() => setToastVisible(true))
        setTimeout(() => setToastVisible(false), 6000)
        setTimeout(() => setShowChibatechToast(false), 6300)
      }
    }

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

        let triggerChar: CharacterType | null = (turn >= 3 ? mamaRes.callNext : null) ?? null
        if (!triggerChar && turn >= 4 && absentSet.size > 0) {
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
            メタバース スナック UMAO
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
              <div className="relative transition-all" style={{ width: 40, height: 40 }}>
                {c.iconImage ? (
                  <Image
                    src={c.iconImage}
                    alt={c.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                    style={{
                      border: isFocused ? `2.5px solid ${c.color}` : `2px solid ${isPresent ? c.color + '80' : '#2a2a3a'}`,
                      boxShadow: isFocused ? `0 0 8px ${c.color}55` : 'none',
                      opacity: isPresent ? 1 : 0.3,
                    }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{
                      border: isFocused ? `2.5px solid ${c.color}` : `2px solid ${isPresent ? c.color + '80' : '#2a2a3a'}`,
                      backgroundColor: isFocused ? c.bgColor : isPresent ? c.bgColor + '60' : 'transparent',
                      boxShadow: isFocused ? `0 0 8px ${c.color}55` : 'none',
                    }}
                  >
                    {c.emoji}
                  </div>
                )}
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
                <CharIcon char={char} size={36} className="mt-0.5" />
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
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                      {DRINK_OPTIONS.map(d => (
                        <button
                          key={d.id}
                          onClick={() => handleDrinkSelect(d.id)}
                          className="flex flex-col items-start gap-1 px-3 py-3 rounded-xl border border-gray-800 bg-[#13111e] hover:border-amber-700/60 hover:bg-amber-950/10 transition-all active:scale-95 text-left"
                        >
                          <span className="text-2xl">{d.emoji}</span>
                          <span className="text-xs text-gray-300 font-medium leading-tight">{d.name}</span>
                          <span className="text-[11px] text-gray-500 leading-snug">{d.sub}</span>
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
                <CharIcon char={char} size={36} className="mt-0.5" />
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
                          <CharIcon char={c} size={28} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: c.color }}>{c.name}</p>
                            <p className="text-[10px] text-gray-400 leading-loose mt-0.5">{c.intro}</p>
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
              <CharIcon char={char} size={36} className="mt-0.5" />
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
            <CharIcon char={CHARACTERS.mama} size={36} />
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm border"
              style={{ backgroundColor: CHARACTERS.mama.bgColor, borderColor: `${CHARACTERS.mama.color}22` }}
            >
              <span className="text-gray-500 tracking-widest">···</span>
            </div>
          </div>
        )}
        {showChibatechToast && (
          <div
            style={{
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
              left: '50%',
              transform: `translateX(-50%) translateY(${toastVisible ? '0px' : '20px'})`,
              opacity: toastVisible ? 1 : 0,
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              zIndex: 100,
              maxWidth: '280px',
              width: 'calc(100% - 32px)',
            }}
            className="rounded-2xl border border-amber-700/30 bg-[#0d0d18]/75 backdrop-blur shadow-md px-4 py-3 text-center"
          >
            <p className="text-sm font-semibold text-amber-300">🎁 CHIBATECH本日限定✨</p>
            <p className="text-sm text-gray-200 leading-relaxed mt-2">
              Web3AI概論受講生の方は、<br />退店時に🍓のお手土産があります😊
            </p>
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
                      <CharIcon char={c} size={20} />
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
      {showExit && event === 'chibatech' ? (
        <ChibatechExitModal
          sessionId={sessionId.current}
          onConfirm={() => router.push('/chibatech')}
          onCancel={() => setShowExit(false)}
        />
      ) : showExit && event === 'web3ai' ? (
        <EventExitModal
          presentChars={presentChars}
          userMessages={userMsgs}
          sessionId={sessionId.current}
          nickname={nickname}
          userId={userIdRef.current}
          mood={mood}
          entryDrink={selectedDrink}
          onConfirm={() => router.push('/event')}
          onCancel={() => setShowExit(false)}
        />
      ) : showExit ? (
        <ExitModal
          presentChars={presentChars}
          userMessages={userMsgs}
          turnCount={turnRef.current}
          sessionId={sessionId.current}
          nickname={nickname}
          entryDrink={selectedDrink}
          userId={userIdRef.current}
          mood={mood}
          onConfirm={() => router.push('/')}
          onCancel={() => setShowExit(false)}
        />
      ) : null}
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
