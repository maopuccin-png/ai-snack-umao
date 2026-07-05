const Groq = require('groq-sdk')
const fs = require('fs')
const path = require('path')

// .env.local を読み込む
const envPath = path.join(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=')
    if (key && rest.length && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  })
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const DAYS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
const SEASONS = { 3: '春', 4: '春', 5: '春', 6: '夏', 7: '夏', 8: '夏', 9: '秋', 10: '秋', 11: '秋', 12: '冬', 1: '冬', 2: '冬' }

async function main() {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const day = DAYS[now.getDay()]
  const season = SEASONS[now.getMonth() + 1]
  const hour = now.getHours()
  const timeOfDay = hour < 12 ? '朝' : hour < 18 ? '昼' : '夜'

  console.log(`\n🍷 メタバース スナック UMAO — インスタ投稿生成中...\n`)

  const prompt = `あなたは「メタバース スナック UMAO」のママ、うまお（馬のキャラクター）です。
Instagramの「裏アカ」として、モヤッとした人にふと思い出してもらう投稿を作ります。

今日の情報：
- 日付：${dateStr}
- 曜日：${day}
- 季節：${season}
- 時間帯：${timeOfDay}

以下を生成してください。出力は必ずこのフォーマット通りに、各セクションをそのままの見出しで出力してください。

---

【テーマ】
（今日の曜日・季節・時間帯にあった、モヤッとした人の気持ちに寄り添うテーマを1行で）

【動画プロンプト（英語）】
（Kling / Pika などの動画生成AIに入力する英語プロンプト。スナックバーの雰囲気・暗い照明・ネオン・カウンター・ウィスキーグラス・ゆっくりとした動き・映画的な質感など。10〜15秒のリール向け。2〜3文で）

【字幕】
0〜3秒:（書く）
3〜7秒:（書く）
7〜10秒:（書く）

【投稿文】
（ママの裏アカらしい、素の語り口で。3〜5行。押しつけがましくなく、ふわっと寄り添う感じ。最後に「▷ メタバース スナック UMAO」と「モヤッとしたら、ふらっとおいで♡」を入れる）

【ハッシュタグ】
（15〜20個。#スナックUMAO #メタバーススナック を必ず含む。あとは今日のテーマに合ったもの）

---

UMAOの世界観：
- 馬のキャラクターのママが切り盛りするメタバース上のスナックバー
- モヤッとした人・疲れた人がふらっと来る場所
- 解決策を押しつけない。ただそこにいる、聞いてくれる
- 投稿のトーンは深夜のカウンターで一人でしみじみ語りかける感じ`

  const response = await groq.chat.completions.create({
    model: 'qwen-qwq-32b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
  })
  const content = response.choices[0].message.content

  // ターミナルに表示
  console.log('═'.repeat(60))
  console.log(`📸 今日のインスタ投稿 — ${dateStr} (${day})`)
  console.log('═'.repeat(60))
  console.log(content)
  console.log('═'.repeat(60))

  // ファイルに保存
  const outputDir = path.join(__dirname, '../output/instagram')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${dateStr}.md`)
  const fileContent = `# 📸 インスタ投稿 ${dateStr} (${day})\n\n${content}\n`
  fs.writeFileSync(outputPath, fileContent, 'utf-8')

  console.log(`\n✅ output/instagram/${dateStr}.md に保存しました\n`)
}

main().catch(err => {
  console.error('エラー:', err.message)
  process.exit(1)
})
