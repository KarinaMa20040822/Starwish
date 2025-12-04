const API_BASE = "https://starwish-ai-backend.vercel.app/api";

export async function askTarotAI(payload: any): Promise<string> {
  try {
    const resp = await fetch(`${API_BASE}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "tarot", payload }),
    });
    const data = await resp.json();
    return data?.answer ?? "（AI 沒有回應）";
  } catch (e) {
    console.error("askTarotAI error", e);
    return "AI 呼叫失敗，請稍後再試。";
  }
}

export async function askFortuneAI(payload: any): Promise<string> {
  try {
    const resp = await fetch(`${API_BASE}/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "fortune", payload }),
    });
    const data = await resp.json();
    return data?.answer ?? "（AI 沒有回應）";
  } catch (e) {
    console.error("askFortuneAI error", e);
    return "AI 呼叫失敗，請稍後再試。";
  }
}