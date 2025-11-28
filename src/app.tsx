import React, { useState, useEffect, useRef, useMemo } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

// 告訴 TypeScript：這裡會有一個全域變數 cockpit（由 Cockpit 注入）
declare const cockpit: any;

// 匯入所需的 PatternFly 組件
import {
  PageSection,
  Title,
  Button,
  Card,
  CardBody,
  CardTitle,
  Divider,
} from "@patternfly/react-core";

// =========================================================================
// 1. Command Data and Styles
// =========================================================================

const commandInfo: Record<
  string,
  {
    template: string;
    text: string;
    detail: string | React.ReactNode;
    danger: "low" | "medium" | "high";
    category: string;
  }
> = {
  // 查詢/瀏覽 (Query) Category
  ls: {
    template: "ls -l",
    text: "ls：列出目錄內容。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>列出目前目錄的檔案和資料夾</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -l</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>長格式顯示，包含權限、擁有者、大小、修改時間</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -a</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示所有檔案（包含隱藏檔，以 <code>.</code> 開頭）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -la</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>結合 <code>-l</code> 和 <code>-a</code>，長格式顯示所有檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -lh</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>長格式顯示，檔案大小以人類可讀格式（KB, MB, GB）顯示</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -R</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>遞迴顯示子目錄內容</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -t</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>依修改時間排序（最新的在前）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls -S</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>依檔案大小排序（大的在前）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>ls /path/to/dir</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>列出指定目錄的內容</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>範例：</strong><br/>
          • <code>ls -lah</code> - 顯示所有檔案（含隱藏檔），長格式，人類可讀大小<br/>
          • <code>ls -lt</code> - 依時間排序顯示檔案<br/>
          • <code>ls *.txt</code> - 只顯示 .txt 結尾的檔案
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  pwd: {
    template: "pwd",
    text: "pwd：顯示目前所在的工作目錄。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>pwd</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示目前工作目錄的完整路徑（絕對路徑）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>pwd -P</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示實際路徑（解析符號連結）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>pwd -L</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示邏輯路徑（保留符號連結，預設行為）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>說明：</strong><br/>
          • <code>pwd</code> 會輸出目前 shell 所在的完整路徑（absolute path），方便確認自己在檔案系統中的位置<br/>
          • 例如輸出：<code>/home/classuser</code> 或 <code>/var/www/html</code>
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  cat: {
    template: "cat /etc/os-release",
    text: "cat：將檔案內容直接輸出到終端機。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案內容</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat file1.txt file2.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>連接多個檔案並顯示</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat -n file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案內容並加上行號</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat -b file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案內容，只對非空行加上行號</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat &gt; newfile.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>建立新檔案（輸入內容後按 Ctrl+D 結束）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cat &gt;&gt; file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>將輸入內容追加到檔案末尾</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>常用範例：</strong><br/>
          • <code>cat /etc/os-release</code> - 查看系統版本資訊<br/>
          • <code>cat /etc/passwd</code> - 查看使用者帳號列表<br/>
          • <code>cat file1.txt file2.txt &gt; combined.txt</code> - 合併兩個檔案
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  find: {
    template: "find /home -name '*.txt'",
    text: "find：搜尋檔案或目錄。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find /path -name '*.txt'</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>搜尋指定目錄下所有 .txt 檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find . -type f</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>搜尋目前目錄下所有檔案（不含目錄）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find . -type d</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>搜尋目前目錄下所有目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find . -size +100M</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>搜尋大於 100MB 的檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find . -mtime -7</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>搜尋最近 7 天內修改的檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>find . -exec rm {} \;</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>對搜尋結果執行指令（危險！）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>常用範例：</strong><br/>
          • <code>find /home -name '*.txt'</code> - 在 /home 下尋找所有 .txt 檔案<br/>
          • <code>find . -name '*.log' -delete</code> - 刪除所有 .log 檔案（小心使用）
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  grep: {
    template: "grep 'error' /var/log/syslog",
    text: "grep：在檔案中搜尋特定文字。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep 'pattern' file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>在檔案中搜尋包含 pattern 的行</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep -i 'pattern' file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>忽略大小寫搜尋</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep -r 'pattern' /path</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>遞迴搜尋目錄下所有檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep -n 'pattern' file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示行號</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep -v 'pattern' file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示不包含 pattern 的行（反向搜尋）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>grep -E 'pattern1|pattern2' file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>使用正則表達式搜尋（擴展模式）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>常用範例：</strong><br/>
          • <code>grep 'error' /var/log/syslog</code> - 在系統日誌中搜尋 error<br/>
          • <code>grep -ri 'TODO' .</code> - 在目前目錄遞迴搜尋 TODO（忽略大小寫）
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  head: {
    template: "head -n 20 file.txt",
    text: "head：顯示檔案的前幾行。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>head file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案前 10 行（預設）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>head -n 20 file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案前 20 行</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>head -c 100 file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案前 100 個字元</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>head -q file1.txt file2.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示多個檔案的前 10 行（不顯示檔名）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>說明：</strong>常用來快速查看大型檔案的開頭內容，避免載入整個檔案。
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  tail: {
    template: "tail -f /var/log/syslog",
    text: "tail：顯示檔案的最後幾行。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>tail file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案最後 10 行（預設）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>tail -n 20 file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案最後 20 行</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>tail -f file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>持續監看檔案，顯示新增內容（常用於日誌）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>tail -F file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>類似 <code>-f</code>，但檔案被刪除重建後仍會繼續監看</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>tail -c 100 file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示檔案最後 100 個字元</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>常用範例：</strong><br/>
          • <code>tail -f /var/log/syslog</code> - 即時查看系統日誌<br/>
          • <code>tail -n 50 error.log</code> - 查看錯誤日誌的最後 50 行
        </p>
      </div>
    ),
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  // 檔案操作 (File Operations) Category
  cp: {
    template: "cp source.txt dest.txt",
    text: "cp：複製檔案或目錄。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp file.txt newfile.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>複製檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp -r dir1 dir2</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>遞迴複製目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp -i file.txt dest.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>覆蓋前先詢問</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp -u file.txt dest.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>只複製較新的檔案（更新模式）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp -p file.txt dest.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>保留原始檔案的屬性（權限、時間戳等）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>cp file1 file2 file3 /dest/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>複製多個檔案到目錄</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>注意：</strong>如果目標檔案已存在，預設會直接覆蓋，使用 <code>-i</code> 會先詢問確認。
        </p>
      </div>
    ),
    danger: "medium",
    category: "檔案操作 (File Operations)",
  },
  mv: {
    template: "mv old.txt new.txt",
    text: "mv：移動或重新命名檔案。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mv file.txt newname.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>重新命名檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mv file.txt /path/to/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>移動檔案到指定目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mv -i file.txt dest.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>覆蓋前先詢問確認</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mv file1 file2 file3 /dest/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>移動多個檔案到目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mv -v file.txt dest.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示詳細資訊（verbose）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>注意：</strong>如果目標檔案已存在，預設會直接覆蓋，使用 <code>-i</code> 會先詢問確認。
        </p>
      </div>
    ),
    danger: "medium",
    category: "檔案操作 (File Operations)",
  },
  mkdir: {
    template: "mkdir -p /path/to/directory",
    text: "mkdir：建立目錄。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mkdir dirname</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>建立單一目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mkdir -p /path/to/dir</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>自動建立所需的父目錄（如果不存在）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mkdir dir1 dir2 dir3</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>一次建立多個目錄</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mkdir -m 755 dirname</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>建立目錄並設定權限（755 = rwxr-xr-x）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>mkdir -v dirname</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>顯示詳細資訊</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>說明：</strong><code>-p</code> 選項非常實用，可以一次建立多層目錄結構，如果目錄已存在也不會報錯。
        </p>
      </div>
    ),
    danger: "low",
    category: "檔案操作 (File Operations)",
  },
  rmdir: {
    template: "rmdir empty_dir",
    text: "rmdir：刪除空目錄。",
    detail:
      "`rmdir` 只能刪除空的目錄，如果目錄內有檔案會失敗。要刪除非空目錄需要使用 `rm -r`。",
    danger: "medium",
    category: "檔案操作 (File Operations)",
  },
  touch: {
    template: "touch newfile.txt",
    text: "touch：建立空檔案或更新檔案時間戳記。",
    detail:
      "`touch` 如果檔案不存在會建立一個空檔案，如果檔案已存在則會更新其存取和修改時間。",
    danger: "low",
    category: "檔案操作 (File Operations)",
  },
  // 權限設定 (Permission) Category
  chmod: {
    template: "chmod 755 script.sh",
    text: "chmod：修改檔案或目錄的權限。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod 755 file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>設定權限：擁有者=rwx，群組=r-x，其他人=r-x</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod u+x file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>給擁有者加上執行權限</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod g-w file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>移除群組的寫入權限</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod o+r file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>給其他人加上讀取權限</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod -R 755 dir/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>遞迴設定目錄下所有檔案權限</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>chmod a+x file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>給所有人加上執行權限（a = all）</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
          <strong>權限說明：</strong><br/>
          • 數字模式：<code>7</code>=rwx（讀寫執行），<code>5</code>=r-x（讀執行），<code>4</code>=r--（只讀）<br/>
          • 字母模式：<code>u</code>=擁有者，<code>g</code>=群組，<code>o</code>=其他人，<code>a</code>=所有人<br/>
          • <code>755</code> 常用於可執行的 script 檔，讓其他人可以執行但不能修改
        </p>
      </div>
    ),
    danger: "medium",
    category: "權限設定 (Permission)",
  },
  chown: {
    template: "chown root:root /some/file",
    text: "chown：變更檔案的擁有者與群組。",
    detail:
      "`root:root` 的格式是 `使用者:群組`。這個指令會把 `/some/file` 的擁有者和群組都改成 root，一般用在系統檔案或需要特定帳號管理的檔案上，若設定錯誤可能造成權限問題。",
    danger: "medium",
    category: "權限設定 (Permission)",
  },
  umask: {
    template: "umask 022",
    text: "umask：設定預設檔案權限遮罩。",
    detail:
      "`umask` 用來設定新建立檔案和目錄的預設權限。`022` 表示其他人不能寫入，常用來提高安全性。",
    danger: "low",
    category: "權限設定 (Permission)",
  },
  // 系統操作 (System Control) Category
  rm: {
    template: "rm test.txt",
    text: "rm：刪除檔案。",
    detail: (
      <div>
        <p><strong>基本用法：</strong></p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "#666", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>指令</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #ddd", color: "#fff" }}>說明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>刪除檔案</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm -i file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>刪除前先詢問確認</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm -r dir/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>遞迴刪除目錄及其內容</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm -f file.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>強制刪除，不詢問（危險！）</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm -rf dir/</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd", color: "#c62828", fontWeight: "bold" }}>⚠️ 極度危險！強制遞迴刪除，無法復原</td>
            </tr>
            <tr>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}><code>rm *.txt</code></td>
              <td style={{ padding: "8px", border: "1px solid #ddd" }}>刪除所有 .txt 檔案</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#c62828", fontWeight: "bold" }}>
          <strong>⚠️ 警告：</strong><br/>
          • <code>rm</code> 不會將檔案送到資源回收桶，而是直接從檔案系統移除<br/>
          • <code>rm -rf</code> 是非常危險的組合，絕對不要對 <code>/</code> 或重要系統目錄使用<br/>
          • 建議使用 <code>-i</code> 選項，刪除前先確認
        </p>
      </div>
    ),
    danger: "high",
    category: "系統操作 (System Control)",
  },
  systemctl: {
    template: "systemctl restart nginx",
    text: "systemctl：在使用 systemd 的系統上管理服務。",
    detail:
      "`restart` 會先停止再重新啟動指定服務，這裡以 `nginx` 為例。這個指令常用於套用新的設定檔，但若對 sshd 之類的關鍵服務使用，可能導致遠端連線中斷，要特別小心。",
    danger: "high",
    category: "系統操作 (System Control)",
  },
  ps: {
    template: "ps aux",
    text: "ps：顯示目前執行的程序。",
    detail:
      "`ps aux` 會顯示所有使用者的所有程序，包含詳細資訊如 CPU、記憶體使用率。常用來查看系統資源使用情況。",
    danger: "low",
    category: "系統操作 (System Control)",
  },
  kill: {
    template: "kill -9 1234",
    text: "kill：終止執行中的程序。",
    detail:
      "`kill` 用來終止程序，`-9` 是強制終止訊號（SIGKILL），無法被程序忽略。使用前要確認程序 ID 正確，避免誤殺重要程序。",
    danger: "high",
    category: "系統操作 (System Control)",
  },
  top: {
    template: "top",
    text: "top：即時顯示系統程序和資源使用情況。",
    detail:
      "`top` 會即時更新顯示系統中最耗資源的程序，可以用來監控系統效能。按 `q` 離開，按 `k` 可以終止程序。",
    danger: "low",
    category: "系統操作 (System Control)",
  },
  // 網路操作 (Network) Category
  ping: {
    template: "ping -c 4 google.com",
    text: "ping：測試網路連線。",
    detail:
      "`ping` 用來測試與目標主機的網路連線是否正常。`-c 4` 表示只發送 4 個封包後停止，預設會持續執行直到手動中斷。",
    danger: "low",
    category: "網路操作 (Network)",
  },
  curl: {
    template: "curl https://example.com",
    text: "curl：從命令列下載或傳送資料。",
    detail:
      "`curl` 是一個強大的網路工具，可以下載檔案、測試 API、傳送 HTTP 請求等。常用選項包括 `-O`（儲存檔案）、`-L`（跟隨重新導向）。",
    danger: "low",
    category: "網路操作 (Network)",
  },
  wget: {
    template: "wget https://example.com/file.zip",
    text: "wget：從網路下載檔案。",
    detail:
      "`wget` 專門用來下載檔案，支援 HTTP、HTTPS、FTP 等協定。可以遞迴下載整個網站（`-r`），但要注意不要造成伺服器負擔。",
    danger: "low",
    category: "網路操作 (Network)",
  },
  netstat: {
    template: "netstat -tuln",
    text: "netstat：顯示網路連線狀態。",
    detail:
      "`netstat` 可以顯示網路連線、路由表、介面統計等資訊。`-tuln` 顯示 TCP/UDP 連線和監聽的埠號，常用來檢查服務是否正常運作。",
    danger: "low",
    category: "網路操作 (Network)",
  },
};
const dangerStyles = {
  low: {
    label: "低危險度",
    icon: "🟢",
    bg: "#d4edda",
    fg: "#155724",
    border: "#155724",
    desc: "查詢、瀏覽類指令，通常不會改變系統狀態。",
  },
  medium: {
    label: "中危險度",
    icon: "🟡",
    bg: "#fff3e0",
    fg: "#ef6c00",
    border: "#ef6c00",
    desc: "會修改權限或設定，可能影響少數檔案或服務。",
  },
  high: {
    label: "高危險度",
    icon: "🔴",
    bg: "#ffebee",
    fg: "#c62828",
    border: "#c62828",
    desc: "可能刪除資料或影響系統服務，使用前需特別小心。",
  },
};

// All command categories for the dropdown
const allCategories = [
  "全部",
  "查詢/瀏覽 (Query)",
  "檔案操作 (File Operations)",
  "權限設定 (Permission)",
  "系統操作 (System Control)",
  "網路操作 (Network)",
];

// =========================================================================
// 2. Custom Tooltip Component (for instant display)
// =========================================================================

const InstantTooltip: React.FC<{ text: string; children: React.ReactElement }> = ({ text, children }) => {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, maxWidth: 300 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 在tooltip显示后调整位置以避免超出边界
  useEffect(() => {
    if (show && wrapperRef.current && tooltipRef.current) {
      // 使用requestAnimationFrame确保DOM已更新
      requestAnimationFrame(() => {
        if (wrapperRef.current && tooltipRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          const padding = 10;
          
          let left = rect.left;
          let top = rect.bottom + 5;
          let maxWidth = 300;
          
          // 检查是否会超出右边界
          if (left + tooltipRect.width + padding > windowWidth) {
            // 如果超出，尝试向左移动
            left = Math.max(padding, windowWidth - tooltipRect.width - padding);
            // 如果还是超出，允许换行并调整宽度
            if (left + tooltipRect.width > windowWidth - padding) {
              left = padding;
              // 计算可用的最大宽度，确保不会超出边界
              maxWidth = Math.max(200, Math.min(300, windowWidth - padding * 2));
            }
          }
          
          // 检查是否会超出下边界
          if (top + tooltipRect.height > windowHeight - padding) {
            // 如果超出，显示在元素上方
            top = rect.top - tooltipRect.height - 5;
            if (top < padding) {
              top = padding;
            }
          }
          
          setPosition({
            top: top,
            left: left,
            maxWidth: maxWidth,
          });
        }
      });
    }
  }, [show, text]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      // 先设置初始位置
      setPosition({
        top: rect.bottom + 5,
        left: rect.left,
        maxWidth: 300,
      });
    }
    setShow(true);
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", display: "inline-block" }}
    >
      {children}
      {show && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: `${position.maxWidth}px`,
            width: position.maxWidth < 300 ? `${position.maxWidth}px` : undefined,
            minWidth: "100px",
            background: "#333",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: "4px",
            fontSize: "12px",
            zIndex: 10000,
            pointerEvents: "none",
            whiteSpace: "normal",
            wordWrap: "break-word",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            lineHeight: "1.4",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            boxSizing: "border-box",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. Main Teaching Terminal Component
// =========================================================================

const TeachingTerminal: React.FC = () => {
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [showInputTooltip, setShowInputTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const channelRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputTooltipRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<string>("");

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("全部");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Initialize xterm.js and cockpit channel
  useEffect(() => {
    if (!terminalRef.current) return;

    // Variables for tooltip tracking (declared in outer scope)
    let lastInputCheck = "";
    let positionUpdateInterval: any = null;
    let updateInputTooltip: (() => void) | null = null;

    // Create xterm instance with better styling and visible cursor
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block", // Make cursor more visible
      fontSize: 15,
      fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
      letterSpacing: 1,
      lineHeight: 1.3,
      disableStdin: false, // Enable input
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#00ff00", // Bright green cursor for visibility
        cursorAccent: "#1e1e1e",
        selection: "#264f78",
        selectionForeground: "#ffffff",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#ffffff",
      } as any,
      rows: 15,
      cols: 100,
      allowProposedApi: true, // Enable better color support
      convertEol: true, // Convert EOL to CRLF
      allowTransparency: false,
      logLevel: "off", // Disable logging
    } as any);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Fit terminal to container
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Get cockpit object
    const cockpitFromWindow = (window as any).cockpit;
    const cockpitObj =
      cockpitFromWindow ||
      (typeof cockpit !== "undefined" ? (cockpit as any) : undefined);

    if (cockpitObj && typeof cockpitObj.channel === "function") {
      // Create a PTY channel for interactive shell with color support
      const channel = cockpitObj.channel({
        payload: "stream",
        spawn: ["bash", "--login", "-i"], // Use interactive login shell to load .bashrc
        pty: true,
        environ: [
          "TERM=xterm-256color",
          "COLORTERM=truecolor",
          "FORCE_COLOR=1",
          "LS_COLORS=rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=30;41:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:",
        ],
      });

      channelRef.current = channel;

      // Receive data from shell and display in xterm
      channel.addEventListener("message", (_event: any, data: string) => {
        term.write(data);
      });

      channel.addEventListener("close", () => {
        term.write("\r\n[連線已關閉]\r\n");
      });

      // Function to update tooltip based on current input
      updateInputTooltip = () => {
        try {
          // Get current line from terminal buffer
          const buffer = term.buffer.active;
          const cursorY = buffer.cursorY;
          const line = buffer.getLine(cursorY);
          if (line) {
            const lineText = line.translateToString(true);
            const trimmed = lineText.trim();
            
            // Only update if input changed
            if (trimmed !== lastInputCheck) {
              lastInputCheck = trimmed;
              
              if (trimmed) {
                const firstWord = trimmed.split(/\s+/)[0];
                const info = commandInfo[firstWord];
                if (info) {
                  setCurrentInfo(info);
                  setShowInputTooltip(true);
                  currentLineRef.current = trimmed;
                  
                  // Calculate tooltip position - below the terminal
                  if (terminalRef.current) {
                    // Get terminal container dimensions (relative to CardBody)
                    const terminalHeight = terminalRef.current.offsetHeight;
                    // Position tooltip below the terminal (relative to CardBody)
                    setTooltipPosition({
                      top: terminalHeight + 8, // 8px below terminal
                      left: 0, // Aligned with terminal left edge
                    });
                  }
                } else {
                  setShowInputTooltip(false);
                  setCurrentInfo(null);
                }
              } else {
                setShowInputTooltip(false);
                setCurrentInfo(null);
              }
            } else if (trimmed && showInputTooltip) {
              // Tooltip is already showing, no need to update position (it's fixed below terminal)
              // Only update if terminal size might have changed (handled by resize handler)
            }
          }
        } catch (e) {
          // Ignore errors
        }
      };

      // Send user input to shell and track input
      term.onData((data: string) => {
        // Update tooltip first for non-enter keys
        if (data !== "\r" && data !== "\n") {
          // Check input after terminal updates
          if (updateInputTooltip) {
            setTimeout(updateInputTooltip, 50);
          }
        }
        
        // Always send data to channel (this executes the command on Enter)
        if (channel) {
          try {
            channel.send(data);
          } catch (e) {
            console.error("Error sending data to channel:", e);
          }
        }
        
        // Hide tooltip immediately when Enter is pressed
        if (data === "\r" || data === "\n") {
          // Enter pressed - hide tooltip immediately
          setShowInputTooltip(false);
          setCurrentInfo(null);
          lastInputCheck = "";
        }
      });

      // Also check on cursor movement
      term.onCursorMove(() => {
        if (updateInputTooltip) {
          setTimeout(updateInputTooltip, 50);
        }
      });

      // Handle terminal resize
      term.onResize(({ cols, rows }) => {
        if (channel) {
          channel.control({ window: { rows, cols } });
        }
        // Update tooltip position when terminal resizes (if tooltip is showing)
        setTimeout(() => {
          if (showInputTooltip && terminalRef.current) {
            const terminalHeight = terminalRef.current.offsetHeight;
            setTooltipPosition({
              top: terminalHeight + 8,
              left: 0,
            });
          }
        }, 100);
      });

      // Send initial size
      channel.control({ window: { rows: term.rows, cols: term.cols } });
      
      // No need for periodic position updates since tooltip is fixed below terminal
      // Position will be updated when input changes or terminal resizes
    } else {
      term.write("指令提示終端機已就緒（Demo 模式）\r\n");
      term.write("請確認此頁面是從 Cockpit 介面中開啟。\r\n");
    }

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
      // Update tooltip position on resize
      if (updateInputTooltip) {
        setTimeout(updateInputTooltip, 100);
      }
    };
    window.addEventListener("resize", handleResize);
    
    // Also update tooltip position when terminal scrolls
    term.onScroll(() => {
      if (updateInputTooltip) {
        setTimeout(updateInputTooltip, 50);
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (channelRef.current) {
        channelRef.current.close();
      }
      if (positionUpdateInterval) {
        clearInterval(positionUpdateInterval);
      }
      term.dispose();
    };
  }, []);

  // Helper: Update info block based on command string
  const updateInfo = (cmd: string) => {
    const firstWord = cmd.split(/\s+/)[0];
    setCurrentInfo(commandInfo[firstWord] || null);
  };

  // Action: Select command from button - write to terminal (don't execute)
  const selectCommand = (template: string) => {
    updateInfo(template);
    // Write command to terminal but don't send Enter
    if (xtermRef.current && channelRef.current) {
      // Focus the terminal first
      if (terminalRef.current) {
        terminalRef.current.focus();
        // Also focus the xterm instance
        xtermRef.current.focus();
      }
      
      // Send Ctrl+U to clear current line, then write the command
      channelRef.current.send("\x15"); // Ctrl+U clears line in bash
      // Small delay to ensure line is cleared
      setTimeout(() => {
        if (channelRef.current && xtermRef.current) {
          channelRef.current.send(template);
          currentLineRef.current = template;
          setShowInputTooltip(true);
          
          // Force cursor to be visible
          xtermRef.current.focus();
          
          // Update tooltip position after command is written
          // The tooltip will be updated automatically by the onData handler
          // Just ensure the terminal is focused and cursor is visible
          setTimeout(() => {
            if (xtermRef.current) {
              xtermRef.current.focus();
            }
          }, 150);
        }
      }, 50);
    }
  };
  // Helper: Render danger label for inline display
  const renderDangerInline = (info: any) => {
    if (!info || !info.danger) {
      return null;
    }
    const dangerLevel = info.danger as "low" | "medium" | "high";
    const style = dangerStyles[dangerLevel] || dangerStyles.low;
    return (
      <span
        style={{
          background: style.bg,
          color: style.fg,
          border: `1px solid ${style.border}`,
          padding: "2px 10px",
          borderRadius: "999px",
          fontWeight: "bold",
          fontSize: "12px",
          marginRight: "10px",
        }}
      >
        {style.icon} {style.label}
      </span>
    );
  };

  // Helper: Render detailed explanation
  const renderExplanation = (info: any) => {
    if (!info)
      return (
        <div className="pf-u-mt-sm">
          <div>尚未選擇指令。請先點選上方常用指令按鈕或輸入指令。</div>
        </div>
      );

    return (
      <div>
        <div className="pf-u-mb-xs">
          <strong>指令範例：</strong>
          <code className="pf-u-background-color-black-100 pf-u-p-xs pf-u-border-radius">
            {info.template}
          </code>
        </div>
        {info.detail && (
          <div className="pf-u-font-size-sm pf-u-color-black-700 pf-u-mt-xs">
            {typeof info.detail === "string" ? (
              <div>{info.detail}</div>
            ) : (
              info.detail
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter commands based on selected category
  const filteredCommands = useMemo(() => {
    if (selectedCategory === "全部") {
      return Object.keys(commandInfo);
    }
    return Object.keys(commandInfo).filter(
      (cmd) => commandInfo[cmd].category === selectedCategory,
    );
  }, [selectedCategory]);

    // =========================================================================
  // 3. Render JSX (Layout Fixes)
  // =========================================================================

  return (
    <div style={{ minHeight: "100vh", overflowY: "auto" }}>
      {/* Title and Introduction */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-p-0 pf-u-pt-lg"
        style={{ maxWidth: "unset", width: "100%", paddingLeft: "32px" }}
      >
        <Title headingLevel="h2" size="xl" className="pf-u-mb-md">
          指令提示終端機
        </Title>
        <p>
          上半部是指令提示終端機視窗，下方可以透過按鈕選擇指令，並查看詳細說明和危險度提示。
        </p>
      </PageSection>

      {/* Terminal Card */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-p-0"
        style={{ maxWidth: "unset", width: "100%", paddingLeft: "32px", marginTop: "16px" }}
      >
        <Card className="pf-u-background-color-white" style={{ position: "relative", overflow: "visible" }}>
          <CardTitle className="pf-u-font-weight-bold">
            [ 互動式終端機 ] - 支援 sudo、nano、vim 等互動指令
          </CardTitle>
          <CardBody className="pf-u-p-md" style={{ position: "relative", overflow: "visible" }}>
            {/* xterm.js Terminal */}
            <div
              ref={terminalRef}
              tabIndex={0}
              style={{
                height: "300px",
                borderRadius: "4px",
                overflow: "hidden",
                position: "relative",
                outline: "none",
              }}
              onClick={() => {
                // Focus terminal when clicked
                if (xtermRef.current) {
                  xtermRef.current.focus();
                }
              }}
            />
            {/* Input Tooltip - shows below terminal */}
            {showInputTooltip && currentInfo && (
              <div
                ref={inputTooltipRef}
                style={{
                  position: "absolute",
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  background: "#2d2d2d",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                  border: `2px solid ${dangerStyles[currentInfo.danger as "low" | "medium" | "high"]?.border || "#4a9eff"}`,
                  maxWidth: "100%",
                  minWidth: "250px",
                  width: "100%",
                  wordWrap: "break-word",
                  lineHeight: "1.5",
                  pointerEvents: "none", // Don't block mouse events
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{dangerStyles[currentInfo.danger as "low" | "medium" | "high"]?.icon}</span>
                  <span>{dangerStyles[currentInfo.danger as "low" | "medium" | "high"]?.label}</span>
                  <span style={{ color: "#999" }}>|</span>
                  <span>{currentInfo.text}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#bbb", marginTop: "4px" }}>
                  小提示：你可以先看上方的「危險度」再決定要不要執行這個指令
                </div>
              </div>
            )}
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              💡 這是真正的互動式終端機，支援 Tab 補齊、上下鍵歷史紀錄、sudo、nano、vim 等所有指令。
              <br />
              💡 點擊下方指令按鈕會將指令填入終端機，按 Enter 才會執行。
            </p>
          </CardBody>
        </Card>
      </PageSection>

      {/* Common Commands Card */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-mt-lg pf-u-p-0"
        style={{ maxWidth: "unset", width: "100%", position: "relative", paddingLeft: "32px", marginTop: "16px" }}
      >
        <Card style={{ overflow: "visible" }}>
          <CardBody style={{ overflow: "visible" }}>
            {/* Command Buttons Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                position: "relative",
              }}
            >
              <Title headingLevel="h3" size="md" style={{ margin: 0 }}>
                    常用指令：
                  </Title>
              <div ref={dropdownRef} style={{ position: "relative", zIndex: 1001 }}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    border: "1px solid #4a9eff",
                    borderRadius: "4px",
                    padding: "6px 32px 6px 12px",
                    background: "#fff",
                    color: "#000",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    minWidth: "150px",
                    position: "relative",
                  }}
                      >
                        {selectedCategory}
                  <span
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#000",
                      pointerEvents: "none",
                    }}
                  >
                    ▼
                  </span>
                </div>
                {isDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: "4px",
                      background: "#2d2d2d",
                      border: "1px solid #4a9eff",
                      borderRadius: "4px",
                      zIndex: 1002,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      minWidth: "100%",
                    }}
                  >
                    {allCategories.map((category) => (
                      <div
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          color: "#fff",
                          cursor: "pointer",
                          borderBottom:
                            category !== allCategories[allCategories.length - 1]
                              ? "1px solid #444"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#3d3d3d";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span>{category}</span>
                        {selectedCategory === category && (
                          <span style={{ color: "#4a9eff" }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Button Display Area with Scroll */}
            <div
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                padding: "8px",
                border: "1px solid #d2d2d2",
                borderRadius: "4px",
              }}
            >
              {filteredCommands.map((cmd) => {
                const info = commandInfo[cmd];
                const style = dangerStyles[info.danger];
                const tooltipTitle = `${style.icon} ${style.label} | ${info.text} | 危險度描述: ${style.desc}`;

                return (
                  <InstantTooltip key={cmd} text={tooltipTitle}>
                  <Button
                    style={
                      info.danger === "low"
                        ? {
                            background: style.bg,
                            color: style.fg,
                            border: `1px solid ${style.border}`,
                            marginRight: "8px",
                            marginBottom: "8px",
                          }
                        : { marginRight: "8px", marginBottom: "8px" }
                    }
                    variant={
                      info.danger === "high"
                        ? "danger"
                        : info.danger === "medium"
                        ? "warning"
                          : "secondary"
                    }
                    onClick={() => selectCommand(info.template)}
                  >
                    {cmd}
                  </Button>
                  </InstantTooltip>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </PageSection>

      {/* Command Explanation Card */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-mt-lg pf-u-p-0"
        style={{ maxWidth: "unset", width: "100%", paddingLeft: "32px", marginTop: "16px", paddingBottom: "32px" }}
      >
        <Card>
          <CardBody>
            {/* Detailed Explanation Block */}
            <Title headingLevel="h3" size="md" className="pf-u-mb-md">
              指令說明：
            </Title>

            {/* Inline Danger Status */}
            <div className="pf-u-mb-md">
              <span className="pf-u-font-weight-bold pf-u-mr-md">
                危險度：
              </span>
              {renderDangerInline(currentInfo)}
              <span className="pf-u-font-size-sm pf-u-color-black-600">
                {currentInfo
                  ? dangerStyles[currentInfo.danger as "low" | "medium" | "high"]?.desc
                  : "尚未選擇指令，請先輸入指令或點選按鈕。"}
              </span>
            </div>

            <Title headingLevel="h4" size="md" className="pf-u-mb-sm">
              詳細說明：
            </Title>
            {renderExplanation(currentInfo)}
          </CardBody>
        </Card>
      </PageSection>
    </div>
  );
};

export const Application = TeachingTerminal;
export default TeachingTerminal;


