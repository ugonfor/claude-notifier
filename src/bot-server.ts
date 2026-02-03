#!/usr/bin/env node

import { spawn, ChildProcess } from "child_process";
import { loadConfig, validateTelegramConfig } from "./config.js";
import { sendTelegram } from "./tools/telegram.js";

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    from?: { username?: string; id: number };
  };
}

interface BotState {
  lastUpdateId: number;
  activeProcess: ChildProcess | null;
  currentCwd: string;
}

const state: BotState = {
  lastUpdateId: 0,
  activeProcess: null,
  currentCwd: process.cwd(),
};

const config = loadConfig();
const telegramConfig = validateTelegramConfig(config);

if (!telegramConfig) {
  console.error("Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
  process.exit(1);
}

async function getUpdates(timeout: number = 30): Promise<TelegramUpdate[]> {
  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${telegramConfig!.botToken}/getUpdates?offset=${state.lastUpdateId}&timeout=${timeout}&allowed_updates=["message"]`
    );
    const data = (await response.json()) as { ok: boolean; result?: TelegramUpdate[] };

    if (data.ok && data.result) {
      return data.result;
    }
  } catch (error) {
    console.error("Failed to get updates:", error);
  }
  return [];
}

async function sendMessage(text: string): Promise<void> {
  const result = await sendTelegram(telegramConfig!, text);
  if (!result.success) {
    console.error("❌ sendMessage 실패:", result.error);
  } else {
    console.log("✅ 메시지 전송 성공:", text.slice(0, 50) + "...");
  }
}

function parseCommand(text: string): { command: string; args: string } | null {
  const trimmed = text.trim();

  if (trimmed.startsWith("/run ")) {
    return { command: "run", args: trimmed.slice(5).trim() };
  }
  if (trimmed.startsWith("/cwd ")) {
    return { command: "cwd", args: trimmed.slice(5).trim() };
  }
  if (trimmed === "/status") {
    return { command: "status", args: "" };
  }
  if (trimmed === "/stop") {
    return { command: "stop", args: "" };
  }
  if (trimmed === "/help") {
    return { command: "help", args: "" };
  }

  // If no command prefix, treat as prompt for current session or new run
  return { command: "prompt", args: trimmed };
}

async function runClaude(prompt: string, cwd: string): Promise<void> {
  if (state.activeProcess) {
    await sendMessage("⚠️ 이미 실행 중인 작업이 있습니다. /stop으로 중지하거나 완료를 기다려주세요.");
    return;
  }

  await sendMessage(`🚀 Claude Code 실행 중...\n📁 폴더: ${cwd}\n📝 작업: ${prompt.slice(0, 100)}...`);

  const systemPrompt = `CRITICAL INSTRUCTION: You MUST use MCP tools for ALL communication.

DO NOT output anything to stdout. ALL responses must go through Telegram MCP tools.

REQUIRED WORKFLOW:
1. Use mcp__claude-notifier__send_telegram to send your response to the user
2. If you need user input, use mcp__claude-notifier__receive_telegram to wait for their reply
3. NEVER use AskUserQuestion - ONLY use Telegram MCP tools

Example:
- To respond: mcp__claude-notifier__send_telegram with message="Your response here"
- To get input: mcp__claude-notifier__receive_telegram

START NOW: Send your first response via Telegram about this task: ${prompt}`;

  console.log("🚀 Claude 프로세스 시작...", { cwd, prompt: prompt.slice(0, 50) });

  state.activeProcess = spawn("claude", ["-p", systemPrompt, "--allowedTools", "mcp__claude-notifier__send_telegram,mcp__claude-notifier__receive_telegram,Read,Write,Edit,Glob,Grep,Bash"], {
    cwd,
    shell: true,
    stdio: ["pipe", "pipe", "pipe"],
  });

  console.log("📌 프로세스 PID:", state.activeProcess.pid);

  let output = "";
  let errorOutput = "";

  state.activeProcess.stdout?.on("data", (data) => {
    const chunk = data.toString();
    output += chunk;
    console.log("📤 stdout:", chunk.slice(0, 100));
  });

  state.activeProcess.stderr?.on("data", (data) => {
    const chunk = data.toString();
    errorOutput += chunk;
    console.log("📤 stderr:", chunk.slice(0, 100));
  });

  state.activeProcess.on("close", async (code) => {
    state.activeProcess = null;

    const truncatedOutput = output.length > 3000
      ? output.slice(0, 1500) + "\n\n... (중략) ...\n\n" + output.slice(-1500)
      : output;

    if (code === 0) {
      await sendMessage(`✅ 작업 완료!\n\n결과:\n${truncatedOutput || "(출력 없음)"}`);
    } else {
      await sendMessage(`❌ 작업 실패 (코드: ${code})\n\n출력:\n${truncatedOutput}\n\n에러:\n${errorOutput.slice(0, 500)}`);
    }
  });

  state.activeProcess.on("error", async (error) => {
    state.activeProcess = null;
    await sendMessage(`❌ 실행 오류: ${error.message}`);
  });
}

async function handleCommand(cmd: { command: string; args: string }): Promise<void> {
  switch (cmd.command) {
    case "help":
      await sendMessage(`📚 Claude Code 텔레그램 봇 명령어

/run <프롬프트> - Claude Code 실행 (현재 폴더)
/cwd <경로> - 작업 폴더 변경
/status - 현재 상태 확인
/stop - 실행 중인 작업 중지
/help - 도움말

또는 그냥 메시지를 보내면 해당 내용으로 Claude Code가 실행됩니다.

현재 작업 폴더: ${state.currentCwd}`);
      break;

    case "cwd":
      if (cmd.args) {
        state.currentCwd = cmd.args;
        await sendMessage(`📁 작업 폴더 변경됨: ${state.currentCwd}`);
      } else {
        await sendMessage(`현재 작업 폴더: ${state.currentCwd}`);
      }
      break;

    case "status":
      if (state.activeProcess) {
        await sendMessage(`🔄 작업 실행 중\n📁 폴더: ${state.currentCwd}`);
      } else {
        await sendMessage(`✅ 대기 중\n📁 폴더: ${state.currentCwd}`);
      }
      break;

    case "stop":
      if (state.activeProcess) {
        state.activeProcess.kill("SIGTERM");
        await sendMessage("🛑 작업 중지 요청됨");
      } else {
        await sendMessage("실행 중인 작업이 없습니다.");
      }
      break;

    case "run":
    case "prompt":
      if (cmd.args) {
        await runClaude(cmd.args, state.currentCwd);
      } else {
        await sendMessage("작업 내용을 입력해주세요.");
      }
      break;
  }
}

async function pollLoop(): Promise<void> {
  console.log("🤖 Claude Code 텔레그램 봇 시작");
  console.log(`📁 기본 작업 폴더: ${state.currentCwd}`);

  await sendMessage(`🤖 Claude Code 봇이 시작되었습니다!\n\n📁 작업 폴더: ${state.currentCwd}\n\n/help 로 명령어를 확인하세요.`);

  // 초기화: 최신 update_id부터 시작 (과거 메시지 무시)
  console.log("⏳ 초기화 중...");
  try {
    const initResponse = await fetch(
      `${TELEGRAM_API_BASE}${telegramConfig!.botToken}/getUpdates?offset=-1&limit=1&timeout=0`
    );
    const initData = (await initResponse.json()) as { ok: boolean; result?: TelegramUpdate[] };
    console.log("📍 초기화 응답:", initData);
    if (initData.ok && initData.result && initData.result.length > 0) {
      state.lastUpdateId = initData.result[0].update_id + 1;
      console.log("📍 초기 lastUpdateId:", state.lastUpdateId);
    } else {
      console.log("📍 이전 메시지 없음, lastUpdateId:", state.lastUpdateId);
    }
  } catch (e) {
    console.error("초기화 오류:", e);
  }

  console.log("🔄 메시지 폴링 시작...");

  while (true) {
    const updates = await getUpdates(30);

    if (updates.length > 0) {
      console.log(`📨 ${updates.length}개 업데이트 수신`);
    }

    for (const update of updates) {
      state.lastUpdateId = update.update_id + 1;

      console.log("📩 메시지:", {
        chat_id: update.message?.chat.id,
        expected: telegramConfig!.chatId,
        text: update.message?.text?.slice(0, 30),
      });

      if (
        update.message?.text &&
        update.message.chat.id.toString() === telegramConfig!.chatId
      ) {
        const cmd = parseCommand(update.message.text);
        console.log("🔧 명령어 파싱:", cmd);
        if (cmd) {
          await handleCommand(cmd);
        }
      } else {
        console.log("⚠️ 메시지 필터링됨 (chat_id 불일치 또는 text 없음)");
      }
    }
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n봇 종료 중...");
  if (state.activeProcess) {
    state.activeProcess.kill("SIGTERM");
  }
  await sendMessage("🛑 봇이 종료되었습니다.");
  process.exit(0);
});

pollLoop().catch((error) => {
  console.error("Bot error:", error);
  process.exit(1);
});
