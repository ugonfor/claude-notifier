export interface DiscordConfig {
  webhookUrl: string;
}

export interface SendDiscordResult {
  success: boolean;
  error?: string;
}

export async function sendDiscord(
  config: DiscordConfig,
  message: string,
  title?: string
): Promise<SendDiscordResult> {
  const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const embedTitle = title || "Claude Code Notification";

  const payload = {
    embeds: [
      {
        title: embedTitle,
        description: message,
        color: 5814783, // Blue color
        footer: {
          text: `Claude Code Notifier | ${timestamp}`,
        },
      },
    ],
  };

  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Discord returns 204 No Content on success
    if (response.ok || response.status === 204) {
      return { success: true };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
