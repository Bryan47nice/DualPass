/**
 * 版號與 Changelog 的單一事實來源（Single Source of Truth）。
 * 修改版本時請遵循 .claude/rules/versioning.md 的四步驟。
 */
export const APP_VERSION = '0.5.0'

export interface ChangelogEntry {
  version: string
  date: string // yyyy-MM-dd
  changes: string[]
}

/** 最新版本排最前面 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.5.0',
    date: '2026-07-12',
    changes: [
      'UI 全面翻新：介面圖示改為統一的線條風格（不再使用 emoji）',
      '日文改用日文字形渲染（漢字寫法正確），修正長文法標題的斷行',
      '點卡片即可翻面、主要按鈕改為模式色、新增翻卡過場動效',
      '發音按鈕與導覽列觸控範圍加大；打卡按鈕會提示還差幾項任務',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-07-12',
    changes: [
      '日文單字卡新增篩選：可分開複習「單字」與「文法」，並依 N5／N4 等級篩選',
      '每張日文卡標上 JLPT 等級（N5／N4）與類型徽章',
      '每個篩選組合各有獨立的每日新卡額度，單字與文法進度分開累積',
    ],
  },
  {
    version: '0.3.3',
    date: '2026-07-12',
    changes: [
      '日文單字卡正面直接顯示假名讀音，漢字不再不會念',
      '新增 🔊 發音按鈕：單字與例句都能用日文／英文語音朗讀',
      '登入失敗改顯示完整錯誤原因，方便排查',
    ],
  },
  {
    version: '0.3.2',
    date: '2026-07-12',
    changes: [
      '修正 Google 登入：手機／PWA 改用整頁跳轉（redirect），不再依賴會被擋的彈窗',
      '登入失敗時顯示明確錯誤原因（授權網域、彈窗被擋、未啟用等）',
    ],
  },
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
