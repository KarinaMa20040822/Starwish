// @ts-nocheck
import cheerio from "npm:cheerio@1.0.0-rc.12";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY")!;
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY")!;
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

function extractFortune($: any, scoreSel: string, textSel: string, label: string) {
  const style = $(scoreSel).attr("style") ?? "";
  const match = style.match(/score_\w(\d)\.png/);
  const score = match ? Number(match[1]) : 3;
  const text = $(textSel).text().replace(label, "").trim();
  return { score, text };
}

async function insertFortune(data: any) {
  return await fetch(`${SUPABASE_URL}/rest/v1/fortune_data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(data),
  });
}

export default async function handler(req: Request): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (let astroId = 0; astroId < 12; astroId++) {
    try {
      const click108Id = (astroId + 1) % 12;
      const url = `https://m.click108.com.tw/astro/index.php?astroNum=${click108Id}`;

      const resp = await fetch(url);
      const html = await resp.text();
      const $ = cheerio.load(html);

      const overall = extractFortune($, "#astroDailyScore_all", "#astroDailyData_all", "整體運");
      const love = extractFortune($, "#astroDailyScore_love", "#astroDailyData_love", "愛情運");
      const work = extractFortune($, "#astroDailyScore_career", "#astroDailyData_career", "事業運");
      const wealth = extractFortune($, "#astroDailyScore_money", "#astroDailyData_money", "財運");

      const luckyColor = $("#astroDailyData_luckyTC").text().trim() || "無";

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const aiRes = await model.generateContent(`
        今日運勢：
        總覽：${overall.text} (${overall.score}星)
        愛情：${love.text} (${love.score})
        事業：${work.text} (${work.score})
        財運：${wealth.text} (${wealth.score})
        幸運色：${luckyColor}

        請給我一句不超過 30 字的生活化建議。
      `);
      const advice = aiRes.response.text().trim();

      await insertFortune({
        created_at: today,
        astro_id: astroId,
        lucky_color: luckyColor,
        love_fortune: love,
        wealth_fortune: wealth,
        career_fortune: work,
        suggestions: advice,
        match_rate: 50,
      });

      results.push({ astroId, status: "ok" });
    } catch (err) {
      results.push({ astroId, status: "error", error: err.message });
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" }
  });
}
