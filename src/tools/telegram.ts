const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface SendTelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export interface ReceiveTelegramResult {
  success: boolean;
  message?: string;
  error?: string;
  timedOut?: boolean;
}

export async function sendTelegram(
  config: TelegramConfig,
  message: string,
  chatId?: string
): Promise<SendTelegramResult> {
  const targetChatId = chatId || config.chatId;
  const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const formattedMessage = `${message}\n\n<i>${timestamp}</i>`;

  try {
    const response = await fetch(
      `${TELEGRAM_API_BASE}${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: formattedMessage,
          parse_mode: "HTML",
        }),
      }
    );

    const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };

    if (data.ok) {
      return {
        success: true,
        messageId: data.result?.message_id,
      };
    } else {
      return {
        success: false,
        error: data.description || "Unknown error",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function receiveTelegram(
  config: TelegramConfig,
  timeout: number = 300
): Promise<ReceiveTelegramResult> {
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;
  let lastUpdateId = 0;

  try {
    // Get the latest update ID first
    const initialResponse = await fetch(
      `${TELEGRAM_API_BASE}${config.botToken}/getUpdates?offset=-1&limit=1`
    );
    const initialData = await initialResponse.json() as { ok: boolean; result?: Array<{ update_id: number }> };
    if (initialData.ok && initialData.result && initialData.result.length > 0) {
      lastUpdateId = initialData.result[0].update_id + 1;
    }

    // Poll for new messages
    while (Date.now() - startTime < timeoutMs) {
      const pollTimeout = Math.min(30, Math.ceil((timeoutMs - (Date.now() - startTime)) / 1000));

      if (pollTimeout <= 0) break;

      const response = await fetch(
        `${TELEGRAM_API_BASE}${config.botToken}/getUpdates?offset=${lastUpdateId}&timeout=${pollTimeout}&allowed_updates=["message"]`
      );

      const data = await response.json() as {
        ok: boolean;
        result?: Array<{
          update_id: number;
          message?: {
            chat: { id: number };
            text?: string;
          };
        }>;
      };

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = update.update_id + 1;

          // Check if the message is from the target chat
          if (
            update.message &&
            update.message.chat.id.toString() === config.chatId &&
            update.message.text
          ) {
            return {
              success: true,
              message: update.message.text,
            };
          }
        }
      }
    }

    return {
      success: false,
      timedOut: true,
      error: `No response received within ${timeout} seconds`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
