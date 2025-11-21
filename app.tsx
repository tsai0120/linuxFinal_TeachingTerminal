import React, { useState, useEffect, useRef, useMemo } from "react";

// 告訴 TypeScript：這裡會有一個全域變數 cockpit（由 Cockpit 注入）
declare const cockpit: any;

// 匯入所需的 PatternFly 組件
import {
  PageSection,
  Title,
  Button,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Card,
  CardBody,
  CardTitle,
  Dropdown,
  DropdownItem,
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
    detail: string;
    danger: "low" | "medium" | "high";
    category: string;
  }
> = {
  // Query/Browse Category
  ls: {
    template: "ls -l",
    text: "ls：列出目錄內容。",
    detail:
      "`ls -l` 會以「長格式」顯示檔案清單，包含權限、擁有者、檔案大小與最後修改時間；加上 `-a` 則會連同隱藏檔一起顯示。",
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  pwd: {
    template: "pwd",
    text: "pwd：顯示目前所在的工作目錄。",
    detail:
      "`pwd` 會輸出目前 shell 所在的完整路徑（absolute path），方便確認自己在檔案系統中的位置，例如 `/home/student`。",
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  cat: {
    template: "cat /etc/os-release",
    text: "cat：將檔案內容直接輸出到終端機。",
    detail:
      "`/etc` 是系統設定檔常用的目錄；`/etc/os-release` 是純文字檔，裡面記錄作業系統名稱、版本號、代號等資訊，所以 `cat /etc/os-release` 常用來確認目前主機的 Linux 發行版與版本。",
    danger: "low",
    category: "查詢/瀏覽 (Query)",
  },
  // Permission Category
  chmod: {
    template: "chmod 755 script.sh",
    text: "chmod：修改檔案或目錄的權限。",
    detail:
      "`755` 代表：擁有者(user)=7(讀寫執行 rwx)，群組(group)=5(讀執行 r-x)，其他人(others)=5(讀執行 r-x)。這種設定常用在可執行的 script 檔上，讓其他人可以執行但不能修改內容。請避免對系統關鍵檔案用 777。",
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
  // System Control Category
  rm: {
    template: "rm test.txt",
    text: "rm：刪除檔案。",
    detail:
      "`rm` 不會將檔案送到資源回收桶，而是直接從檔案系統移除；`-r` 會遞迴刪除目錄，`-f` 表示不詢問強制刪除。因此 `rm -rf` 是非常危險的組合，絕對不要對 `/` 或重要系統目錄使用。",
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
  "全部指令 (All)",
  "查詢/瀏覽 (Query)",
  "權限設定 (Permission)",
  "系統操作 (System Control)",
];

// =========================================================================
// 2. Main Teaching Terminal Component
// =========================================================================

const TeachingTerminal: React.FC = () => {
  const [output, setOutput] = useState(
    "教學終端機已就緒，試試看輸入指令或點下面的按鈕：\n",
  );
  const [commandLine, setCommandLine] = useState("");
  const [currentInfo, setCurrentInfo] = useState<any>(null);
  const outputBoxRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("全部指令 (All)");

  // Helper: Append output to terminal and autoscroll
  const appendOutput = (line: string) => {
    setOutput((prevOutput) => prevOutput + line.replace(/\r/g, "") + "\n");
  };

  useEffect(() => {
    if (outputBoxRef.current) {
      outputBoxRef.current.scrollTop = outputBoxRef.current.scrollHeight;
    }
  }, [output]);

  // Helper: Update info block based on command string
  const updateInfo = (cmd: string) => {
    const firstWord = cmd.split(/\s+/)[0];
    setCurrentInfo(commandInfo[firstWord] || null);
  };

  // Action: Select command from button (only populates input)
  const selectCommand = (template: string) => {
    setCommandLine(template);
    updateInfo(template);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Core Function: Execute command (true execution or demo)
  const runCommand = (cmd: string) => {
    const finalCmd = cmd.trim();
    if (!finalCmd) return;

    appendOutput("$ " + finalCmd);
    updateInfo(finalCmd);
    setCommandLine("");
    // 優先從 window.cockpit 拿；如果沒有，再嘗試全域 cockpit
    const cockpitFromWindow = (window as any).cockpit;
    const cockpitObj =
      cockpitFromWindow ||
      (typeof cockpit !== "undefined" ? (cockpit as any) : undefined);

    // Debug 一次，之後可以拿掉
    appendOutput(
      `[debug] typeof window.cockpit = ${typeof cockpitFromWindow}, typeof cockpit(global) = ${typeof cockpitObj}`,
    );

    if (cockpitObj && typeof cockpitObj.spawn === "function") {
      // 真正在 VM 裡跑指令
      cockpitObj
        .spawn(["bash", "-lc", finalCmd], { err: "out" })
        .stream((data: string) => {
          appendOutput(data);
        })
        .done(() => {
          appendOutput(""); // 空一行比較好看
        })
        .fail((err: any) => {
          let msg = err.message || err;
          if (typeof msg === "object" && msg !== null) {
            msg = JSON.stringify(msg);
          }
          appendOutput(`[錯誤] ${msg}`);
        });
    } else {
      // 只有在「真的沒有 cockpit 物件」時才會走到這裡
      appendOutput(
        "(demo) 無法取得 cockpit 物件，改用示範模式輸出指令內容。",
      );
      appendOutput(
        "[錯誤] 這裡會顯示指令輸出的結果。請確認此頁面是從 Cockpit 介面中開啟，且外掛 index.html 有正確載入。",
      );
      appendOutput("");
    }
  };
  // Helper: Render danger label for inline display
  const renderDangerInline = (info: any) => {
    if (!info || !info.danger) {
      return null;
    }
    const style = dangerStyles[info.danger] || dangerStyles.low;
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
          <div className="pf-u-mt-sm pf-u-font-size-sm pf-u-color-black-600">
            小提示：你可以先看上方的「危險度」再決定要不要執行這個指令，...
          </div>
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
            {info.detail}
          </div>
        )}
        <div className="pf-u-mt-sm pf-u-font-size-sm pf-u-color-black-600">
          小提示：你可以先看上方的「危險度」再決定要不要執行這個指令，...
        </div>
      </div>
    );
  };
  // Filter commands based on selected category
  const filteredCommands = useMemo(() => {
    if (selectedCategory === "全部指令 (All)") {
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
    <>
      {/* Title and Introduction */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-p-0 pf-u-pt-lg"
        style={{ maxWidth: "unset", width: "100%" }}
      >
        <Title headingLevel="h2" size="xl" className="pf-u-mb-md">
          教學終端機
        </Title>
        <p>
          上半部是教學用終端機視窗，下方可以透過按鈕選擇指令，並查看詳細說明。
        </p>
      </PageSection>

      {/* Terminal Card */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-p-0"
        style={{ maxWidth: "unset", width: "100%" }}
      >
        <Card className="pf-u-background-color-white">
          <CardTitle className="pf-u-font-weight-bold">
            [ 教學終端機視窗 ] classuser@vm01:~
          </CardTitle>
          <CardBody className="pf-u-p-md">
            {/* Output Area */}
            <pre
              ref={outputBoxRef}
              style={{
                background: "#000",
                color: "#8ae234",
                height: "260px",
                overflowY: "auto",
                padding: "10px",
                lineHeight: "1.4",
                borderRadius: "4px",
                fontFamily: "monospace",
              }}
            >
              {output}
            </pre>
            {/* Input Area */}
            <Toolbar className="pf-u-mt-md pf-u-p-0">
              <ToolbarContent className="pf-u-p-0">
                <ToolbarItem>
                  <span>$</span>
                </ToolbarItem>
                <ToolbarItem style={{ flexGrow: 1 }}>
                  <TextInput
                    ref={inputRef}
                    value={commandLine}
                    onChange={(_event, value) => {
                      setCommandLine(value);
                      updateInfo(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") runCommand(commandLine);
                    }}
                    placeholder="輸入指令，例如：ls -R /etc"
                    style={{ fontFamily: "monospace" }}
                    type="text"
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant="primary"
                    onClick={() => runCommand(commandLine)}
                  >
                    執行
                  </Button>
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
          </CardBody>
        </Card>
      </PageSection>

      {/* Combined Info Card (Buttons + Explanation) */}
      <PageSection
        isWidthLimited={false}
        className="pf-u-mt-lg pf-u-p-0"
        style={{ maxWidth: "unset", width: "100%" }}
      >
        <Card>
          <CardBody>
            {/* Command Buttons Toolbar */}
            <Toolbar className="pf-u-p-0 pf-u-mb-md">
              <ToolbarContent className="pf-u-p-0">
                <ToolbarItem className="pf-u-mr-auto">
                  <Title headingLevel="h3" size="md">
                    常用指令：
                  </Title>
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    toggle={
                      <Dropdown.Toggle
                        onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                        toggleVariant="primary"
                      >
                        {selectedCategory}
                      </Dropdown.Toggle>
                    }
                    isOpen={isDropdownOpen}
                    dropdownItems={allCategories.map((category) => (
                      <DropdownItem
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {category}
                      </DropdownItem>
                    ))}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            {/* Button Display Area */}
            <div
              className="pf-u-mb-lg"
              style={{ maxHeight: "120px", overflowY: "auto", padding: "5px" }}
            >
              {filteredCommands.map((cmd) => {
                const info = commandInfo[cmd];
                const style = dangerStyles[info.danger];
                const tooltipTitle = `${style.icon} ${style.label} | ${info.text} | 危險度描述: ${style.desc}`;

                return (
                  <Button
                    key={cmd}
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
                        : "default"
                    }
                    onClick={() => selectCommand(info.template)}
                    title={tooltipTitle}
                  >
                    {cmd}
                  </Button>
                );
              })}
            </div>

            <Divider className="pf-u-mb-md" />

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
                  ? dangerStyles[currentInfo.danger]?.desc
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
    </>
  );
};

export const Application = TeachingTerminal;
export default TeachingTerminal;

