export const config = { runtime: "edge" };

function buildTarotPrompt(payload) {
  const { question, cards = [], spread = "三張牌陣" } = payload || {};
  const cardLines = cards.map((c, i) => `${i + 1}. ${c.name}（${c.position === "reversed" ? "逆位" : "正位"}）`).join("\n");
  return `你是一位專業塔羅解讀師，使用繁體中文作答，給出溫和、具體且務實的建議。\n\n問題：${
    question || "（使用者未輸入問題）"
  }\n牌陣：${spread}\n抽到的牌：\n${
    cardLines || "（尚未提供牌名）"
  }\n\n請依序輸出：\n1) 整體氛圍（2-3 句）\n2) 逐張牌意（每張 2-4 句，包含正/逆位影響）\n3) 行動建議（條列 3-5 點，盡量可操作）\n4) 注意事項（1-3 點）`;
}

function buildFortunePrompt(payload) {
  // 增加 history 參數的解構
  const { text = "", grade = "", number = "", temple = "", question = "", history = "" } = payload || {};

  // 1. 設置系統角色
  let prompt = `你是一位懂得解籤的民俗顧問，使用繁體中文、平易近人。
  籤詩全文：
  ${text}
  附註：等級=${grade || "未知"}，號碼=${number || "未知"}，寺廟=${temple || "未知"}\n`;

  // 2. 增加歷史對話（如果存在）
  if (history) {
    prompt += `歷史對話紀錄：
  ${history}
  ----------------------------------
  `;
  }
  // 3. 增加使用者當前問題和輸出要求
  prompt += `使用者問題：${question || "（未提供）"}
  
  請根據籤詩內容、背景資訊與歷史對話，以溫和智慧的語氣，對當前問題做出專業的回覆。請依序輸出：
  1) 白話解釋（3-5 句）
  2) 吉凶判斷與範圍（感情/事業/財運/健康，各 1-2 句，要結合當前問題）
  3) 具體建議（條列 3-5 點，針對當前問題給出指引）
  4) 若為不利的籤，如何趨吉避凶（1-3 點）`;

  return prompt;
}
async function callOpenAI({ prompt }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      status: 500,
      body: { error: "Server missing OPENAI_API_KEY" },
    };
  }

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "你是善於解塔羅與解籤詩的專家，回覆一律使用繁體中文，語氣中立、具體、務實。" },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return { status: 500, body: { error: `OpenAI error: ${text}` } };
  }

  const data = await resp.json();
  const answer = data?.choices?.[0]?.message?.content || "（未取得內容）";
  return { status: 200, body: { answer } };
}

export default async function handler(request) {
  // CORS 預檢
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await request.json();
    const { task, payload } = body || {};

    let prompt = "";
    if (task === "tarot") prompt = buildTarotPrompt(payload);
    else if (task === "fortune") prompt = buildFortunePrompt(payload);
    else
      return new Response(JSON.stringify({ error: "Unknown task" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });

    const result = await callOpenAI({ prompt });
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
