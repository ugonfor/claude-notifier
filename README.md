# Claude Notifier

> **CLI 터미널 없이도 Telegram에서 Claude Code와 대화하기**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

Claude Code용 Telegram 플러그인으로, 알림 전송부터 양방향 대화, 원격 실행까지 지원합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **단방향 알림** | Claude → Telegram으로 메시지 전송 |
| **양방향 대화** | Telegram에서 Claude와 실시간 대화 |
| **원격 실행** | Telegram 봇 서버로 Claude Code 원격 제어 |

---

## 빠른 시작

### 1. 설치

```bash
# 마켓플레이스 추가 (최초 1회)
claude plugin marketplace add ugonfor/claude-notifier

# 플러그인 설치
claude plugin install claude-notifier
```

### 2. 환경 변수 설정

```bash
export TELEGRAM_BOT_TOKEN=your_bot_token
export TELEGRAM_CHAT_ID=your_chat_id
```

또는 `~/.claude/settings.json`에 추가:

```json
{
  "env": {
    "TELEGRAM_BOT_TOKEN": "your_bot_token",
    "TELEGRAM_CHAT_ID": "your_chat_id"
  }
}
```

### 3. Telegram 봇 생성

1. [@BotFather](https://t.me/BotFather)에게 `/newbot` 명령
2. 봇 이름 설정 후 `TELEGRAM_BOT_TOKEN` 획득
3. 생성된 봇에게 아무 메시지나 전송
4. `https://api.telegram.org/bot<TOKEN>/getUpdates`에서 `chat_id` 확인

---

## 사용법

### 방법 1: MCP 도구로 알림 보내기

Claude Code 대화 중 알림 전송:

```
> "Telegram으로 '빌드 완료!' 알림 보내줘"
> /claude-notifier:notify 작업이 완료되었습니다
> /claude-notifier:status
```

### 방법 2: Telegram 대화 모드

CLI에서 Telegram을 통해 Claude와 대화:

```
> /claude-notifier:chat
```

- **진입**: 위 명령어 입력
- **종료**: Telegram에서 `exit`, `quit`, `종료` 입력

### 방법 3: 독립형 봇 서버 (원격 실행)

컴퓨터 앞에 없어도 Telegram에서 Claude Code 실행:

```bash
# 봇 서버 시작
npm run bot
```

**Telegram 명령어:**

| 명령어 | 설명 |
|--------|------|
| `/run <프롬프트>` | Claude Code 실행 |
| `/cwd <경로>` | 작업 폴더 변경 |
| `/status` | 현재 상태 확인 |
| `/stop` | 실행 중인 작업 중지 |
| `/help` | 도움말 표시 |
| 일반 메시지 | 해당 내용으로 Claude Code 실행 |

---

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                     사용자                           │
│                       ↕                             │
│                   Telegram                          │
└───────────────────────┬─────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
┌────────────────┐ ┌──────────┐ ┌─────────────────┐
│  MCP 도구 모드  │ │ 채팅 모드 │ │  봇 서버 모드    │
│  (index.ts)    │ │  (Hook)  │ │ (bot-server.ts) │
└────────────────┘ └──────────┘ └─────────────────┘
         │              │              │
         └──────────────┼──────────────┘
                        ↓
               ┌─────────────────┐
               │   Claude Code   │
               └─────────────────┘
```

---

## MCP Tools

| Tool | 설명 |
|------|------|
| `send_telegram` | Telegram으로 메시지 전송 |
| `receive_telegram` | 사용자 응답 대기 (타임아웃 설정 가능) |
| `check_status` | Telegram 설정 상태 확인 |

---

## 환경 변수

| 변수 | 필수 | 설명 | 기본값 |
|------|:----:|------|--------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Telegram Bot API 토큰 | - |
| `TELEGRAM_CHAT_ID` | ✅ | 대상 Chat ID | - |
| `CLAUDE_NOTIFIER_TIMEOUT` | ❌ | 응답 대기 타임아웃 (초) | 300 |

---

## 권한 설정 (선택)

매번 승인 없이 사용하려면 `~/.claude/settings.json`에 추가:

```json
{
  "permissions": {
    "allow": [
      "mcp__claude-notifier__send_telegram",
      "mcp__claude-notifier__receive_telegram",
      "mcp__claude-notifier__check_status"
    ]
  }
}
```

---

## 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# MCP 서버 실행
npm run start

# 봇 서버 실행
npm run bot

# 개발 모드 (watch)
npm run dev
```

---

## 프로젝트 구조

```
claude-notifier/
├── src/
│   ├── index.ts        # MCP 서버 엔트리포인트
│   ├── bot-server.ts   # 독립형 Telegram 봇 서버
│   ├── config.ts       # 환경 설정 로더
│   └── tools/          # MCP 도구 구현
│       ├── send.ts
│       ├── receive.ts
│       └── status.ts
├── dist/               # 빌드 출력
├── package.json
├── tsconfig.json
└── marketplace.json    # 플러그인 마켓플레이스 메타데이터
```

---

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

---

## 기여

이슈와 PR은 언제나 환영합니다!

1. Fork
2. Feature branch 생성 (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성
