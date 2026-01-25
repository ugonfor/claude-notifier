# Claude Notifier

Claude Code 사용 중 사용자 입력이 필요할 때 메신저(Slack, Telegram, Discord)로 알림을 보내고, **메신저에서 직접 응답**할 수 있는 플러그인입니다.

## 주요 기능

### 단방향 알림
- **idle_prompt**: 60초 이상 사용자 입력 대기 시 알림
- **permission_prompt**: Accept/Reject 선택 필요 시 알림
- **tool_error**: 도구 실행 오류 시 알림
- **Stop**: Claude 응답 완료 시 알림

### 양방향 통신 (Interactive Mode)
- **PreToolUse**: 파일 수정, Bash 실행 전 메신저로 확인 요청
- 메신저에서 **허용/거부/Plan 모드** 선택 가능
- Telegram 버튼 또는 텍스트 명령어 지원

### 지원 메신저
- Slack (Webhook) - 단방향
- Telegram (Bot API) - **양방향 지원**
- Discord (Webhook) - 단방향
- 데스크톱 알림 (Linux/macOS)

## 빠른 시작

```bash
git clone https://github.com/your-username/claude-notifier.git
cd claude-notifier
./install.sh
```

## 사용자 입력이 필요한 모든 상황

| Hook | 이벤트 | 설명 |
|------|--------|------|
| `Notification` | `idle_prompt` | 60초 이상 입력 대기 |
| `Notification` | `permission_prompt` | Accept/Reject 권한 요청 |
| `Notification` | `tool_error` | 도구 실행 오류 |
| `PreToolUse` | `Edit\|Write\|Bash` | 파일 수정/명령어 실행 전 |
| `Stop` | - | Claude 응답 완료 |

## 양방향 통신 (Interactive Mode)

Telegram을 사용하면 메신저에서 직접 응답할 수 있습니다.

### 작동 방식

```
┌─────────────────────────────────────────────────────────┐
│  Claude Code가 파일을 수정하려고 함                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PreToolUse Hook 실행                                   │
│  → Telegram으로 알림 전송 (버튼 포함)                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  사용자가 Telegram에서 응답                              │
│  [허용] [거부] [Plan 모드]                               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Claude Code에 결과 전달                                 │
│  - 허용: 도구 실행                                       │
│  - 거부: 도구 차단 + 이유 표시                           │
│  - Plan 모드: 차단 + "Shift+Tab으로 Plan 모드 전환" 안내 │
└─────────────────────────────────────────────────────────┘
```

### Telegram 응답 방법

**버튼 클릭:**
- `[허용]` - 도구 실행 허용
- `[거부]` - 도구 실행 차단
- `[Plan 모드]` - Plan 모드 전환 요청

**텍스트 명령어:**
- `/y` 또는 `y` - 허용
- `/n` 또는 `n` - 거부
- `/plan` - Plan 모드 전환

### 설정

```bash
# ~/.claude-notifier.env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
ENABLE_INTERACTIVE=true
CLAUDE_NOTIFIER_TIMEOUT=300  # 5분 대기
TIMEOUT_ACTION=allow  # 타임아웃 시 허용 (또는 block)
```

## Plan 모드란?

Plan 모드는 Claude가 **코드를 직접 수정하지 않고 계획만 세우는 모드**입니다.

- **전환 방법**: `Shift+Tab` 키
- **CLI 옵션**: `claude --permission-mode plan`

메신저에서 `/plan`을 입력하면:
1. 현재 도구 실행이 차단됨
2. "Shift+Tab을 눌러 Plan 모드로 전환하세요" 메시지 표시
3. 추가 알림 전송

## 설치

### 자동 설치

```bash
./install.sh
```

### 수동 설치

#### 1. 스크립트 복사

```bash
mkdir -p ~/.claude-notifier/scripts
cp scripts/*.sh ~/.claude-notifier/scripts/
chmod +x ~/.claude-notifier/scripts/*.sh
```

#### 2. 설정 파일 생성

```bash
cp .env.example ~/.claude-notifier.env
# 파일 편집하여 메신저 설정 추가
```

#### 3. Claude Code hooks 설정

`~/.claude/settings.json`:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [{"type": "command", "command": "$HOME/.claude-notifier/scripts/notify.sh", "timeout": 60000}]
      },
      {
        "matcher": "permission_prompt",
        "hooks": [{"type": "command", "command": "$HOME/.claude-notifier/scripts/notify.sh", "timeout": 60000}]
      },
      {
        "matcher": "tool_error",
        "hooks": [{"type": "command", "command": "$HOME/.claude-notifier/scripts/notify.sh", "timeout": 30000}]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [{"type": "command", "command": "$HOME/.claude-notifier/scripts/interactive-notify.sh", "timeout": 300000}]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{"type": "command", "command": "$HOME/.claude-notifier/scripts/notify.sh", "timeout": 30000}]
      }
    ]
  }
}
```

## 메신저 설정

### Telegram (양방향 지원)

1. [@BotFather](https://t.me/BotFather)에게 `/newbot` 명령으로 봇 생성
2. 생성된 봇에게 아무 메시지나 전송
3. `https://api.telegram.org/bot<TOKEN>/getUpdates`에서 chat_id 확인
4. 설정:
   ```bash
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ENABLE_INTERACTIVE=true
   ```

### Slack

1. [Slack Webhook](https://api.slack.com/messaging/webhooks)에서 Incoming Webhook 생성
2. 설정:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Discord

1. Discord 서버 설정 > 연동 > 웹훅에서 새 웹훅 생성
2. 설정:
   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
   ```

## 프로젝트 구조

```
claude-notifier/
├── scripts/
│   ├── notify.sh               # 단방향 알림
│   ├── interactive-notify.sh   # 양방향 통신 (PreToolUse용)
│   ├── telegram.sh             # Telegram 단방향
│   ├── telegram-interactive.sh # Telegram 양방향
│   ├── slack.sh                # Slack 단방향
│   ├── slack-interactive.sh    # Slack 양방향 안내
│   └── discord.sh              # Discord 단방향
├── hooks/
│   └── settings.json           # Claude Code hooks 설정
├── .env.example                # 설정 파일 예시
├── install.sh                  # 설치 스크립트
└── README.md
```

## 테스트

```bash
# 단방향 알림 테스트
source ~/.claude-notifier.env
echo '{"type":"test","message":"테스트"}' | ~/.claude-notifier/scripts/notify.sh

# 양방향 통신 테스트
echo '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | ~/.claude-notifier/scripts/interactive-notify.sh
```

## 문제 해결

### 알림이 오지 않는 경우

```bash
# 환경변수 확인
source ~/.claude-notifier.env
echo $TELEGRAM_BOT_TOKEN

# 스크립트 권한 확인
ls -la ~/.claude-notifier/scripts/

# 수동 테스트
~/.claude-notifier/scripts/telegram.sh "테스트" "메시지"
```

### 양방향 통신이 안 되는 경우

```bash
# Telegram Bot이 메시지를 받는지 확인
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getUpdates"

# 응답 디렉토리 확인
ls -la /tmp/claude-notifier/
```

## 라이선스

MIT License
