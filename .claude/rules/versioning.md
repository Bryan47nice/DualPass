---
name: versioning-rules
description: DualPass 版號與 Changelog 更新規範
paths: src/version.ts, CHANGELOG.md, package.json
---

## Versioning Rules（版號迭代規則）

採用 Semantic Versioning（X.Y.Z）：

- **X（Major）**：核心邏輯或架構大變更（例：從本機轉 Firebase 雲端、UI 框架翻新、資料模型不相容變動）
- **Y（Minor）**：新增模組或大批內容（例：新增 AI 刷題、番茄鐘、週報雷達圖；大量新增教材）
- **Z（Patch）**：細微調整（例：修 bug、優化現有行為、文字修正、小批內容補充）

## Changelog 同步規則（強制）

**每次修改 `APP_VERSION` 時，必須同步四個地方，缺一不可：**

1. **`src/version.ts`**：更新 `APP_VERSION` 常數，並在 `CHANGELOG` 陣列**最頂端**新增一筆（version / date / changes[]）。這是版本資訊的單一事實來源，App 內的更新紀錄 modal 直接讀它。
2. **`CHANGELOG.md`**：在最頂端新增對應區塊，內容與 `src/version.ts` 一致。
3. **`package.json`**：`version` 欄位改為新版號。
4. **`README.md`**：更新「版本」章節（與上面一致即可，可只保留近幾版）。

## 附註

- 日期用 `yyyy-MM-dd`，以當日實際日期為準（見 currentDate）。
- App 內 modal 的「最新」badge 永遠掛在 `CHANGELOG[0]`（陣列第一筆），不需手動移除舊 badge——渲染時由 index 決定。
- 部署後版號會隨 bundle 出貨，使用者在「設定 → 版本」即可看到更新紀錄。
