import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface Config {
  telegram: {
    botToken: string | undefined;
    chatId: string | undefined;
  };
  interactive: {
    timeout: number;
  };
}

function loadEnvFromSettingsFile(): Record<string, string> {
  const settingsPaths = [
    join(process.cwd(), ".claude", "settings.local.json"),
    join(process.cwd(), ".claude", "settings.json"),
  ];

  for (const settingsPath of settingsPaths) {
    if (existsSync(settingsPath)) {
      try {
        const content = readFileSync(settingsPath, "utf-8");
        const settings = JSON.parse(content);
        if (settings.env && typeof settings.env === "object") {
          return settings.env;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
  return {};
}

export function loadConfig(): Config {
  const fileEnv = loadEnvFromSettingsFile();

  return {
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID || fileEnv.TELEGRAM_CHAT_ID,
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
