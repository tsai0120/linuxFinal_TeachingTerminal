# Cockpit 教學終端機插件開發指南

本專案基於 Cockpit Starter Kit（React + Webpack + PatternFly）架構，實現了一個教學終端機插件，旨在提供一個安全的介面，讓使用者可以執行 Linux 指令，並查看該指令的危險度、詳細說明和範例。

## 專案結構與核心檔案

我們在 Cockpit Starter Kit 的基礎上進行開發。核心邏輯集中在 `src/app.tsx`。

| 檔案 | 角色與用途 |
| :--- | :--- |
| `src/app.tsx` | **應用程式核心。** 包含所有 React 組件、狀態管理、指令資料庫、PatternFly 佈局和 `cockpit.spawn` 執行邏輯。 |
| `src/index.html` | **HTML 骨架。** 負責載入 `cockpit.js`、`cockpit.css` 和編譯後的 `index.js`。**不應修改。** |
| `src/index.tsx` | **React 啟動器。** 將 `<Application />` 組件注入 HTML 容器。**不應修改。** |
| `manifest.json` | **Cockpit 定義檔。** 告訴 Cockpit 該插件的 ID、名稱和入口點。**請確保根目錄和 `src/` 目錄中都有此檔案，以應對編譯腳本的怪異行為。** |

-----

## 🚀 執行與部署步驟

### 前提條件

請確保您的 VM 或開發環境已安裝以下工具：

1.  **Node.js (v18+) 與 npm**
2.  **git**
3.  **make**

### 步驟一：環境準備與套件安裝

1.  **克隆專案並進入目錄：**

    ```bash
    git clone [您的專案連結]
    cd [您的專案名稱]
    ```

2.  **安裝 Node.js 相依套件：**

    ```bash
    npm install
    ```

### 步驟二：解決編譯相依性問題 (關鍵步驟)

本 Starter Kit 的 `make` 腳本對 `manifest.json` 的路徑處理有 bug，必須在每次 `make` 之前手動複製檔案。

```bash
# 確保每次執行 make 之前，將 manifest.json 複製到專案根目錄
cp src/manifest.json ./
```

### 步驟三：編譯專案

執行 `make` 指令，將 `src/` 中的 React/TypeScript 程式碼編譯成瀏覽器可讀的單一 JavaScript 檔案，並輸出到 `dist/` 目錄。

```bash
make
````

**注意：** 如果編譯失敗，請先檢查步驟二是否執行，並確認錯誤訊息是否為 `Unterminated string literal`（表示 `app.tsx` 檔案有未結束的字串）。

### 步驟四：部署到 Cockpit

將編譯好的 `dist` 目錄連結到 Cockpit 插件的標準目錄。

1.  **建立 Cockpit 插件目錄**（如果尚未建立）：

    ```bash
    mkdir -p ~/.local/share/cockpit
    ```

2.  **建立 Symlink (軟連結)：**

    ```bash
    ln -s $(pwd)/dist ~/.local/share/cockpit/teach-terminal
    ```

### 步驟五：重新啟動服務並測試

1.  **清除快取並重新啟動 Cockpit 服務：**

    ```bash
    sudo rm -rf /var/cache/cockpit/*
    sudo systemctl restart cockpit cockpit.socket
    ```

2.  **開啟瀏覽器：** 登入 Cockpit 介面，找到左側的 **"Starter Kit"** 或 **"教學終端機"** 項目。

-----

## 💡 核心功能與開發提示

### 1\. 介面與樣式

  * **完全基於 PatternFly：** 插件使用 PatternFly 組件（`Card`, `Toolbar`, `Button`）和 CSS 類別，確保與 Cockpit 介面風格一致。
  * **佈局修正：** 通過在 `PageSection` 上使用 `isWidthLimited={false}` 和 CSS 優先級覆蓋 (`style={{ maxWidth: "unset", width: "100%" }}`)，解決了畫面偏右，內容無法貼齊左側目錄欄的問題。
  * **指令按鈕：**
      * 低危險度按鈕已強制顯示綠色背景。
      * **Tooltip 提示：** 滑鼠懸停在按鈕上方時，會顯示該指令的危險度、簡述和描述（取代了下方獨立的危險度區塊）。

### 2\. 指令執行邏輯

  * **按鈕行為：** 點擊常用指令按鈕 **只會** 將指令填入輸入框。使用者必須手動點擊「執行」按鈕或按下 `Enter` 才會執行。
  * **真實執行：** 程式碼使用 `cockpit.spawn(["bash", "-lc", finalCmd], ...)` 來確保指令在 VM 中真實執行，並將輸出串流到終端機視窗，不再是 Demo 模式。

### 3\. 整合開發

  * **新增指令：** 若需新增指令，請直接修改 `commandInfo` 物件中的資料結構，並設定正確的 `category`。
  * **避免修改 `index.html` / `index.tsx`：** 這些檔案是應用程式的啟動器和骨架，不應包含功能邏輯。所有新功能請在 **`src/app.tsx`** 內開發。

<!-- end list -->

```
```
