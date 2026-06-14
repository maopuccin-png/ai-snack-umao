'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOODS, MoodType } from '@/lib/characters'

function getDailyMamaMessage(): string {
  const now = new Date()
  const day = now.getDay()
  const month = now.getMonth() + 1

  const season =
    month >= 3 && month <= 5 ? 'spring' :
    month >= 6 && month <= 8 ? 'summer' :
    month >= 9 && month <= 11 ? 'autumn' : 'winter'

  const BY_DAY: Record<number, string[]> = {
    0: ['日曜日ね。今日はゆっくりできた？', '週末最後の夜、どんな気分かしら。', '日曜の夜って、ちょっとしんみりするわよね。'],
    1: ['月曜日ね。今週もよろしくね。', '月曜、お疲れさまね。一番きつい日よね。', '週の始まり、来てくれてよかった。'],
    2: ['火曜日か。もう少しで折り返しよ。', '今週まだ始まったばかりよ。焦らないでね。', '火曜の夜にふらっと来てくれたのね。'],
    3: ['水曜日ね。週の真ん中、お疲れさまね。', 'ここまで来たら、あとは下り坂よ。', '折り返し地点ね。よく頑張ってるわ。'],
    4: ['木曜日ね。あと一日、乗り越えられそう？', '週末がもうすぐよ。もう少しだけ。', '木曜の夜に来てくれたのね。うれしいわ。'],
    5: ['金曜日！よく頑張ったわね、今週も。', '花金ね。今日くらいゆっくりしていいのよ。', '週末が始まったわ。今日はどんな一週間だった？'],
    6: ['土曜日ね。今日はゆっくりできそう？', '週末よ。今日くらい自分のために使っていいのよ。', '土曜の夜、ふらっと来てくれたのね。'],
  }

  const BY_SEASON: Record<string, string[]> = {
    spring: ['春ね。なんか変わりそうな予感、ある？', '桜の季節ね。心もすこし揺れる季節よ。'],
    summer: ['夏ね。暑い中、よく来てくれたわ。', 'この暑さ、体は大丈夫？'],
    autumn: ['秋の夜長ね。ゆっくりしていって。', '秋ね。なんとなく感傷的になる季節よ。'],
    winter: ['冬ね。寒い中、来てくれてありがとう。', '冬の夜って長いわよね。温かくしてね。'],
  }

  const pool = [...(BY_DAY[day] ?? []), ...BY_SEASON[season]]
  const seed = now.getFullYear() * 10000 + month * 100 + now.getDate()
  return pool[seed % pool.length]
}

export default function EntryPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [mood, setMood] = useState<MoodType | null>(null)
  const [entering, setEntering] = useState(false)
  const [mamaMessage] = useState(() => getDailyMamaMessage())

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
