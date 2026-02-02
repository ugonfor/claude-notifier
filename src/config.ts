export interface Config {
  telegram: {
    botToken: string | undefined;
    chatId: string | undefined;
  };
  interactive: {
    timeout: number;
  };
}

export function loadConfig(): Config {
  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
    interactive: {
      timeout: parseInt(process.env.CLAUDE_NOTIFIER_TIMEOUT || "300", 10),
    },
  };
}

export function validateTelegramConfig(
  config: Config
): { botToken: string; chatId: string } | null {
  if (!config.telegram.botToken || !config.telegram.chatId) {
    return null;
  }
  return {
    botToken: config.telegram.botToken,
    chatId: config.telegram.chatId,
  };
}
