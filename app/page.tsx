'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOODS, MoodType } from '@/lib/characters'

const MAMA_MESSAGES = [
  'よく来てくれたわね。今夜はゆっくりしていってね。',
  '今日はどんな一日だったかしら？',
  '急がなくていいのよ。ここではゆっくりでいいから。',
  'カウンター、あなたの席が空いてるわよ。',
  'たまにはこういう場所で、ぼーっとするのもいいのよ。',
  'お疲れ様ね。今夜は何か話してみない？',
  '遠慮しないでね。ここはそういう場所だから。',
  'うまく言えなくても大丈夫よ。なんとなくでいいのよ。',
  '今夜は、どんな話を聞かせてくれるの？',
  'どんな気分でも、来てくれてよかったわ。',
  'いつでもいいのよ。ここはいつでも開いてるから。',
  'ちょっとだけ、話していかない？',
]

export default function EntryPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [mood, setMood] = useState<MoodType | null>(null)
  const [entering, setEntering] = useState(false)
  const [mamaMessage] = useState(() => MAMA_MESSAGES[Math.floor(Math.random() * MAMA_MESSAGES.length)])

  const canEnter = nickname.trim().length > 0 && mood !== null

  const handleEnter = () => {
    if (!canEnter || entering) return
    setEntering(true)
    setTimeout(() => {
      router.push(`/chat?nickname=${encodeURIComponent(nickname.trim())}&mood=${mood}`)
    }, 900)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgba(8,6,18,0.82)' }}>
      {entering && (
        <div className="fixed inset-0 bg-[#0d0d18] z-50 flex items-center justify-center">
          <p className="text-amber-400 text-base font-light tracking-[0.4em] animate-pulse">
            いらっしゃい…
          </p>
        </div>
      )}

      <div className="w-full max-w-xs flex flex-col items-center gap-7">
        {/* Sign */}
        <div className="text-center select-none">
          <div className="text-[10px] tracking-[0.4em] text-amber-600 mb-2 opacity-80">OPEN</div>
          <h1
            className="text-3xl font-bold text-white mb-6"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}
          >
            スナック メタバース
            <br />
            UMAO
          </h1>

          <div className="text-[13px] leading-[1.9] text-gray-400 tracking-wide text-left mb-6 space-y-4">
            <p>答えが欲しい日もある。<br />ただ聞いてほしい日もある。</p>
            <p>ここは、AIのママと常連たちが集うカウンター。</p>
            <p>雑談でも、人生相談でも、<br />なんとなく立ち寄るだけでも大丈夫。</p>
            <p>うまく話せなくても大丈夫。</p>
          </div>

          {/* ママからの一言 */}
          <div className="w-full mb-5 border border-amber-900/40 rounded-lg px-4 py-3 text-left bg-amber-950/10">
            <div className="text-[10px] tracking-[0.3em] text-amber-600 opacity-80 mb-2">
              本日のママからの一言
            </div>
            <p className="text-[13px] text-amber-200/75 leading-relaxed">
              「{mamaMessage}」
            </p>
          </div>

          <p className="text-[12px] text-gray-500 leading-relaxed tracking-wide">
            チャージなし・セット料金なし
            <br />
            飲み物は自由（ノンアルOK）
          </p>
        </div>

        <div className="w-full border-t border-gray-900" />

        {/* Nickname */}
        <div className="w-full">
          <label className="text-[11px] text-gray-500 tracking-wider block mb-2">
            お名前は？
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEnter()}
            placeholder="ニックネームでOK"
            maxLength={20}
            autoFocus
            className="w-full bg-[#13111e] border border-gray-800 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-700 focus:outline-none focus:border-amber-900 transition-colors"
          />
        </div>

        {/* Mood */}
        <div className="w-full">
          <label className="text-[11px] text-gray-500 tracking-wider block mb-3">
            今日はどんな感じ？
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(MOODS) as [MoodType, typeof MOODS[MoodType]][]).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setMood(key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  mood === key
                    ? 'border-amber-700 bg-amber-950/20 text-amber-300'
                    : 'border-gray-800 bg-[#13111e] text-gray-500 hover:border-gray-700 hover:text-gray-400'
                }`}
              >
                <div className="text-xs font-medium leading-snug">{m.label}</div>
                <div className="text-[10px] text-gray-700 mt-0.5">{m.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Enter */}
        <button
          onClick={handleEnter}
          disabled={!canEnter}
          className={`w-full py-3 rounded-lg text-sm font-medium tracking-[0.2em] transition-all ${
            canEnter
              ? 'bg-amber-700 hover:bg-amber-600 text-white cursor-pointer'
              : 'bg-[#13111e] text-gray-700 cursor-not-allowed'
          }`}
        >
          入 店 す る
        </button>

        <p className="text-[10px] text-gray-700 text-center">
          会話の内容は保存されません
        </p>
      </div>
    </main>
  )
}
