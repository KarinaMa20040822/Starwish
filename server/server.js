import dotenv from "dotenv";

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as cheerio from "cheerio";
import cors from "cors";
import express from "express";
import fetch from "node-fetch";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // GEMINI API KEY
const app = express();
const PORT = 3000;

app.use(cors()); // 允許 Expo 或手機端跨域請求
app.use(express.json()); 

// ✅ 每日快取，避免重複生成
const dailyCache = {};

// ⭐ 工具：抓星等與描述
function extractFortune($, scoreSelector, textSelector, label) {
  const style = $(scoreSelector).attr("style") || "";
  const match = style.match(/score_\w+(\d+)\.png/);
  let score = match ? parseInt(match[1], 10) : 3;
  if (score > 5) score = 5;

  const stars = "★★★★★☆☆☆☆☆".slice(0, score);
  const text = $(textSelector).text().replace(label, "").trim();
  return { score, stars, text };
}

// 🗓️ 自動抓今天日期 (YYYY-MM-DD)
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
// ⭐ 爬農民曆
app.get("/today", async (req, res) => {
  try {
    const date = getTodayDate();
    const url = `https://www.goodaytw.com/${date}`;
    console.log(`🔍 抓取網址：${url}`);

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // ====== 抓國曆、農曆、節氣 ======
    const solar = $(".Calendar_infoDate__lSWXM .Calendar_label3__fqc0m").eq(0).text().trim();
    const lunar = $(".Calendar_infoDate__lSWXM .Calendar_label3__fqc0m").eq(1).text().trim();
    const solarTerm = $(".Calendar_infoDate__lSWXM .Calendar_label3__fqc0m").eq(2).text().trim();

    const result = {
      date,
      solar,
      lunar,
      solarTerm,
      yi: "",
      ji: "",
      chong: "",
      sha: "",
      jishi: "",
      badGods: "",
      direction: "",
      source: url,
    };

    $(".Calendar_box2__2MGwH .MuiGrid-item").each((i, el) => {
      const text = $(el).text().trim();

      // ✅ 宜
      if (text.includes("宜")) {
        const nextText = $(el)
          .nextAll(".Calendar_infoGrid2__U_osw")
          .first()
          .text()
          .trim()
          .replace(/\s+/g, "、");
        result.yi = nextText;
      }

      // ✅ 忌（排除彭祖百忌）
      if (text.includes("忌") && result.ji === "") {
        const nextText = $(el)
          .nextAll(".Calendar_infoGrid2__U_osw")
          .first()
          .text()
          .trim();
        if (!nextText.includes("彭祖百忌") && !nextText.includes("己不破券"))
          result.ji = nextText.replace(/\s+/g, "、");
      }

      // ✅ 其他項目
      if (text.includes("沖")) result.chong = $(el).nextAll(".Calendar_infoGrid2__U_osw").first().text().trim();
      if (text.includes("煞")) result.sha = $(el).nextAll(".Calendar_infoGrid2__U_osw").first().text().trim();
      if (text.includes("吉時")) result.jishi = $(el).nextAll(".Calendar_infoGrid2__U_osw").first().text().trim();
      if (text.includes("凶煞")) result.badGods = $(el).nextAll(".Calendar_infoGrid2__U_osw").first().text().trim();
      if (text.includes("方位")) {
        result.direction = $(el)
          .nextAll(".Calendar_infoGrid2__U_osw")
          .first()
          .text()
          .trim()
          .replace(/\s+/g, "、");
      }
    });

    res.json(result);
  } catch (err) {
    console.error("❌ 抓取好日網失敗:", err);
    res.status(500).json({ error: "爬取失敗", detail: err.message });
  }
});


// ⭐ 爬星座
app.get("/fortune", async (req, res) => {
  const astroNum = parseInt(req.query.astroId || "5", 10);
  const click108Id = (astroNum + 1) % 12; // ⭐ Click108 實際使用的 ID 往後偏移一位
  const url = `https://m.click108.com.tw/astro/index.php?astroNum=${click108Id}`;

        // ⭐ 星座名稱對照表
  const astroNames = {
    10: "水瓶座 ♒",
    11: "雙魚座 ♓",
    0: "牡羊座 ♈",
    1: "金牛座 ♉",
    2: "雙子座 ♊",
    3: "巨蟹座 ♋",
    4: "獅子座 ♌",
    5: "處女座 ♍",
    6: "天秤座 ♎",
    7: "天蠍座 ♏",
    8: "射手座 ♐",
    9: "魔羯座 ♑",
  };

 const todayKey = new Date().toISOString().split("T")[0];
  const cacheKey = `${todayKey}-${astroNum}`;
  if (dailyCache[cacheKey]) {
    console.log(`📦 使用快取結果 (${astroNames[astroNum] || astroNum})`);
    return res.json(dailyCache[cacheKey]);
  }

  try {
    const resp = await fetch(url);
    const html = await resp.text();
    const $ = cheerio.load(html);

    // 💫 幸運數字
    const luckyNumber = $("#astroDailyData_luckyNum")
      .text()
      .replace("幸運數字：", "")
      .trim();

    // 💫 開運方位
    const luckyDirection = $("#astroDailyData_luckyDir")
      .text()
      .replace("開運方位：", "")
      .trim();

    // 💫 吉時吉色
    let luckyTime = "無";
    let luckyColor = "無";
    const tcText = $("#astroDailyData_luckyTC")
      .text()
      .replace("吉時吉色：", "")
      .replace(/\u00A0/g, " ") // 把 &nbsp; 轉成空白
      .trim();

    if (tcText) {
      const parts = tcText.split(/\s+/);
      if (parts.length >= 2) {
        luckyTime = parts[0];
        luckyColor = parts[1];
      } else if (tcText.includes(" ")) {
        const [time, color] = tcText.split(" ");
        luckyTime = time || "無";
        luckyColor = color || "無";
      } else {
        const colorMatch = tcText.match(/[\u4e00-\u9fa5]+$/);
        if (colorMatch) {
          luckyColor = colorMatch[0];
          luckyTime = tcText.replace(colorMatch[0], "").trim();
        }
      }
    }

    // 💫 貴人星座
    const luckyConstellation = $("#astroDailyData_vip")
      .text()
      .replace("貴人星座：", "")
      .trim();

    // 💫 四大運勢
    const overall = extractFortune($, "#astroDailyScore_all", "#astroDailyData_all", "整體運");
    const love = extractFortune($, "#astroDailyScore_love", "#astroDailyData_love", "愛情運");
    const work = extractFortune($, "#astroDailyScore_career", "#astroDailyData_career", "事業運");
    const wealth = extractFortune($, "#astroDailyScore_money", "#astroDailyData_money", "財運");

    // 💫 AI 生成幸運物品
    async function getLuckyItems(luckyColor, luckyDirection, luckyConstellation) {
      const prompt = `
      根據以下資訊，請你生成 6 個適合作為「今日幸運物品」的東西：
      - 幸運色：${luckyColor}
      - 幸運方向：${luckyDirection}
      - 幸運星座：${luckyConstellation}
      
      要求：
      - 給日常生活中常見的具體物品名稱
      - 與上述顏色或星座形象有關
      - 用中文回答，6 個，用逗號分隔
      範例格式：
      水晶吊飾, 薰衣草香氛, 紫色筆記本, 幸運手環, 木質飾品, 陶瓷杯
      直接生成物品就好，不用解釋  
      `;

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const items = text.split(/[,，]\s*/).slice(0, 6);
        if (items.length === 0) throw new Error("AI 回傳空白");
        return items;
      } catch (err) {
        console.error("❌ AI 生成幸運物品失敗:", err);
        return ["水晶飾品", "筆記本", "香氛蠟燭", "幸運手環", "小植物", "紫色衣物"];
      }
    }

    const luckyItems = await getLuckyItems(luckyColor, luckyDirection, luckyConstellation);

app.post("/advice", async (req, res) => {
  const { overall, love, work, wealth, health } = req.body || {}; // ← 加上保護機制

  if (!overall || !love || !work || !wealth) {
    return res.status(400).json({ error: "缺少運勢資料" });
  }

  const prompt = `
以下是今日的星座運勢：
- 總覽：${overall.text}（${overall.score}顆星）
- 愛情：${love.text}（${love.score}顆星）
- 事業：${work.text}（${work.score}顆星）
- 財運：${wealth.text}（${wealth.score}顆星）
- 健康：${health}

請根據以上內容，用自然中文給出一段約 2~3 句的「今日建議」，風格像貼心占卜師的語氣。
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ advice: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI 無法生成建議" });
  }
});

// 💫 AI 生成今日貴人摘要
app.post("/luckySummary", async (req, res) => {
  const { name, matchScore, aspects } = req.body || {};

  if (!name || !matchScore || !aspects) {
    return res.status(400).json({ error: "缺少必要欄位 (name, matchScore, aspects)" });
  }

  const prompt = `
你是一位占星運勢分析師。
請根據以下資訊，生成一段「今日貴人總結」，語氣自然且具正能量：
- 貴人姓名：${name}
- 契合度：${matchScore}%
- 今日幫助面向：${aspects.join("、")}

要求：
- 約 1～2 句中文
- 不要太誇張或太神話
- 帶一點貼心占卜師語氣
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    res.json({ summary: text });
  } catch (err) {
    console.error("❌ AI 生成貴人摘要失敗:", err);
    res.status(500).json({ error: "AI 無法生成摘要" });
  }
});


    // 💫 組合回傳結果
    const result = {
      daily: {
        luckyNumber,
        luckyColor,
        luckyTime,
        luckyDirection,
        luckyConstellation,
        luckyItems,
        fortune: { overall, love, work, wealth },
      },
    };

    // ✅ 存入每日快取
    dailyCache[todayKey] = result;

    console.log("✅ 成功產生今日運勢與幸運物品");
    res.json(result);
  } catch (err) {
    console.error("❌ 爬取錯誤", err);
    res.status(500).json({ error: "爬取失敗", detail: err.message });
  }
});

// 啟動伺服器
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
});
