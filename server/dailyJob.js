// server/dailyJob.js
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
// 記得 .env 裡面要寫：API_BASE=http://localhost:3000（不要引號跟分號）
const API_BASE = process.env.API_BASE;

console.log("SUPABASE_URL =", SUPABASE_URL);
console.log("SUPABASE_SERVICE_KEY =", SUPABASE_KEY ? "Loaded" : "Missing");
console.log("API_BASE =", API_BASE);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 環境變數缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY");
  process.exit(1);
}
if (!API_BASE) {
  console.error("❌ 沒設定 API_BASE，請在 .env 裡加上 API_BASE=http://localhost:3000 或你的 ngrok/render 網址");
  process.exit(1);
}

// 共用：寫入 Supabase
async function supabaseInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    console.error(`❌ Supabase insert error:`, await res.text());
  }
}

// 主程式：每天跑一次，抓 12 星座
async function runDailyCron() {
  console.log("🚀 開始抓取 12 星座今日運勢（使用你的 server.js）...");

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (let astroId = 0; astroId < 12; astroId++) {
    try {
      console.log(`🔮 抓 astroId=${astroId} ...`);

      // 1️⃣ 先打你的 /fortune API
      const fortuneRes = await fetch(`${API_BASE}/fortune?astroId=${astroId}`);
      if (!fortuneRes.ok) {
        console.error(
          `❌ /fortune API 回傳錯誤 astroId=${astroId}`,
          await fortuneRes.text()
        );
        continue;
      }

      const json = await fortuneRes.json();
      const daily = json.daily || {};
      const f = daily.fortune || {};
      const overall = f.overall || null;
      const love = f.love || null;
      const work = f.work || null;
      const wealth = f.wealth || null;

      // 2️⃣ 再打你的 /advice API，用四大運勢請 Gemini 生建議
      let adviceText = null;
      if (overall && love && work && wealth) {
        try {
          const adviceRes = await fetch(`${API_BASE}/advice`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              overall,
              love,
              work,
              wealth,
              health: "良好",
            }),
          });

          if (adviceRes.ok) {
            const adviceJson = await adviceRes.json();
            adviceText = adviceJson.advice || null;
          } else {
            console.error(
              `❌ /advice API 失敗 astroId=${astroId}:`,
              await adviceRes.text()
            );
          }
        } catch (err) {
          console.error(`💥 呼叫 /advice 發生錯誤 astroId=${astroId}`, err);
        }
      } else {
        console.warn(`⚠️ astroId=${astroId} 四大運勢資料不完整，略過 AI 建議`);
      }

      // 3️⃣ 組成要寫入 fortune_data 的資料
      const insertData = {
        created_at: today,
        business_hours: daily.luckyTime || null,      // 吉時
        lucky_color: daily.luckyColor || null,      // 幸運色（原始文字）
        avoid_color: null,                          // 你如果之後要算霉運色也可以放
        keywords: null,                             // 之後可放關鍵字

        // 這三個欄位是 jsonb → 直接塞整個物件
        love_fortune: love || null,
        wealth_fortune: wealth || null,
        career_fortune: work || null,

        work_analysis: null,                        // 之後如果要拆出來可以填
        heart_analysis: null,

        // ⭐⭐ 把 AI 建議寫進這裡 ⭐⭐
        suggestions: adviceText,                    // 建議是一段文字

        match_rate: 50,                             // 先放預設值，有需要你再改
      };

      await supabaseInsert("fortune_data", insertData);

      console.log(`✨ astroId=${astroId} 今日運勢 + AI 建議 寫入成功`);
    } catch (err) {
      console.error(`💥 astroId=${astroId} error:`, err);
    }
  }

  console.log("🎉 完成！12 星座運勢已全部寫進 Supabase");
}

runDailyCron();
