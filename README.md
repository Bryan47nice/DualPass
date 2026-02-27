# Lexibank

Lexibank 是一個以「私人銀行」為概念的英文短句學習資產管理工具。使用者輸入一句英文短句或慣用語後，系統透過 AI 自動生成結構化的完整學習筆記，經使用者預覽、編輯、確認後存入個人專屬金庫，並可隨時瀏覽、搜尋、匯出備份，讓語言能力產生複利效應。

## 系統架構
* **前端框架**: React (Vite + Tailwind CSS)
* **AI 引擎**: Google Gemini (gemini-3.1-pro-preview)
* **雲端服務**: Firebase (Authentication + Firestore)
* **本地儲存**: LocalStorage (未登入時的降級方案)

## 如何同步到 GitHub

由於 AI Studio 是沙盒環境，無法直接推送程式碼到您的私人 GitHub 倉庫。請依照以下步驟手動同步：

1. **下載程式碼**：點擊 AI Studio 介面右上角的「Export」或「Download」按鈕，將專案下載並解壓縮到您的電腦。
2. **建立倉庫**：在 GitHub 上建立一個全新的空倉庫 (Repository)。
3. **推送程式碼**：在解壓縮後的專案資料夾中，開啟終端機 (Terminal) 並執行以下指令：

```bash
# 初始化 Git
git init

# 加入所有檔案
git add .

# 提交第一次版本
git commit -m "Initial commit from Phrase Vault"

# 設定遠端倉庫 (請將網址換成您的 GitHub Repo 網址)
git remote add origin https://github.com/您的帳號/您的專案名稱.git

# 推送到 GitHub
git push -u origin main
```

以後若有修改，只需重複執行 `git add .`、`git commit` 和 `git push` 即可。


### v1.2.1 (Current)
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
