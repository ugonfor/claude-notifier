export interface Config {
  telegram: {
    botToken: string | undefined;
    chatId: string | undefined;
  };
  slack: {
    webhookUrl: string | undefined;
  };
  discord: {
    webhookUrl: string | undefined;
  };
  interactive: {
    enabled: boolean;
    timeout: number;
  };
}

export function loadConfig(): Config {
  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
    },
    discord: {
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
    },
    interactive: {
      enabled: process.env.ENABLE_INTERACTIVE === "true",
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

export function validateSlackConfig(config: Config): { webhookUrl: string } | null {
  if (!config.slack.webhookUrl) {
    return null;
  }
  return { webhookUrl: config.slack.webhookUrl };
}

export function validateDiscordConfig(config: Config): { webhookUrl: string } | null {
  if (!config.discord.webhookUrl) {
    return null;
  }
  return { webhookUrl: config.discord.webhookUrl };
}
