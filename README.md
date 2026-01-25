# Claude Notifier

Claude Code 사용 중 사용자 입력이 필요할 때 메신저(Slack, Telegram, Discord)로 알림을 보내는 플러그인입니다.

## 기능

- **idle_prompt**: 60초 이상 사용자 입력을 기다릴 때 알림
- **permission_prompt**: Accept/Reject 선택이 필요할 때 알림
- **Stop**: Claude 응답 완료 후 알림

### 지원하는 메신저

- Slack (Webhook)
- Telegram (Bot API)
- Discord (Webhook)
- 데스크톱 알림 (Linux/macOS)

## 설치

```bash
git clone https://github.com/your-username/claude-notifier.git
cd claude-notifier
./install.sh
```

## 수동 설치

### 1. 스크립트 복사

```bash
mkdir -p ~/.claude-notifier/scripts
cp scripts/*.sh ~/.claude-notifier/scripts/
chmod +x ~/.claude-notifier/scripts/*.sh
```

### 2. 설정 파일 생성

```bash
cp .env.example ~/.claude-notifier.env
```

`~/.claude-notifier.env` 파일을 편집하여 메신저 설정을 추가합니다.

### 3. Claude Code hooks 설정

`~/.claude/settings.json` 파일에 hooks 설정을 추가합니다:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "idle_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude-notifier/scripts/notify.sh",
            "timeout": 30000
          }
        ]
      },
      {
        "matcher": "permission_prompt",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude-notifier/scripts/notify.sh",
            "timeout": 30000
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude-notifier/scripts/notify.sh",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
```

## 메신저 설정 방법

### Slack

1. [Slack Webhook](https://api.slack.com/messaging/webhooks) 페이지에서 Incoming Webhook 생성
2. `~/.claude-notifier.env` 파일에 추가:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Telegram

1. [@BotFather](https://t.me/BotFather)에게 `/newbot` 명령으로 봇 생성
2. 생성된 봇에게 아무 메시지나 전송
3. `https://api.telegram.org/bot<TOKEN>/getUpdates`에서 chat_id 확인
4. `~/.claude-notifier.env` 파일에 추가:
   ```bash
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ```

### Discord

1. Discord 서버 설정 > 연동 > 웹훅에서 새 웹훅 생성
2. `~/.claude-notifier.env` 파일에 추가:
   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
   ```

### 데스크톱 알림

```bash
ENABLE_DESKTOP_NOTIFICATION=true
```

## 테스트

```bash
# 설정 확인 후 테스트 알림 전송
source ~/.claude-notifier.env
echo '{"type":"test","message":"테스트 메시지"}' | ~/.claude-notifier/scripts/notify.sh
```

## 구조

```
claude-notifier/
├── scripts/
│   ├── notify.sh      # 메인 알림 스크립트
│   ├── slack.sh       # Slack 전송
│   ├── telegram.sh    # Telegram 전송
│   └── discord.sh     # Discord 전송
├── hooks/
│   └── settings.json  # Claude Code hooks 설정 예시
├── .env.example       # 설정 파일 예시
├── install.sh         # 설치 스크립트
└── README.md
```

## Claude Code Hooks 이벤트

| 이벤트 | 설명 |
|--------|------|
| `Notification` - `idle_prompt` | 60초 이상 사용자 입력 대기 |
| `Notification` - `permission_prompt` | Accept/Reject 권한 요청 |
| `Stop` | Claude 응답 완료 |

## 문제 해결

### 알림이 오지 않는 경우

1. 환경변수가 올바르게 설정되었는지 확인:
   ```bash
   source ~/.claude-notifier.env
   echo $SLACK_WEBHOOK_URL
   ```

2. 스크립트 권한 확인:
   ```bash
   ls -la ~/.claude-notifier/scripts/
   ```

3. 수동으로 테스트:
   ```bash
   echo '{"type":"test"}' | ~/.claude-notifier/scripts/notify.sh
   ```

### 로그 확인

```bash
# 로깅 활성화 후
ENABLE_LOGGING=true
tail -f ~/.claude-notifier.log
```

## 라이선스

MIT License
