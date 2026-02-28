# Claude Notifier

> **Telegram을 통해 Claude Code와 supervisor가 소통하는 플러그인**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

Claude Code가 작업 중 supervisor에게 질문/보고가 필요할 때 CLI 대신 Telegram으로 연락하고, 300초 내 응답이 없으면 자율적으로 진행합니다.

---

## MCP Tools

| Tool | 설명 |
|------|------|
| `ask_supervisor` | Telegram으로 메시지 전송 + 응답 대기. 타임아웃 시 자율 진행. |
| `check_status` | Telegram 설정 상태 확인 |

---

## 설치

### 1. Telegram 봇 생성

1. [@BotFather](https://t.me/BotFather)에게 `/newbot` 명령
2. 봇 이름 설정 후 `TELEGRAM_BOT_TOKEN` 획득
3. 생성된 봇에게 아무 메시지나 전송
4. `https://api.telegram.org/bot<TOKEN>/getUpdates`에서 `chat_id` 확인

### 2. MCP 서버 등록

```bash
claude mcp add supervisor \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e TELEGRAM_CHAT_ID=your_chat_id \
  -s user \
  -- npx -y claude-notifier-mcp
```

### 3. 권한 설정

`~/.claude/settings.json`에 추가:

```json
{
  "permissions": {
    "allow": [
      "mcp__supervisor__ask_supervisor",
      "mcp__supervisor__check_status"
    ]
  }
}
```

---

## Ground Rule #9

`CLAUDE.md`에 다음 규칙을 추가하면 Claude Code가 Telegram-first로 동작합니다:

> **Telegram-first communication.** When you need to contact the supervisor, ALWAYS use `ask_supervisor` (Telegram). Never ask via CLI. Wait 300s for a reply — if none, proceed autonomously with your best judgment.

---

## 환경 변수

| 변수 | 필수 | 설명 | 기본값 |
|------|:----:|------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot API 토큰 | - |
| `TELEGRAM_CHAT_ID` | ✅ | 대상 Chat ID | - |
| `CLAUDE_NOTIFIER_TIMEOUT` | ❌ | 응답 대기 타임아웃 (초) | 300 |

---

## 개발

```bash
npm install
npm run build
npm run start    # MCP 서버
npm run bot      # 독립형 봇 서버
```

## 프로젝트 구조

```
claude-notifier/
├── src/
│   ├── index.ts           # MCP 서버 (ask_supervisor, check_status)
│   ├── tools/telegram.ts  # Telegram API 함수
│   ├── config.ts          # 환경 설정
│   └── bot-server.ts      # 독립형 봇 서버
├── .claude-plugin/        # 플러그인 메타데이터
├── CLAUDE.md              # Ground Rules
└── package.json
```

---

## 라이선스

MIT
