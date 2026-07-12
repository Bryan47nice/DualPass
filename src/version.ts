/**
 * 版號與 Changelog 的單一事實來源（Single Source of Truth）。
 * 修改版本時請遵循 .claude/rules/versioning.md 的四步驟。
 */
export const APP_VERSION = '0.3.1'

export interface ChangelogEntry {
  version: string
  date: string // yyyy-MM-dd
  changes: string[]
}

/** 最新版本排最前面 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.1',
    date: '2026-07-12',
    changes: [
      'N4 詞彙擴充 +169：自他動詞對、形容詞、名詞與外來語，全部附原創例句',
      '詞彙總量達 1,553 筆（教材總計 2,198 筆）',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-07-12',
    changes: [
      '雙人模式：Firestore 白名單，兩個帳號各自獨立進度、共用題庫',
      '安全規則改為每人僅能存取自己 users/{uid} 底下的資料',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-07-12',
    changes: [
      '種子教材庫上線：N4/N5 詞彙 1,384、N4 文法 90、TOEIC 商務單字 555',
      '詞表取自開源 JLPT 清單（CC-BY），釋義與例句在地化為繁體中文',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-07-12',
    changes: [
      'DualPass 首版：雙語儀表板（EN/JA 切換、雙考試倒數、每日任務打卡）',
      'FSRS 間隔重複單字卡（三鍵評分）',
      'PWA 可安裝、離線可用；Firebase Google 登入 + Firestore 雲端同步',
    ],
  },
]
