'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const CHIBATECH_DRINKS = [
  { id: 'yoreyore',    emoji: '🥃', name: 'よれよれハイボール',   sub: 'とにかく疲れ切ってる…！' },
  { id: 'shimijimi',   emoji: '🍶', name: 'しみじみ日本酒',       sub: 'こんな時はしみじみ…' },
  { id: 'yakekuso',    emoji: '🍸', name: 'やけくそカクテル',     sub: 'もうやけくそ！' },
  { id: 'otsukaresam', emoji: '🥂', name: 'おつかれシャンパン',   sub: '今日の自分を褒めたい' },
  { id: 'moyamoya',    emoji: '🍹', name: 'もやもやソーダ',       sub: 'なんとなくモヤっとしてる' },
  { id: 'tameiki',     emoji: '☕', name: 'ため息カフェラテ',      sub: 'ふぅ…って日なんだ' },
  { id: 'hitoyasumi',  emoji: '🍵', name: 'ひとやすみ茶',         sub: 'ちょっと立ち止まりたい' },
  { id: 'lemonade',    emoji: '🍋', name: 'なんとなくレモネード', sub: 'なんとなく来た' },
] as const

type DrinkId = typeof CHIBATECH_DRINKS[number]['id']

export default function ChibatechPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [entering, setEntering] = useState(false)

  const canEnter = nickname.trim().length > 0

  const handleEnter = () => {
    if (!canEnter || entering) return
    setEntering(true)
    setTimeout(() => {
      router.push(
        `/chat?nickname=${encodeURIComponent(nickname.trim())}&mood=unsure&event=chibatech`
      )
    }, 900)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'rgba(8,6,18,0.95)' }}>
      {entering && (
        <div className="fixed inset-0 bg-[#0d0d18] z-50 flex items-center justify-center">
          <p className="text-amber-400 text-base font-light tracking-[0.4em] animate-pulse">
            いらっしゃい…
          </p>
        </div>
      )}

      <div className="w-full max-w-xs flex flex-col items-center gap-6">

        {/* ヘッダー */}
        <div className="text-center">
          <div className="text-[10px] tracking-[0.4em] text-amber-600 mb-2 opacity-80">CHIBATECH SPECIAL</div>
          <Image
            src="/mama-icon.png"
            alt="うまお"
            width={72}
            height={72}
            className="rounded-full mx-auto mb-3"
            style={{ border: '2px solid #f9a8d4' }}
          />
          <h1
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.05em' }}
          >
            メタバース スナック
            <br />
            UMAO
          </h1>
          <p className="text-[11px] text-amber-700/80 tracking-widest">日帰り出張スナック CHIBATECH編</p>
        </div>

        <div className="text-[12px] text-gray-500 leading-relaxed tracking-wide text-center">
          <p>答えが欲しい日もある。<br />ただ聞いてほしい日もある。</p>
          <p className="mt-2">ここは、AIのママと常連たちが集うカウンター。</p>
          <p className="mt-2">雑談でも、人生相談でも、<br />なんとなく立ち寄るだけでも大丈夫。</p>
          <p className="mt-2">うまく話せなくても大丈夫。</p>
        </div>

        <div className="w-full border border-amber-900/40 rounded-lg px-4 py-3 text-left bg-amber-950/10">
          <div className="text-[10px] tracking-[0.3em] text-amber-600 opacity-80 mb-2">ママからひとこと</div>
          <p className="text-[13px] text-amber-200/75 leading-relaxed">「来てくれてありがとう。学生さんには🍓も用意してるわよ✨」</p>
        </div>

        <div className="w-full border-t border-gray-900" />

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

        <button
          onClick={handleEnter}
          disabled={!canEnter}
          className={`w-full py-3 rounded-lg text-sm font-light tracking-[0.2em] transition-all ${
            canEnter
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-[#13111e] text-gray-700 cursor-not-allowed'
          }`}
        >
          入 店 す る
        </button>


        <p className="text-[12px] text-gray-500 text-center leading-relaxed">
          チャージなし・セット料金なし<br />飲み物は自由（ノンアルOK）
        </p>
        <p className="text-[10px] text-gray-700 text-center">
          会話の内容は保存されません
        </p>
      </div>
    </main>
  )
}
