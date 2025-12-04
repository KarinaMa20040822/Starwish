const API_KEY = process.env.OPENAI_API_KEY;


/**
* 根據使用者當天的運勢生成專屬造型與小物
*/
export async function generateDailyStyle(userData: any) {
    const prompt = `
      根據以下用戶資料，生成今日專屬造型建議：
      - 星座：${userData.zodiac}
      - MBTI：${userData.mbti}
      - 幸運顏色：${userData.luckyColor}
      - 幸運數字：${userData.luckyNumber}
      - 避免顏色：${userData.avoidColor}
      ${userData.luckyItems?.length > 0 ? `- 今日幸運小物：${userData.luckyItems.join(', ')}` : ''}
      
      請生成 JSON 格式，包含：
      {
        "服裝風格": "描述",
        "配色建議": "描述",
        "小物": [
          { "名稱": "${userData.luckyItems?.[0] || '水晶手鍊'}", "功效": "描述" },
          { "名稱": "${userData.luckyItems?.[1] || '幸運符'}", "功效": "描述" }
        ]
      }
    `;
    
    try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
    {
    role: "system",
    content:
    "你是星願指引App的AI造型設計師，會根據運勢生成2D小人模型與搭配的幸運小物、配飾等。",
    },
    { role: "user", content: prompt },
    ],
    temperature: 0.8,
    }),
    });
    
    const data = await response.json();
    if (!response.ok) {
    console.error("OpenAI API 錯誤：", data);
    return null;
    }
    
    const resultText = data.choices?.[0]?.message?.content?.trim();
    let cleanText = resultText
    ?.replace(/```json/g, "")
    ?.replace(/```/g, "")
    ?.trim();
    
    try {
    const parsed = JSON.parse(cleanText);
    console.log("成功解析 AI JSON：", parsed);
    return parsed;
    } catch (err) {
    console.error("AI回傳格式錯誤：", cleanText);
    return null;
    }
    } catch (error) {
    console.error("發生例外：", error);
    return null;
    }
    };
    
    /**
    * 生成AI圖片（已修正 model 錯誤 + fallback 機制）
    */
    export const generateAvatarImage = async (styleData: any) => {
    const itemList = styleData?.小物?.map((x: any) => x.名稱).join("、") ?? "";
    const prompt = `可愛的2D小人插圖，${styleData.造型名稱}造型，手持${itemList}，畫風乾淨簡潔、可愛、明亮。`;
    
    // ✅ 改成字串陣列（原本是物件錯誤）
    const models = ["gpt-image-1", "dall-e-3", "dall-e-2"];
    
    for (const model of models) {
    try {
    const response = await fetch(
    "https://api.openai.com/v1/images/generations",
    {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
    model, // ✅ 現在是字串，不再報 Invalid type
    prompt,
    size: "1024x1024",
    }),
    }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
    console.error(`OpenAI 圖片API錯誤 (${model})：`, data);
    continue; // 換下一個模型
    }
    
    const url = data.data?.[0]?.url;
    const b64 = data.data?.[0]?.b64_json;
    
    if (url) {
    console.log(`✅ 成功生成圖片 (${model})：`, url);
    return url;
    }
    if (b64) {
    const base64Url = `data:image/png;base64,${b64}`;
    console.log(`✅ 成功生成Base64圖片 (${model})`);
    return base64Url;
    }
    } catch (error) {
    console.error(`生成圖片發生例外 (${model})：`, error);
    }
    }
    
    console.error("❌ 所有圖片模型皆失敗。");
    return null;
    };
    
