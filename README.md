# DualPass 雙語備考

> **⚠️ 11 月起凍結新功能，只修 bug，全力備考。**（JLPT N4：2026-12-06）

DualPass 是一個雙語備考 PWA：同時衝刺 **多益金色證書（860+）** 與 **日檢 N4**。核心是「每天打開就知道要做什麼」——雙語儀表板、考試倒數、每日任務打卡、FSRS 間隔重複單字卡，以及 AI 生成的擬真練習題。

## 系統架構

* **前端**：React + TypeScript + Vite + Tailwind CSS v4，PWA（vite-plugin-pwa，可安裝、離線可用）
* **狀態**：zustand（localStorage 持久化）；SRS 演算法用 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
* **雲端**：Firebase Auth（Google 登入）+ Firestore（離線持久化 + 跨裝置同步）；未設定時自動降級為純本機模式
* **AI**：Google Gemini（經 Vercel serverless proxy，API key 不進前端）
* **部署**：Vercel（Hobby 免費層，GitHub 自動部署）

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型別檢查 + 產出 dist/
```

## 前置設定（雲端功能）

沒有以下設定 app 也能跑（本機模式），設定後才有雲端同步與 AI 出題：

1. **Firebase**（Spark 免費層）：建立專案 → 開啟 Google 登入與 Firestore → 把 Web App config 填入 `.env`（參考 `.env.example` 的 `VITE_FIREBASE_*`）
2. **Vercel**：連結本 GitHub repo 自動部署；`GEMINI_API_KEY` 設在 Vercel 環境變數
3. **Firestore Security Rules**：鎖定單一使用者 email（見開發計畫）

## 內容授權

* N4/N5 詞表參考 Jonathan Waller JLPT Resources（tanos.co.uk，CC-BY）
* 日文釋義參考 JMdict（EDRDG，CC-BY-SA 4.0）
* 所有練習題目皆由 AI 原創生成，**不使用任何 ETS / JLPT 官方真題**

## 版本

### v0.1.0（Phase 1 / W1）
* **Major**: 專案重啟為 DualPass（前身為 Lexibank，見下方歷史）。
* **Feature**: 雙語儀表板：EN/JA 一鍵切換、TOEIC 與 JLPT 雙倒數、每日任務（10 商務單字 + 5 N4 詞彙文型 + 1 閱讀）與 streak 打卡。
* **Feature**: FSRS 間隔重複單字卡（三鍵評分：不會/模糊/會），起始牌組：30 TOEIC 商務單字、30 N4 詞彙、15 N4 文法句型。
* **Feature**: PWA 可安裝、離線可用；Firebase 未設定時自動以本機模式運作。
* **Scaffold**: 刷題/錯題本/設定頁面殼，考試日期與每日新卡量可調。

---

## 前身：Lexibank（歷史紀錄）

Lexibank 是本 repo 的前身專案：以「私人銀行」為概念的英文短句學習資產管理工具（React + Gemini + Firebase，開發於 Google AI Studio，程式碼未同步至本 repo）。其片語筆記功能未來可能整合進 DualPass 的英文模組。

<details>
<summary>Lexibank 版本歷史</summary>

### v1.2.1
* **Patch**: 修復「New Entry」按鈕無法重置輸入狀態的問題。
* **Patch**: 為所有已儲存詞彙新增刪除按鈕，並加入防呆確認機制。
* **UI/UX**: 優化詞彙卡片詳細視圖，修正 Contextual Examples 突兀的白色懸停背景，並加入專屬的銀行紋理背景動畫。

### v1.2.0
* **Major**: 全新品牌識別 "Lexibank" 上線，導入私人銀行 (Private Banking) 設計語言。
* **Feature**: 新增首頁 (The Lobby) 與訪客模式，支援返回大廳。
* **Feature**: 實作擬真「存款單 (Deposit Slip)」與三階段「鑄造資產 (Minting)」動畫。
* **UI/UX**: 採用金融級視覺設計風格 (Slate & Amber)，並加入磨砂玻璃與金邊設計的專屬登入視窗。

### v1.1.0
* **Major**: 引入 Firebase 雲端同步功能 (Authentication & Firestore)。
* **Minor**: 支援 Google 帳號登入，實現跨裝置資料同步與用戶資料隔離。
* **Patch**: 將介面與 AI 生成提示詞全面繁體中文 (台灣) 化。
* **Patch**: 修復 Firebase API Key 讀取問題，加入環境變數防呆機制。

### v1.0.0
* **Major**: 核心邏輯建立 (React SPA + Gemini API)。
* **Minor**: 實作 AI 自動生成結構化筆記、預覽/編輯/確認流程。
* **Minor**: 實作列表瀏覽、即時搜尋、Markdown 匯出功能。
* **Minor**: 實作 Token 用量與預估費用追蹤。
* **Patch**: 使用 LocalStorage 進行本地端資料持久化。

</details>
