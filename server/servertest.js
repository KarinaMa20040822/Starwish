import fs from "fs";
import fetch from "node-fetch";

// 🪐 修改這裡的 astroId (1~12) 代表星座
// 1牡羊 2金牛 3雙子 4巨蟹 5獅子 6處女 7天秤 8天蠍 9射手 10摩羯 11水瓶 12雙魚
const astroNum = 6;

const url = `https://www.goodaytw.com/`;

async function main() {
  try {
    console.log("⏳ 正在抓取 Click108 網頁...");
    const resp = await fetch(url);
    const html = await resp.text();

    // ✅ 把整份 HTML 存下來方便我分析
    fs.writeFileSync("page.html", html, "utf-8");
    console.log("✅ 抓取完成！已儲存為 page.html");
    console.log("👉 請打開這個檔案，用 Ctrl+F 搜尋「吉時」或「吉色」");
    console.log("然後複製包含那一段的 HTML（大約20~50行）貼給我。");
  } catch (err) {
    console.error("❌ 抓取失敗", err);
  }
}

main();
