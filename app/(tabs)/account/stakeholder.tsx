import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/** ---------- 小工具 ---------- **/

  // 星座相性表（0~11 對應 Click108 星座順序）
const compatibilityTable = {
  0: { 0: 90, 1: 85, 2: 95, 3: 70, 4: 80, 5: 75, 6: 60, 7: 65, 8: 88, 9: 92, 10: 77, 11: 85 }, // 牡羊
  1: { 0: 80, 1: 90, 2: 75, 3: 85, 4: 95, 5: 88, 6: 77, 7: 70, 8: 65, 9: 82, 10: 68, 11: 78 }, // 金牛
  2: { 0: 95, 1: 80, 2: 90, 3: 88, 4: 70, 5: 60, 6: 85, 7: 75, 8: 95, 9: 77, 10: 92, 11: 85 }, // 雙子
  3: { 0: 65, 1: 88, 2: 70, 3: 90, 4: 80, 5: 95, 6: 60, 7: 85, 8: 75, 9: 78, 10: 68, 11: 92 }, // 巨蟹
  4: { 0: 82, 1: 95, 2: 70, 3: 88, 4: 90, 5: 80, 6: 85, 7: 60, 8: 75, 9: 65, 10: 95, 11: 77 }, // 獅子
  5: { 0: 75, 1: 88, 2: 95, 3: 90, 4: 65, 5: 92, 6: 80, 7: 85, 8: 60, 9: 78, 10: 68, 11: 95 }, // 處女
  6: { 0: 60, 1: 70, 2: 85, 3: 75, 4: 88, 5: 95, 6: 90, 7: 65, 8: 82, 9: 68, 10: 95, 11: 77 }, // 天秤
  7: { 0: 85, 1: 65, 2: 60, 3: 95, 4: 75, 5: 85, 6: 77, 7: 90, 8: 95, 9: 80, 10: 68, 11: 78 }, // 天蠍
  8: { 0: 88, 1: 75, 2: 95, 3: 70, 4: 65, 5: 60, 6: 85, 7: 95, 8: 90, 9: 77, 10: 82, 11: 92 }, // 射手
  9: { 0: 92, 1: 82, 2: 77, 3: 78, 4: 65, 5: 70, 6: 95, 7: 90, 8: 75, 9: 88, 10: 85, 11: 80 }, // 魔羯
  10: { 0: 95, 1: 88, 2: 92, 3: 85, 4: 78, 5: 80, 6: 90, 7: 70, 8: 75, 9: 82, 10: 77, 11: 95 }, // 水瓶
  11: { 0: 85, 1: 80, 2: 95, 3: 92, 4: 88, 5: 77, 6: 75, 7: 70, 8: 95, 9: 65, 10: 90, 11: 85 }, // 雙魚
};

// 生日轉星座 ID
// ⭐ Click108 專用星座編號（0~11）
function getAstroId(birthDate) {
  if (!birthDate) return 5; // 預設處女座


  const d = new Date(birthDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  // 按照 Click108 的實際星座順序（0~11）
  // 0: 牡羊, 1: 金牛, 2: 雙子, 3: 巨蟹, 4: 獅子, 5: 處女,
  // 6: 天秤, 7: 天蠍, 8: 射手, 9: 魔羯, 10: 水瓶, 11: 雙魚
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 0; // 牡羊座
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 1; // 金牛座
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return 2; // 雙子座
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return 3; // 巨蟹座
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 4; // 獅子座
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 5; // 處女座
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return 6; // 天秤座
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return 7; // 天蠍座
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return 8; // 射手座
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 9; // 魔羯座
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 10; // 水瓶座
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 11; // 雙魚座
  return 0;

  
}

// 星等轉成 "⭐"
const renderStars = (n?: number) =>
  "⭐".repeat(n ?? 0) + "☆".repeat(5 - (n ?? 0));

function resolveColor(name?: string): string {
    if (!name) return "#E0E0E0"; // 沒資料 → 灰色

    // 精準對照表
    const exactMap: Record<string, string> = {
        黃色: "#FDBA22",
        橘色: "#FFA726",
        淺藍: "#CDE7FF",
        檸檬黃: "#F5D44B",
        紫色: "#9C7CFF",
        綠色: "#2E7D32",
        粉紅: "#F8BBD0",
    };
    if (exactMap[name]) return exactMap[name];

    // 關鍵字判斷
    if (name.includes("黃")) return "#FDBA22";
    if (name.includes("橘")) return "#FFA726";
    if (name.includes("藍")) return "#CDE7FF";
    if (name.includes("紫")) return "#9C7CFF";
    if (name.includes("綠")) return "#2E7D32";
    if (name.includes("紅")) return "#E57373"; 
    if (name.includes("粉")) return "#F8BBD0";

    // fallback → 隨機挑一個柔和色
    const fallbackColors = Object.values(exactMap);
    const randomIndex = Math.floor(Math.random() * fallbackColors.length);
    return fallbackColors[randomIndex];
}


function makeAvoidColor(luckyName?: string): string {
  const pool = [
    "#FFA726", // 橘
    "#CDE7FF", // 淺藍
    "#F5D44B", // 檸檬黃
    "#9C7CFF", // 紫
    "#2E7D32", // 綠
    "#F8BBD0", // 粉
    "#E57373", // 紅
  ];

  // ✅ 把幸運色先轉成 HEX，避免重複
  const luckyColorHex = resolveColor(luckyName);

  // ✅ 過濾掉跟幸運色相同的顏色
  const candidates = pool.filter((c) => c !== luckyColorHex);

  // ✅ 用「今天的日期」當作 hash 生成索引
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = dateKey.charCodeAt(i) + ((hash << 5) - hash);
  }

  // ✅ 每天都會產生一樣的索引結果
  const index = Math.abs(hash) % candidates.length;

  return candidates[index];
}



/** ---------- 主組件 ---------- **/
export default function Stakeholders() {
  const [session, setSession] = useState<Session | null>(null);
  const [stakeholders, setStakeholders] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [fortunes, setFortunes] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [todayLuckyPerson, setTodayLuckyPerson] = useState<any>(null);


  // 抓資料
// 🪄 第一次進入頁面 → 抓所有利害關係人 & 運勢
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ 2. 抓取資料（依賴 session）
  useEffect(() => {
    if (!session?.user?.id) {
      console.log("⏳ 等待 session...");
      setLoading(false);
      return;
    }
  const fetchFortunes = async () => {
    try {
      setLoading(true);
      const userId = session.user.id;

      const { data, error } = await supabase
          .from("stakeholders")
          .select("id, nickname, relationship, birth_date, religion")
          .eq('user_id', userId);

      if (error) {
        console.error("❌ Supabase 抓取失敗:", error);
        setLoading(false);
        return;
      }

      setStakeholders(data || []);

      // 預設選第一位
      if (data?.length && !selectedPerson) {
        setSelectedPerson(data[0]);
      }

      // 取得當前用戶生日
      const { data: userData } = await supabase
        .from('users')
        .select('birthday')
        .eq('id', userId)
        .single();
    
      const myBirthday = userData?.birthday || "2005-08-25";
      const myAstro = getAstroId(myBirthday);

      const result = {};
      for (const p of data) {
        if (!p.birth_date) continue;
        const astroId = getAstroId(p.birth_date);

        const baseUrl =
          Platform.OS === "android"
            ? "http://10.0.2.2:3000"
            : "https://dc1eb7b5d846.ngrok-free.app";

        try {
          const res = await fetch(`${baseUrl}/fortune?astroId=${astroId}`);
          const json = await res.json();

          const f = json?.daily?.fortune || {};
          const luckyColor = json?.daily?.luckyColor || "#9B59B6";


           let advice = "";
          try {
            const adviceRes = await fetch(`${baseUrl}/advice`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                overall: f.overall,
                love: f.love,
                work: f.work,
                wealth: f.wealth,
                health: "良好",
              }),
            });
            const adviceJson = await adviceRes.json();
            advice = adviceJson.advice || "";
          } catch (err) {
            console.error("❌ 無法生成建議:", err);
          }

          result[p.id] = {
            overall: f.overall?.text || "無資料",
            overallScore: f.overall?.score || 3,
            work: f.work?.text || "無資料",
            workScore: f.work?.score || 3,
            love: f.love?.text || "無資料",
            loveScore: f.love?.score || 3,
            luckyColor,
            avoidColor: makeAvoidColor(luckyColor),
            advice,
          };
        } catch (err) {
          console.error(`❌ 抓 ${p.nickname} 運勢失敗`, err);
        }
      }

      // ✅ 把所有運勢結果存起來
setFortunes(result);

// 🎯 根據星座相性挑出「今日貴人」
if (data?.length) {

  let bestMatch = null;
  let bestScore = -1;

  for (const p of data) {
    if (!p.birth_date) continue;
    const theirAstro = getAstroId(p.birth_date);

    // ⭐ 星座相性表（越高越契合）
    const score = compatibilityTable?.[myAstro]?.[theirAstro] ?? 70;

    if (score > bestScore) {
      bestMatch = { ...p, matchScore: score };
      bestScore = score;
    }
  }

  if (bestMatch) {
    console.log("💫 今日貴人：", bestMatch.nickname, "契合度", bestMatch.matchScore);
    setTodayLuckyPerson(bestMatch);
  }
}

setLoading(false);

    } catch (err) {
      console.error("❌ 抓運勢總流程失敗", err);
      setLoading(false);
    }
  };

  fetchFortunes();
}, [session]); // 只在第一次載入時執行


// ⚡ 切換人物後 → 自動根據生日重新抓星座運勢
useEffect(() => {
  if (!selectedPerson || !selectedPerson.birth_date) {
    console.log("⏭️ 尚未選擇人物或無生日，略過運勢更新");
    return;
  }

  // 🪐 debug: 看目前選到的人
  console.log("🎯 目前選的人:", selectedPerson.nickname);
  console.log("📅 生日:", selectedPerson.birth_date);

  const updateSelectedFortune = async () => {
    try {
      // ✅ 統一處理日期格式
      const birth = new Date(selectedPerson.birth_date);
      if (isNaN(birth.getTime())) {
        console.warn("⚠️ 無效生日格式:", selectedPerson.birth_date);
        return;
      }

      const astroId = getAstroId(birth);
      console.log("🔮 對應星座 ID:", astroId);

      const baseUrl =
        Platform.OS === "android"
          ? "http://10.0.2.2:3000"
          : "https://3f9289124f53.ngrok-free.app";

      const res = await fetch(`${baseUrl}/fortune?astroId=${astroId}`);
      const json = await res.json();

      const f = json?.daily?.fortune || {};
      const luckyColor = json?.daily?.luckyColor || "#9B59B6";
      let advice = "";
      try {
        const adviceRes = await fetch(`${baseUrl}/advice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            overall: f.overall,
            love: f.love,
            work: f.work,
            wealth: f.wealth,
            health: "良好",
          }),
        });
        const adviceJson = await adviceRes.json();
        advice = adviceJson.advice || "";
      } catch (err) {
        console.error("❌ 無法生成建議:", err);
      }

      setFortunes((prev) => ({
        ...prev,
        [selectedPerson.id]: {
          overall: f.overall?.text || "無資料",
          overallScore: f.overall?.score || 3,
          work: f.work?.text || "無資料",
          workScore: f.work?.score || 3,
          love: f.love?.text || "無資料",
          loveScore: f.love?.score || 3,
          luckyColor,
          avoidColor: makeAvoidColor(luckyColor),
          advice,
        },
      }));

      console.log("✅ 已更新運勢:", selectedPerson.nickname);
    } catch (err) {
      console.error(`❌ 單人運勢更新失敗:`, err);
    }
  };

  updateSelectedFortune();
}, [selectedPerson?.id]);



  /** --- UI --- **/
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
       {/* 🎯 今日貴人（動態） */}
<Text style={styles.sectionTitle}>今日貴人</Text>

{todayLuckyPerson ? (
  <View style={styles.todayPersonCard}>
    <View style={styles.personCard}>
      <View style={styles.personInfo}>
        <View style={styles.personAvatar}>
          <Text style={styles.avatarText}>
            {todayLuckyPerson.nickname?.[0] || "?"}
          </Text>
        </View>
        <View style={styles.personDetails}>
          <Text style={styles.personName}>{todayLuckyPerson.nickname}</Text>
          <Text style={styles.personSubtitle}>今日特別契合</Text>
        </View>
      </View>

      <View style={styles.matchRate}>
        <Text style={styles.matchRateText}>
          契合度 {todayLuckyPerson.matchScore}%
        </Text>
      </View>
    </View>

    {/* 今日幫助面向（隨機 3 項） */}
    <Text style={styles.todayFortuneTitle}>今日可能幫助你的方面：</Text>
    {/* 💬 今日相處建議 */}
            {fortunes?.[selectedPerson?.id]?.advice ? (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>今日相處建議：</Text>
                {fortunes[selectedPerson.id].advice
                  .split(/[。；;、\n]/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((a, i) => (
                    <Text key={i} style={styles.suggestionItem}>
                      • {a}
                    </Text>
                  ))}
              </View>
            ) : null}

    
  </View>
) : (
  <View style={styles.todayPersonCard}>
    <Text style={{ color: "#777", textAlign: "center" }}>
      暫無貴人，請先新增利害關係人。
    </Text>
  </View>
)}


        {/* 💫 利害關係人運勢 */}
        <Text style={styles.sectionTitle}>利害關係人運勢</Text>
        {/* 下拉式選單 + 新增按鈕 */}
<View style={styles.personSelectorContainer}>
  {/* 下拉式選單 */}
  <TouchableOpacity
    style={styles.personDropdown}
    onPress={() => setShowDropdown(true)}
  >
    <View style={styles.person}>
      <View style={styles.personAvatarSmall}>
        <Text style={styles.avatarTextSmall}>
          {selectedPerson?.nickname?.[0] || "?"}
        </Text>
      </View>
      <Text style={styles.dropdownText}>
        {selectedPerson?.nickname || "選擇人物"}
      </Text>
    </View>
    <Text style={styles.dropdownArrow}>▼</Text>
  </TouchableOpacity>

  {/* 新增利害關係人 */}
  <TouchableOpacity
    style={styles.addPersonButton}
    onPress={() => router.push("/addStakeholder")}
  >
    <Text style={styles.addPersonText}>＋</Text>
  </TouchableOpacity>
</View>

{/* 下拉選單內容 */}
<Modal
  visible={showDropdown}
  transparent
  animationType="fade"
  onRequestClose={() => setShowDropdown(false)}
>
  <TouchableOpacity
    style={styles.modalOverlay}
    onPress={() => setShowDropdown(false)}
  >
    <View style={styles.dropdownMenu}>
      <FlatList
        data={stakeholders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setSelectedPerson({ ...item });
              setShowDropdown(false);
            }}
          >
            <View style={styles.personAvatarSmall}>
              <Text style={styles.avatarTextSmall}>
                {item.nickname?.[0] || "?"}
              </Text>
            </View>
            <Text style={styles.dropdownItemText}>{item.nickname}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  </TouchableOpacity>
</Modal>

        {loading ? (
          <ActivityIndicator size="large" color="#9B59B6" />
        ) : selectedPerson && fortunes[selectedPerson.id] ? (
          <View style={styles.fortuneAnalysis}>
            <Text style={styles.analysisTitle}>
              {selectedPerson.nickname} 今日運勢
            </Text>

            {/* 整體運勢 */}
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>整體運勢：</Text>
              <Text style={styles.analysisDesc}>
                {(() => {
                  const txt = fortunes[selectedPerson.id]?.overall || "";
                  const firstPart = txt.split(/[，,。.!！?？]/)[0]; // 取到第一個逗號或句號
                  return firstPart ? firstPart + "。" : txt;
                })()}
              </Text>
              <Text style={styles.analysisStars}>
                {renderStars(fortunes[selectedPerson.id]?.overallScore || 0)}
              </Text>
            </View>

            <Text style={styles.analysisSubtitle}>詳細分析</Text>

            {/* 工作運 */}
            <View style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>工作運：</Text>
              <Text style={styles.analysisDesc}>
                {(() => {
                  const txt = fortunes[selectedPerson.id]?.work || "";
                  const firstSentence = txt.split(/[。.!！]/)[0];
                  return firstSentence.length > 0
                    ? firstSentence + "。"
                    : txt.slice(0, 20) + (txt.length > 20 ? "..." : "");
                })()}
              </Text>
              <Text style={styles.analysisStars}>
                {renderStars(fortunes[selectedPerson.id].workScore)}
              </Text>
            </View>

            {/* 愛情運 */}
            <View style={styles.analysisItem1}>
              <Text style={styles.analysisLabel}>愛情運：</Text>
              <Text style={styles.analysisDesc}>
                {(() => {
                  const txt = fortunes[selectedPerson.id]?.love || "";
                  const firstSentence = txt.split(/[。.!！]/)[0];
                  return firstSentence.length > 0
                    ? firstSentence + "。"
                    : txt.slice(0, 20) + (txt.length > 20 ? "..." : "");
                })()}
              </Text>
              <Text style={styles.analysisStars}>
                {renderStars(fortunes[selectedPerson.id].loveScore)}
              </Text>
            </View>
            {/* 🎨 幸運色與霉運色 */}
            <View style={styles.colorIndicators}>
              {/* 幸運色 */}
              <View style={styles.colorItem}>
                <Text style={styles.colorLabel}>幸運色：</Text>
                <View
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: resolveColor(
                        fortunes[selectedPerson.id]?.luckyColor
                      ),
                    },
                  ]}
                />
              </View>

              {/* 霉運色（用固定色池避免重複） */}
              <View style={styles.colorItem1}>
                <Text style={styles.colorLabel}>霉運色：</Text>
                <View
                  style={[
                    styles.colorCircle,
                    {
                      backgroundColor: makeAvoidColor(
                        fortunes[selectedPerson.id]?.luckyColor
                      ),
                    },
                  ]}
                />
              </View>
            </View>

            {/* 💬 今日相處建議 */}
            {fortunes?.[selectedPerson?.id]?.advice ? (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>今日相處建議：</Text>
                {fortunes[selectedPerson.id].advice
                  .split(/[。；;、\n]/)
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((a, i) => (
                    <Text key={i} style={styles.suggestionItem}>
                      • {a}
                    </Text>
                  ))}
              </View>
            ) : null}

          </View>
        ) : (
          <Text style={{ color: "#777" }}>請先選擇人物</Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#9B59B6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9B59B6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  todayPersonCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 8,
  },
  personCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarTextSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  personDetails: {
    flexDirection: 'column',
  },
  personName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  personSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  matchRate: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchRateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  todayFortuneTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  fortuneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  fortuneIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  fortuneContent: {
    flex: 1,
  },
  fortuneName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  fortuneDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  businessHours: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  businessHoursText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  personSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  personDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#B19CD9',
    borderRadius:15,
    paddingVertical: 7,  
    padding: 5,
    width:150,
  },
  dropdownText: {
    color: 'white',
    fontSize: 14,
  },
  dropdownArrow: {
    color: 'white',
    fontSize: 16,
  },
  addPersonButton: {
    width: 30,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B19CD9',
    borderRadius: 16,
  },
  addPersonText: {
    fontSize: 23,
    justifyContent: 'center',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    minWidth: 160,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  fortuneAnalysis: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 16,
  },
  keywords: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keywordsText: {
    fontSize: 14,
    color: '#333',
  },
  detailedAnalysis: {
    marginBottom: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
  },
  analysisSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 16,
  },
  analysisItem: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisItem1: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisLabel: {
    color: '#333',
    fontWeight: '500',
    minWidth: 60,
    fontSize: 14,
  },
  analysisDesc: {
    color: '#666',
    flex: 1,
    marginRight: 8,
    fontSize: 14,
  },
  analysisStars: {
    fontSize: 12,
  },
  colorIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorItem: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width:150,
  },
  colorItem1: {
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width:150,
  },
  colorLabel: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  colorCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  suggestions: {
    backgroundColor: '#E6D5FF',
    borderRadius: 8,
    padding: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  row2: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 16,
},
cardHalf: {
  flex: 1,
  backgroundColor: "#F5F3FF",
  borderRadius: 12,
  padding: 12,
  marginHorizontal: 4,
},
colorRow: {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  marginTop: 8,
},
colorCol: {
  alignItems: "center",
},
colorBox: {
  width: 28,
  height: 28,
  borderRadius: 14,
  marginBottom: 6,
},
colorLabelCenter: {
  fontSize: 13,
  color: "#333",
  textAlign: "center",
},

});
