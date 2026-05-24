import { CharacterType, MoodType } from './characters'

// ─── Mama (レイ) ──────────────────────────────────────────────────────────
const mamaGeneral = [
  'そう…何があったの？もう少し聞かせてくれる？',
  'うんうん。それで、今どんな気持ち？',
  'なるほどね。それって、ずっとひとりで抱えてたの？',
  'うまく言えなくてもいいのよ。ゆっくりでいいから。',
  'そっか…それはしんどかったわね。',
  'あら。それ、いつ頃からそう感じてるの？',
]

const mamaByKeyword: { words: string[]; responses: string[]; callNext?: CharacterType }[] = [
  {
    words: ['仕事', '職場', '上司', '転職', 'キャリア', '就活', '副業'],
    responses: [
      'そう…仕事のことって、なかなか人に言えないわよね。',
      'それは大変だったわね。職場ってほんと気疲れするもの。',
      'うーん、仕事のことはリュウさんも何か言えそうね。ちょっと待ってて。',
    ],
    callNext: 'realist',
  },
  {
    words: ['お金', '収入', '給料', '将来', '老後'],
    responses: [
      'お金のことって、頭でわかってても気持ちがついてかないわよね。',
      'そう…将来のこと考えると夜眠れなくなる時あるわよね。',
    ],
    callNext: 'realist',
  },
  {
    words: ['傷つ', '泣', '悲し', '寂し', 'つらい', '辛い', '怖い', '消えたい', '死にたい'],
    responses: [
      'そうよね、そういう気持ちになることあるわよ。泣きたい時は泣いていいのよ。',
      '傷ついてたのね。ちゃんと話してくれてありがとう。',
      'そっか…さくらちゃんも同じような時期があったから、ちょっと話してもらおうかしら。',
    ],
    callNext: 'accepter',
  },
  {
    words: ['自信', '責め', 'ダメ', 'できない', '無理', '後悔'],
    responses: [
      'あら、自分を責めすぎてない？そんなことないわよ。',
      'できないって思う時って、疲れてる時よね。',
    ],
    callNext: 'accepter',
  },
  {
    words: ['なんで', 'なぜ', 'どうして', 'ずっとこう', 'いつも', '繰り返', 'そもそも'],
    responses: [
      'なんでこうなるんだろうって、ぐるぐるしてる感じ？',
      'そのループ、ケンジさんが得意そうね。ちょっと来てもらうわ。',
    ],
    callNext: 'observer',
  },
  {
    words: ['恋愛', '好き', '別れ', '彼氏', '彼女', 'パートナー', '失恋'],
    responses: [
      'あら、恋愛のこと。それって今どんな状況なの？',
      '好きな人のことって、うまく言葉にならないわよね。',
    ],
  },
]

// ─── Realist (リュウ) ─────────────────────────────────────────────────────
const realistResponses = [
  'まあ聞いてよ。その状況、客観的に見るとかなり消耗する構造になってると思う。',
  'そりゃきついね。一個聞いていい？それって、いつ頃から続いてる？',
  '正直に言うとさ、そのパターン続けてたら、じわじわくるよ。',
  '長期で見ると、今が踏ん張りどころか、少し環境を変えるタイミングか、どっちかだと思う。',
  '問題は状況じゃなくて「選択肢がない」って感覚かもね。',
  'それ、もう少し具体的にどういう状態？数字とか、期限とか、あったりする？',
]

// ─── Accepter (さくら) ────────────────────────────────────────────────────
const accepterResponses = [
  'わかるよ…それ、すごくしんどいよね。',
  'それでいいんだよ。動けない時って、ちゃんと理由があるから。',
  '自分を責めなくていいよ。誰だってそうなること、あるから。',
  'ひとりで抱えてたんだね。それだけで十分えらいと思う。',
  '無理しなくていいよ。今はそれでいいんだよ、ほんとに。',
  'うん…うまくいかなくて当然だよ、そんな状況。',
]

// ─── Observer (ケンジ) ────────────────────────────────────────────────────
const observerResponses = [
  'その「なんでこうなるんだろう」って気持ち、どこに向いてると思う？',
  '少し別の見方をするとね…その状況って、誰のために続けてるんだろう。',
  'そのループ、何かを守ろうとしてる時に起きることが多い気がするけど、どうかな？',
  '不安には二種類ある気がする。現実的なものともう一つ。もう一つは何だと思う？',
  '結局、あなたが一番怖いのって何だろうね。',
  'どうなったら「少しマシ」になる気がする？',
]

// ─── 今日の一杯 ───────────────────────────────────────────────────────────
export const DRINKS: Record<MoodType, { name: string; emoji: string; description: string }> = {
  listen:   { name: 'ふわもやソーダ',          emoji: '🫧', description: 'ゆらゆら揺れながら、ただそこにいる。' },
  organize: { name: 'クリアミントウォーター',   emoji: '💧', description: '少しずつ、透きとおっていく感じ。' },
  advice:   { name: 'キレ柑橘トニック',         emoji: '🍋', description: 'ちょっと刺激があるくらいでちょうどいい。' },
  unsure:   { name: 'にごり林檎スパークリング', emoji: '🍏', description: 'まだかたちになってなくていい。' },
}

// ─── 席を外す ─────────────────────────────────────────────────────────────
export const AWAY_MESSAGES: Partial<Record<CharacterType, string[]>> = {
  realist:  ['ちょっとタバコ吸ってくる。', 'すまん、電話ちょっといい？', 'ちょっとトイレ。'],
  accepter: ['お手洗い行ってくるね。すぐ戻る！', 'あ、荷物取ってくる。'],
  observer: ['少し外の空気を吸ってきます。', 'コーヒー取ってきていいですか。'],
}

export const RETURN_MESSAGES: Partial<Record<CharacterType, string[]>> = {
  realist:  ['お待たせ。で、どうなった？', '戻ったよ。続き聞かせて。'],
  accepter: ['戻ってきた！どうしてた？', 'お待たせ〜。'],
  observer: ['戻りました。続きを聞かせてください。', 'すいません、戻りました。'],
}

// ─── 退店メッセージ ───────────────────────────────────────────────────────
export const FAREWELL: Record<CharacterType, string[]> = {
  mama:     ['また来てね。いつでも待ってるわよ。', '話してくれてありがとうね。少しでも楽になってたらいいけど。', '気をつけて帰るのよ。またいつでもいらっしゃい。'],
  realist:  ['まあ、今日のこと少し持って帰ってみてよ。', 'また来いよ。続き聞かせてくれ。', 'ゆっくり考えてみてな。'],
  accepter: ['また来てね。話してくれてよかった。', '無理しないでね。いつでも来て。', 'ひとりで抱えないでね。また来るね。'],
  observer: ['また話しましょう。続きが楽しみです。', '帰り道、少し考えてみてください。', '今日の話、面白かったです。またいつでも。'],
}

// ─── 投げ銭お礼 ──────────────────────────────────────────────────────────
export const TIP_THANKS: Record<CharacterType, string> = {
  mama:     'まあ！ありがとうね〜！またいつでも来てちょうだい！',
  realist:  'おっ、気前いいな。ありがとう。また来い。',
  accepter: 'わあ！ありがとう！すごくうれしい！',
  observer: 'これはありがたい。またゆっくり話しましょう。',
}

// ─── 会話まとめ ───────────────────────────────────────────────────────────
export function getSummary(userMessages: string[]): string {
  const text = userMessages.join(' ')
  const topics: string[] = []
  if (/仕事|職場|転職|上司|同僚/.test(text))       topics.push('仕事のこと')
  if (/恋愛|好き|別れ|彼氏|彼女|失恋/.test(text))  topics.push('恋愛のこと')
  if (/お金|収入|将来|老後|貯金/.test(text))        topics.push('将来のこと')
  if (/自信|責め|ダメ|できない|無理/.test(text))    topics.push('自分のこと')
  if (/孤独|寂し|ひとり/.test(text))               topics.push('孤独感')
  if (/人間関係|友達|家族/.test(text))              topics.push('人間関係')
  if (/キャリア|働き方/.test(text))                 topics.push('キャリアのこと')
  if (topics.length === 0) return 'いろんなことについて'
  return topics.slice(0, 2).join(' と ')
}

// ─── Selector ─────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getMockResponse(
  characterId: CharacterType,
  userMessage: string,
  turnCount: number,
): { message: string; callNext: CharacterType | null } {
  if (characterId !== 'mama') {
    const pool =
      characterId === 'realist'  ? realistResponses :
      characterId === 'accepter' ? accepterResponses :
                                   observerResponses
    return { message: pick(pool), callNext: null }
  }

  for (const entry of mamaByKeyword) {
    if (entry.words.some(w => userMessage.includes(w))) {
      const message = pick(entry.responses)
      const callNext = (turnCount >= 2 && entry.callNext) ? entry.callNext : null
      return { message, callNext }
    }
  }

  return { message: pick(mamaGeneral), callNext: null }
}

export const MOCK_MOOD_OPENERS: Record<MoodType, string> = {
  listen:   'いらっしゃい〜。今日はゆっくり話しに来た感じ？',
  organize: 'いらっしゃい。頭の中、ちょっとごちゃごちゃしてる感じ？',
  advice:   'いらっしゃい〜。今日はすっきりしたいのね。何があったの？',
  unsure:   'いらっしゃい。なんとなくモヤッてる感じ？うまく言えなくていいのよ。',
}
