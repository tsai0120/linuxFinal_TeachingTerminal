# Cockpit 指令提示終端機插件

本專案基於 Cockpit Starter Kit（React + TypeScript + PatternFly）架構，實現了一個教學終端機插件，旨在提供一個安全的介面，讓使用者可以執行 Linux 指令，並查看該指令的危險度、詳細說明和範例。

## 📋 目錄

- [系統功能介紹](#系統功能介紹)
- [前端介紹與實作方法](#前端介紹與實作方法)
- [後端介紹](#後端介紹)
- [主要遇到的問題](#主要遇到的問題)
- [專案貢獻](#專案貢獻)
- [快速開始](#快速開始)
- [開發指南](#開發指南)

---

## 🎯 系統功能介紹

### 核心功能

1. **互動式終端機**
   - 使用 xterm.js 實現真正的互動式終端機體驗
   - 支援 `sudo`、`nano`、`vim` 等需要互動輸入的指令
   - 完整的 ANSI 顏色支援（16 色 + 256 色）
   - 可見的游標（綠色閃爍方塊）
   - 支援文字選取和複製

2. **指令提示系統**
   - **即時 Tooltip**：在終端機下方顯示當前輸入指令的說明
   - **危險度標示**：清楚標示指令的危險等級（低/中/高）
   - **詳細說明**：每個指令都有表格格式的詳細用法說明
   - **自動隱藏**：按 Enter 執行指令時自動隱藏 tooltip

3. **指令管理**
   - **分類瀏覽**：指令按功能分類（查詢/瀏覽、檔案操作、權限設定、系統操作、網路操作）
   - **下拉選單**：可快速切換不同分類
   - **常用指令按鈕**：點擊按鈕即可填入指令到終端機
   - **指令歷史**：支援上下鍵瀏覽歷史指令
   - **Tab 補齊**：支援指令自動補齊功能

4. **使用者體驗**
   - **響應式設計**：使用 PatternFly 組件，確保介面美觀且一致
   - **即時反饋**：滑鼠懸停即可查看指令說明
   - **自動聚焦**：點擊指令按鈕後自動聚焦終端機
   - **頁面滾動**：整個頁面支援滾動，確保所有內容都可見

### 指令分類

- **查詢/瀏覽 (Query)**：`ls`, `pwd`, `cat`, `find`, `grep`, `head`, `tail`
- **檔案操作 (File Operations)**：`cp`, `mv`, `mkdir`, `rmdir`, `touch`
- **權限設定 (Permission)**：`chmod`, `chown`, `umask`
- **系統操作 (System Control)**：`rm`, `systemctl`, `ps`, `kill`, `top`
- **網路操作 (Network)**：`ping`, `curl`, `wget`, `netstat`

---

## 💻 前端介紹與實作方法

### 技術棧

- **React 18.3.1**：現代化的 UI 框架
- **TypeScript 5.9.3**：型別安全的 JavaScript
- **PatternFly React 6.1.0**：企業級 UI 組件庫
- **xterm.js 5.5.0**：終端機模擬器
- **esbuild**：快速的 JavaScript 打包工具

### 核心組件架構

#### 1. 主要組件 (`src/app.tsx`)

```typescript
TeachingTerminal 組件
├── 狀態管理 (useState, useRef)
│   ├── 終端機狀態 (xterm.js 實例、channel 連線)
│   ├── UI 狀態 (tooltip、dropdown、選中的分類)
│   └── 指令歷史 (commandHistory, historyIndex)
├── 指令資料庫 (commandInfo)
│   ├── 指令模板 (template)
│   ├── 說明文字 (text)
│   ├── 詳細說明 (detail - 支援 React 節點)
│   ├── 危險度 (danger: low/medium/high)
│   └── 分類 (category)
└── UI 渲染
    ├── 終端機視窗 (xterm.js)
    ├── 指令按鈕卡片
    ├── 指令說明卡片
    └── Tooltip 提示視窗
```

#### 2. xterm.js 整合

**初始化流程：**

```typescript
// 1. 建立 xterm.js 實例
const term = new Terminal({
  cursorBlink: true,
  cursorStyle: "block",
  theme: { /* 16 色主題配置 */ }
});

// 2. 載入 FitAddon 以自動調整大小
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

// 3. 建立 Cockpit PTY channel
const channel = cockpit.channel({
  payload: "stream",
  spawn: ["bash", "--login", "-i"],
  pty: true,
  environ: ["TERM=xterm-256color", "COLORTERM=truecolor"]
});

// 4. 設定事件監聽器
term.onData((data) => {
  // 處理使用者輸入
  channel.send(data);
  // 按 Enter 時隱藏 tooltip
  if (data === "\r" || data === "\n") {
    setShowInputTooltip(false);
  }
});

channel.addEventListener("message", (event, data) => {
  // 將 shell 輸出寫入終端機
  term.write(data);
});
```

**關鍵實作細節：**

- **PTY 模式**：使用 `pty: true` 啟用偽終端，支援互動式指令
- **環境變數**：設定 `TERM=xterm-256color` 確保顏色支援
- **自動調整大小**：使用 `FitAddon` 自動適應容器大小
- **游標可見性**：透過 CSS 和主題設定確保游標清晰可見

#### 3. Tooltip 系統

**位置計算邏輯：**

```typescript
// 監聽終端機輸入變化
term.onData((data) => {
  if (data !== "\r" && data !== "\n") {
    // 延遲更新 tooltip（等待終端機更新）
    setTimeout(updateInputTooltip, 50);
  }
});

// 更新 tooltip 位置和內容
const updateInputTooltip = () => {
  const buffer = term.buffer.active;
  const line = buffer.getLine(buffer.cursorY);
  const trimmed = line.translateToString(true).trim();
  
  if (trimmed) {
    const firstWord = trimmed.split(/\s+/)[0];
    const info = commandInfo[firstWord];
    
    if (info) {
      // 計算位置：終端機下方
      const terminalHeight = terminalRef.current.offsetHeight;
      setTooltipPosition({
        top: terminalHeight + 8,
        left: 0
      });
      setShowInputTooltip(true);
    }
  }
};
```

**樣式設定：**

- `position: "absolute"`：相對於 CardBody 定位
- `zIndex: 1000`：確保顯示在最上層
- `pointerEvents: "none"`：不阻擋滑鼠事件
- 動態邊界檢測：防止 tooltip 超出視窗

#### 4. 指令分類系統

**實作方式：**

```typescript
// 使用 useMemo 優化過濾計算
const filteredCommands = useMemo(() => {
  if (selectedCategory === "全部") {
    return Object.keys(commandInfo);
  }
  return Object.keys(commandInfo).filter(
    (cmd) => commandInfo[cmd].category === selectedCategory
  );
}, [selectedCategory]);
```

#### 5. 指令歷史與 Tab 補齊

**歷史記錄：**

```typescript
const [commandHistory, setCommandHistory] = useState<string[]>([]);
const [historyIndex, setHistoryIndex] = useState<number>(-1);

// 處理上下鍵
term.onData((data) => {
  if (data === "\x1b[A") { // 上鍵
    // 顯示上一個指令
  } else if (data === "\x1b[B") { // 下鍵
    // 顯示下一個指令
  }
});
```

**Tab 補齊：**

```typescript
const handleTabCompletion = (input: string) => {
  const matches = Object.keys(commandInfo).filter(
    cmd => cmd.startsWith(input)
  );
  if (matches.length === 1) {
    return matches[0];
  }
  // 處理多個匹配的情況
};
```

### 樣式系統

**SCSS 檔案 (`src/app.scss`)：**

- **全域樣式**：確保頁面可滾動
- **xterm.js 樣式**：游標可見性、顏色主題、文字選取
- **響應式設計**：適應不同螢幕大小

---

## 🔧 後端介紹

### Cockpit 架構

本專案是一個 **Cockpit 插件**，後端主要依賴 Cockpit 框架提供的功能：

#### 1. Cockpit Channel API

**PTY Channel：**

```typescript
const channel = cockpit.channel({
  payload: "stream",
  spawn: ["bash", "--login", "-i"],
  pty: true,  // 啟用偽終端
  environ: [
    "TERM=xterm-256color",
    "COLORTERM=truecolor",
    "FORCE_COLOR=1"
  ]
});
```

**功能說明：**

- **payload: "stream"**：使用串流模式，即時傳輸資料
- **spawn**：指定要執行的 shell（bash login shell）
- **pty: true**：啟用偽終端，支援互動式指令（sudo、nano、vim）
- **environ**：設定環境變數，確保顏色和終端機類型正確

#### 2. 資料傳輸

**前端 → 後端：**

```typescript
// 發送使用者輸入到 shell
channel.send(data);
```

**後端 → 前端：**

```typescript
// 接收 shell 輸出
channel.addEventListener("message", (event, data) => {
  term.write(data);
});
```

#### 3. 視窗大小同步

```typescript
// 同步終端機視窗大小
term.onResize(({ cols, rows }) => {
  channel.control({ window: { rows, cols } });
});
```

### 安全性

- **使用者權限**：指令在當前使用者的權限下執行
- **Cockpit 認證**：依賴 Cockpit 的認證機制
- **無需額外後端**：所有邏輯都在前端，透過 Cockpit API 與系統互動

---

## 🐛 主要遇到的問題

### 1. 終端機互動性問題

**問題描述：**
- 初始版本使用 `cockpit.spawn` 無法執行 `sudo`、`nano` 等需要互動輸入的指令
- 終端機輸出出現 ANSI 轉義碼亂碼

**解決方案：**
- 改用 `cockpit.channel` 配合 `pty: true` 啟用偽終端
- 整合 xterm.js 來正確解析和顯示 ANSI 轉義碼
- 設定正確的環境變數（`TERM=xterm-256color`）

### 2. Tooltip 位置問題

**問題描述：**
- Tooltip 位置計算複雜，容易超出視窗邊界
- 使用 `fixed` 定位時會「往上飄」
- 頻繁的位置更新導致閃退

**解決方案：**
- 改為 `absolute` 定位，相對於 CardBody
- 簡化位置計算：固定顯示在終端機下方
- 移除定期位置更新，只在輸入改變時更新
- 按 Enter 時立即隱藏 tooltip

### 3. 顏色顯示問題

**問題描述：**
- 終端機輸出沒有顏色（黑白顯示）
- 即使設定 alias 也無法顯示顏色

**解決方案：**
- 設定完整的環境變數（`TERM`, `COLORTERM`, `FORCE_COLOR`）
- 使用 `bash --login -i` 載入使用者的 `.bashrc` 配置
- 在環境變數中預設 `LS_COLORS`
- 提示使用者使用 `--color=always` 而非 `--color=auto`

### 4. 游標可見性問題

**問題描述：**
- 終端機游標不可見
- 無法判斷輸入位置

**解決方案：**
- 設定 `cursorStyle: "block"` 和 `cursorBlink: true`
- 在 CSS 中強制設定游標樣式（`!important`）
- 設定明顯的游標顏色（綠色 `#00ff00`）

### 5. 文字選取問題

**問題描述：**
- 終端機內容無法選取和複製

**解決方案：**
- 在 CSS 中設定 `user-select: text`
- 確保 xterm.js 的選取功能啟用

### 6. 自動執行指令問題

**問題描述：**
- 終端機啟動時自動執行 alias 指令，造成混亂

**解決方案：**
- 移除自動執行 alias 的邏輯
- 讓使用者手動決定何時設定彩色輸出

### 7. Git 推送認證問題

**問題描述：**
- HTTPS 推送需要認證
- SSH 金鑰未設定

**解決方案：**
- 提供多種認證方式（Personal Access Token、SSG 金鑰）
- 建立 `PUSH_GUIDE.md` 說明文件

---

## 🤝 專案貢獻

### 開發歷程

本專案從簡單的指令執行介面，逐步演進為完整的互動式終端機教學系統：

1. **初期版本**：基本的指令按鈕和說明卡片
2. **分類系統**：加入下拉選單和指令分類
3. **Tooltip 系統**：即時顯示指令說明
4. **互動式終端機**：整合 xterm.js，支援完整終端機功能
5. **優化與修復**：解決位置、顏色、游標等問題

### 技術亮點

- **完整的終端機體驗**：使用 xterm.js 實現真正的互動式終端機
- **即時提示系統**：動態 tooltip 顯示指令說明
- **優雅的使用者體驗**：自動聚焦、歷史記錄、Tab 補齊
- **響應式設計**：使用 PatternFly 確保介面一致性

### 未來改進方向

- [ ] 支援更多指令和分類
- [ ] 加入指令執行歷史記錄（持久化）
- [ ] 支援自訂指令別名
- [ ] 加入指令執行結果的語法高亮
- [ ] 支援多個終端機分頁
- [ ] 加入終端機主題切換功能

### 貢獻者

- 專案開發與維護團隊

---

## 🚀 快速開始

### 前提條件

請確保您的系統已安裝以下工具：

- **Node.js (v18+)** 與 **npm**
- **git**
- **make**

### 安裝步驟

#### 1. 克隆專案

```bash
git clone https://github.com/tsai0120/linuxFinal_TeachingTerminal.git
cd linuxFinal_TeachingTerminal
```

#### 2. 安裝相依套件

```bash
npm install
```

#### 3. 編譯專案

**重要：** 在執行 `make` 之前，必須先將 `src/manifest.json` 複製到根目錄：

```bash
cp src/manifest.json ./
make
```

這會將 `src/` 中的 React/TypeScript 程式碼編譯成瀏覽器可讀的單一 JavaScript 檔案，並輸出到 `dist/` 目錄。

#### 4. 部署到 Cockpit

建立 Cockpit 插件目錄並建立符號連結：

```bash
mkdir -p ~/.local/share/cockpit
ln -s $(pwd)/dist ~/.local/share/cockpit/teach-terminal
```

#### 5. 重新啟動服務並測試

```bash
# 清除快取
sudo rm -rf /var/cache/cockpit/*

# 重新啟動 Cockpit 服務
sudo systemctl restart cockpit cockpit.socket
```

然後在瀏覽器中登入 Cockpit 介面，在左側選單中找到 **"指令提示終端機"** 項目。

---

## 💡 開發指南

### 新增指令

若要新增指令，請編輯 `src/app.tsx` 中的 `commandInfo` 物件：

```typescript
const commandInfo: Record<string, {
  template: string;
  text: string;
  detail: string | React.ReactNode;
  danger: "low" | "medium" | "high";
  category: string;
}> = {
  your_command: {
    template: "your_command --option",
    text: "your_command：指令說明。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ /* 表格樣式 */ }}>
          {/* 表格內容 */}
        </table>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
};
```

### 開發模式

使用 watch 模式可以自動重新編譯：

```bash
make watch
```

或使用 build.js：

```bash
./build.js -w
```

修改程式碼後，重新載入瀏覽器頁面即可看到變更。

### 程式碼檢查

執行 ESLint 檢查：

```bash
npm run eslint
```

自動修復可修復的問題：

```bash
npm run eslint:fix
```

---

## 🔧 故障排除

### 編譯失敗

如果編譯時出現 `Unterminated string literal` 錯誤，請檢查 `src/app.tsx` 中是否有未結束的字串。

### 插件未顯示

1. 確認已執行 `cp src/manifest.json ./` 再執行 `make`
2. 確認符號連結已正確建立
3. 清除 Cockpit 快取並重新啟動服務
4. 檢查瀏覽器控制台是否有錯誤訊息

### 指令執行失敗

- 確認 Cockpit 服務正常運行
- 檢查使用者權限
- 查看終端機視窗的錯誤訊息

### 終端機無顏色

- 確認環境變數已正確設定
- 嘗試手動執行 `alias ls='ls --color=always'`
- 檢查 `.bashrc` 是否有顏色相關設定

---

## 📝 注意事項

- **不要修改** `src/index.html` 和 `src/index.tsx`，這些是應用程式的啟動器
- **所有功能開發**請在 `src/app.tsx` 中進行
- **每次編譯前**記得執行 `cp src/manifest.json ./`
- `dist/` 目錄是編譯輸出，不需要提交到 git

---

## 📄 授權

本專案基於 Cockpit Starter Kit，遵循相同的授權條款（LGPL-2.1）。

---

## 📚 相關資源

- [Cockpit 官方文件](https://cockpit-project.org/guide/latest/)
- [PatternFly React 文件](https://www.patternfly.org/v4/)
- [xterm.js 文件](https://xtermjs.org/)
- [Cockpit Starter Kit](https://github.com/cockpit-project/starter-kit)

---

## 📞 聯絡方式

如有問題或建議，歡迎提交 Issue 或 Pull Request！
