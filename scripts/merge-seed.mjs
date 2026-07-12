/**
 * W2 種子資料合併腳本：
 * scripts/source/out-*.json（agents 產出）+ 既有手工精選資料 → src/data/*.json
 * 手工精選（含例句）優先於批次翻譯；id 衝突時以 reading 消歧。
 * 用法：node scripts/merge-seed.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const src = (p) => path.join(root, 'scripts', 'source', p)
const data = (p) => path.join(root, 'src', 'data', p)

const read = (p) => JSON.parse(readFileSync(p, 'utf8'))

function mergeDeck({ finalPath, curated, parts, requiredFields }) {
  const byId = new Map()
  let dropped = 0

  // 批次資料先進，手工精選最後覆蓋
  for (const part of parts) {
    if (!existsSync(part)) {
      console.warn(`!! 缺少 ${path.basename(part)}，跳過`)
      continue
    }
    for (const item of read(part)) {
      if (!requiredFields.every((f) => typeof item[f] === 'string' && item[f].trim())) {
        dropped++
        continue
      }
      let id = item.id
      if (byId.has(id) && item.reading && byId.get(id).reading !== item.reading) {
        id = `${item.id}~${item.reading}` // 同字不同讀音
        item.id = id
      }
      byId.set(id, item)
    }
  }
  for (const item of curated) byId.set(item.id, item)

  const list = [...byId.values()]
  writeFileSync(finalPath, JSON.stringify(list, null, 1), 'utf8')
  console.log(`${path.basename(finalPath)}: ${list.length} 筆（過濾 ${dropped} 筆欄位不全）`)
  return list
}

const curatedVocab = read(data('n4-vocab.json'))
const curatedGrammar = read(data('n4-grammar.json'))
const curatedToeic = read(data('toeic-vocab.json'))

const vocab = mergeDeck({
  finalPath: data('n4-vocab.json'),
  curated: curatedVocab,
  parts: Array.from({ length: 10 }, (_, i) => src(`out-vocab-${i}.json`)),
  requiredFields: ['id', 'deck', 'front', 'reading', 'meaning'],
})

const grammar = mergeDeck({
  finalPath: data('n4-grammar.json'),
  curated: curatedGrammar,
  parts: ['a', 'b', 'c'].map((s) => src(`out-grammar-${s}.json`)),
  requiredFields: ['id', 'deck', 'front', 'meaning', 'example', 'exampleTrans'],
})

const toeic = mergeDeck({
  finalPath: data('toeic-vocab.json'),
  curated: curatedToeic,
  parts: [1, 2, 3].map((n) => src(`out-toeic-${n}.json`)),
  requiredFields: ['id', 'deck', 'front', 'meaning', 'example', 'exampleTrans'],
})

// 全域 id 唯一性檢查
const all = [...vocab, ...grammar, ...toeic]
const ids = new Set()
for (const item of all) {
  if (ids.has(item.id)) throw new Error(`重複 id: ${item.id}`)
  ids.add(item.id)
}
console.log(`總計 ${all.length} 筆，id 全域唯一 ✓`)
