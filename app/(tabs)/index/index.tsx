import React, { useMemo, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "react-native";
import { supabase } from "@/lib/supabase";
import { Session } from '@supabase/supabase-js'; 
import{ Video } from 'expo-av';


function getAstroId(birthDate) {
  if (!birthDate) return 5;
  const d = new Date(birthDate);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if ((m === 3 && day >= 21) || (m === 4 && day <= 19)) return 0;
  if ((m === 4 && day >= 20) || (m === 5 && day <= 20)) return 1;
  if ((m === 5 && day >= 21) || (m === 6 && day <= 21)) return 2;
  if ((m === 6 && day >= 22) || (m === 7 && day <= 22)) return 3;
  if ((m === 7 && day >= 23) || (m === 8 && day <= 22)) return 4;
  if ((m === 8 && day >= 23) || (m === 9 && day <= 22)) return 5;
  if ((m === 9 && day >= 23) || (m === 10 && day <= 23)) return 6;
  if ((m === 10 && day >= 24) || (m === 11 && day <= 22)) return 7;
  if ((m === 11 && day >= 23) || (m === 12 && day <= 21)) return 8;
  if ((m === 12 && day >= 22) || (m === 1 && day <= 19)) return 9;
  if ((m === 1 && day >= 20) || (m === 2 && day <= 18)) return 10;
  if ((m === 2 && day >= 19) || (m === 3 && day <= 20)) return 11;
  return 0;
}

function makeAvoidColor(luckyName) {
  const pool = ["#FFA726", "#CDE7FF", "#F5D44B", "#9C7CFF", "#2E7D32", "#F8BBD0", "#E57373"];
  const lucky = resolveColor(luckyName);
  const candidates = pool.filter((c) => c !== lucky);
  const idx = new Date().getDate() % candidates.length;
  return candidates[idx];
}


const COLORS = {
  bg: "#F0E6FF",
  primary: "#663399",
  white: "#FFFFFF",
  text: "#3B2B54",
  subtext: "#6F5C90",
  chip: "#E9DCFF",
  star: "#FDBA22",
  divider: "#E7D9FF",
  lilac: "#EBDDFF",
};

type StarRowProps = { score?: number };

const StarRow = ({ score = 0 }: StarRowProps) => (
  <View style={styles.starRow}>
    {Array.from({ length: 5 }).map((_, i) => {
      let iconName: any;
      if (i < Math.floor(score)) {
        iconName = "star";          // 滿星
      } else if (i < score) {
        iconName = "star-half";     // 半星
      } else {
        iconName = "star-outline";  // 空星
      }

      return (
        <Ionicons
          key={i}
          name={iconName}
          size={16}
          color={COLORS.star}
          style={{ marginLeft: i === 0 ? 0 : 4 }}
        />
      );
    })}
  </View>
);

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
    if (name.includes("紅")) return "#E57373"; // 柔和紅
    if (name.includes("粉")) return "#F8BBD0";

    // fallback → 隨機挑一個柔和色
    const fallbackColors = Object.values(exactMap);
    const randomIndex = Math.floor(Math.random() * fallbackColors.length);
    return fallbackColors[randomIndex];

    
}


// ======= 主頁 =======
export default function IndexScreen() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [fortuneData, setFortuneData] = useState<{ daily: any; fortune: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [luckyPerson, setLuckyPerson] = useState<string | null>(null);
  const [posts, setTopPosts] = useState<any[]>([]);
  // ⭐️ 新增：用戶星座 ID 狀態
  const [myAstroId, setMyAstroId] = useState<number | null>(null);




    // 取得熱門貼文
    useEffect(() => {
      async function fetchTopPosts() {
        try {
          const { data, error } = await supabase
            .from("CommunityIndex")
            .select(`
            *,
            users (
              username,
              avatar
            )
          `)
            .order("likes", { ascending: false }) // 按讚數由高到低排序
            .limit(2); // 只取前兩名
  
          if (error) throw error;

          const processed = (data || []).map((post: any) => ({
            ...post,
            user: post.users?.username || post.user || "匿名使用者",
            avatar: post.users?.avatar || post.avatar || "https://placehold.co/40x40",
            attachments:
              typeof post.attachments === "string"
                ? (() => {
                    try {
                      return JSON.parse(post.attachments);
                    } catch {
                      return [];
                    }
                  })()
                : Array.isArray(post.attachments)
                ? post.attachments
                : [],
          }));
          setTopPosts(processed);
        } catch (err) {
          console.error("🔥 抓取熱門話題失敗:", err);
        }
      }
      fetchTopPosts();
    }, []);
  

    // ✅ 1. 第一個 useEffect：取得 session
    useEffect(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
      });
  
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
  
      return () => subscription.unsubscribe();
    }, []);
  
  // 抓今日運勢 (修改: 依賴 myAstroId)
  useEffect(() => {
    // 確保 myAstroId 已經取得
    if (myAstroId === null) {
      console.log("⏳ 等待用戶星座 ID...");
      return;
    }
    
    async function fetchData() {
      try {
        const baseUrl =
          Platform.OS === "android"
            ? "http://10.0.2.2:3000"
            : "https://2ec87ef7a386.ngrok-free.app";

        // 🎯 核心修改: 使用動態 myAstroId 呼叫 API
        const res = await fetch(`${baseUrl}/fortune?astroId=${myAstroId}`);
        const data = await res.json();
        setFortuneData(data);
      } catch (err) {
        console.error("抓取失敗", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [myAstroId]); // 依賴 myAstroId 變化時重新執行

// 抓利害關係人資料 + 今日貴人（實際人名）(修改: 儲存 myAstroId)
useEffect(() => {
      // 如果 session 不存在，不執行
      if (!session?.user?.id) {
        console.log("⏳ 等待 session...");
        return;
      }
  async function fetchStakeholderData() {
    try {
      const userId = session.user.id;
      // 1️⃣ 抓所有利害關係人
      const { data } = await supabase
      .from("stakeholders")
      .select("id, nickname, birth_date")
      .eq('user_id', userId);

      // 2️⃣ 取得當前用戶生日
      const { data: userData } = await supabase
        .from('users')
        .select('birthday') // 讀取 users.birthday 欄位
        .eq('id', userId)
        .single();

      // 🎯 確保取得 myBirthday
      const myBirthday = userData?.birthday || null;
      if (!myBirthday) {
          console.log("⚠️ 用戶生日資料不存在，使用預設星座 ID (5: 處女座)");
      }
      const myAstro = getAstroId(myBirthday);
      setMyAstroId(myAstro); // ⭐️ 新增: 儲存用戶的星座 ID

      if (!data?.length) {
        console.log("📭 沒有利害關係人資料");
        return;
      }

      // 3️⃣ 計算今日貴人（契合度最高者）
      let bestMatch = null;
      let bestScore = -1;
      for (const p of data) {
        if (!p.birth_date) continue;
        const theirAstro = getAstroId(p.birth_date);
        // 使用 myAstro 來計算與利害關係人的相性
        const score = compatibilityTable?.[myAstro]?.[theirAstro] ?? 70;
        if (score > bestScore) {
          bestMatch = p;
          bestScore = score;
        }
      }

      if (bestMatch) {
        console.log("💫 今日貴人:", bestMatch.nickname);
        setLuckyPerson(bestMatch.nickname);
      } else {
        setLuckyPerson(null);
      }
    } catch (err) {
      console.error("❌ 抓取利害關係人資料失敗:", err);
    }
  }
  fetchStakeholderData();
}, [session]);

  // 判斷星座名稱 (可選，用於顯示在畫面上)
  const ZODIAC_NAMES = ["牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "魔羯", "水瓶", "雙魚"];
  const ZODIAC_EMOJIS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];
  const myZodiacEmoji = myAstroId !== null ? ZODIAC_EMOJIS[myAstroId] : "—";


  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* 今日運勢 */}
        <View style={styles.row}>
          <View style={[styles.card, styles.half, styles.withBottomLink]}>
            
            <View style={styles.rowTitleInline}>
              <Text style={styles.sectionTitle}>今日運勢</Text>
              <View style={styles.pillCircleSmall}>
                {/* 顯示動態星座 Emoji */}
                <Text style={styles.pillText}>{myZodiacEmoji}</Text>
              </View>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.blockTitle} numberOfLines={1}>
                整體運勢
              </Text>
              <StarRow score={fortuneData?.daily?.fortune?.overall?.score || 0} />

            </View>

            <TouchableOpacity
              style={styles.linkRow}
              // 🎯 核心修改: 傳遞 myAstroId 參數給下一頁
              onPress={() => router.push({ 
                pathname: "/todaysfortune", 
                params: { 
                  astroId: myAstroId,
                  luckyItems: JSON.stringify(fortuneData?.daily?.luckyItems) // 新增
                 } 
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>查看完整運勢 ></Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rightIllustration}>
            <TouchableOpacity
              onPress={() => router.push({ 
                pathname: "/mySpace", 
                params: { 
                  astroId: myAstroId,
                  luckyColor: fortuneData?.daily?.luckyColor, // 新增
                  luckyNumber: fortuneData?.daily?.luckyNumber, // 新增
                  luckyItems: JSON.stringify(fortuneData?.daily?.luckyItems || []), // 新增
                  avoidColor: makeAvoidColor(fortuneData?.daily?.luckyColor) // 新增
                } 
              })}
              activeOpacity={0.7}
            >
            <Image
              source={require("@/assets/images/fairy.png")}
              style={styles.fairy}
            />
            </TouchableOpacity>
          </View>
        </View>
        
{/* 幸運指數 / 利害關係人運勢（並排） */}
<View style={styles.row}>
  {/* 幸運指數 */}
  <View style={[styles.card, styles.half, styles.withBottomLink]}>
    <Text style={styles.sectionTitle}>幸運指數</Text>

    {loading || myAstroId === null ? (
      <ActivityIndicator size="small" color={COLORS.primary} />
    ) : (
      <View style={styles.luckRow}>
        {/* 左：幸運顏色 */}
        <View style={styles.luckCol}>
          <View
            style={[
              styles.dot,
              { backgroundColor: resolveColor(fortuneData?.daily?.luckyColor) },
            ]}
          />
          <Text style={styles.subNoteCenter}>
            {fortuneData?.daily?.luckyColor || "—"}
          </Text>
        </View>

        {/* 右：幸運數字 */}
        <View style={styles.luckCol}>
          <View style={styles.numBadge}>
            <Text style={styles.numText}>
              {fortuneData?.daily?.luckyNumber || "—"}
            </Text>
          </View>
          <Text style={styles.subNoteCenter}>幸運數字</Text>
        </View>
      </View>
    )}

    <TouchableOpacity
      style={styles.bottomLink}
      // 🎯 核心修改: 傳遞 myAstroId 參數給下一頁
      onPress={() => router.push({ 
        pathname: "/lucky", 
        params: { astroId: myAstroId } 
      })}
      activeOpacity={0.7}
    >
      <Text style={styles.linkText}>查看詳情 ></Text>
    </TouchableOpacity>
  </View>

        {/* 利害關係人運勢 */}
        <View style={[styles.card, styles.half, {marginLeft: 12, paddingBottom: 52 }]}>
          <Text style={styles.sectionTitle}>利害關係人運勢</Text>

          {luckyPerson ? (
            <View style={{marginTop: 16 }}>
              <Text style={styles.sectionTitle}>今日貴人: {luckyPerson}</Text>
            </View>
          ) : (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 12 }} />
          )}

          <TouchableOpacity
            style={styles.bottomLink}
            onPress={() => router.push("/stakeholder")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>查看詳情 ></Text>
          </TouchableOpacity>
        </View>
        </View> 

        {/* 熱門話題 */}
        <Text style={[styles.sectionTitle, { marginTop: 6, marginBottom: 8 }]}>熱門話題</Text>

        {posts.length > 0 ? (
          posts.map((post) => (
            <TouchableOpacity
              style={styles.card}
              key={post.postid}
              activeOpacity={0.8}
              onPress={() => 
                router.push({
                  pathname: "/(tabs)/community/[post]",
                  params: { postid: post.postid.toString() }
                })
              }
            >
              <View style={styles.topicHeader}>
              <Image 
                source={{ uri: post.avatar || "https://placehold.co/40x40" }} 
                style={styles.topicAvatarImage}
              />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={styles.topicName}>{post.user}</Text>
                    <Text style={styles.topicTime}> ・ {new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.topicBody}>{post.content}</Text>

              {post.attachments && post.attachments.length > 0 && (
                <View style={styles.imageRow}>
                  {post.attachments.map((file: string, idx: number) =>
                    file.endsWith(".mp4") ? (
                      <Video
                        key={idx}
                        source={{ uri: file }}
                        style={[styles.phImage, { marginRight: 20 }]}
                        useNativeControls
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        key={idx}
                        source={{ uri: file }}
                        style={[styles.phImage, { marginRight: 20 }]}
                        resizeMode="cover"
                      />
                    )
                  )}
                </View>
              )}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{post.likes} 讚</Text>
                <Text style={styles.dotSep}>·</Text>
                <Text style={styles.metaText}>{post.comments} 留言</Text>
                <Text style={styles.dotSep}>·</Text>
                <Text style={styles.metaText}>{post.shares} 分享</Text>
              </View>
            </TouchableOpacity> 
          ))
        ) : (
          <ActivityIndicator size="small" color={COLORS.primary} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f3ff'},
  container: { padding: 16, paddingBottom: 0 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    position: "relative",
  },

  withBottomLink: { paddingBottom: 52 },

  row: { flexDirection: "row" },
  half: { flex: 1 ,maxWidth: "48%",   },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: "700" },

  titleRow: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 6, marginLeft: 2,},
  blockTitle: { color: COLORS.text, fontSize: 13, fontWeight: "700", marginRight: 5, maxWidth: "60%" },
  starRow: { flexDirection: "row", alignItems: "center", marginLeft: 0, fontSize: 12},

  pillCircle: {
    width: 22, height: 22, borderRadius: 16,
    backgroundColor: COLORS.chip, alignItems: "center", justifyContent: "center",
  },
  pillText: { color: COLORS.primary, fontWeight: "700" },

  paragraph: { color: COLORS.subtext, lineHeight: 20, fontSize: 14 },

  linkRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  linkText: { color: COLORS.primary, fontWeight: "700", marginRight: 2, fontSize: 13, marginTop: 5 },

  bottomLink: {
    position: "absolute", right: 16, bottom: 14, flexDirection: "row", alignItems: "center",
  },

  // 幸運指數
  luckRow: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    marginTop: 10, paddingRight: 8, paddingLeft: 8,
  },
  luckCol: { width: "45%", alignItems: "center", justifyContent: "flex-start", marginTop: 15 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F4C542", marginBottom: 8 },
  numBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.lilac,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  numText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  subNoteCenter: { marginTop: 0, color: COLORS.subtext, fontSize: 12, textAlign: "center" },

  // 人物
  personRow: { flexDirection: "row", alignItems: "center", marginBottom: 1 },
  avatar: { alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 3 },
  avatarEmoji: { fontSize: 24, lineHeight: 26 }, // ⬅️ 放大 emoji

  tagText: { color: COLORS.subtext, fontSize: 15, },

  // 熱門話題
  topicHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  topicAvatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.chip,
    alignItems: "center", justifyContent: "center", marginRight: 8,
  },
  topicName: { color: COLORS.text, fontWeight: "700" },
  topicTime: { color: COLORS.subtext, fontSize: 12 },
  topicBody: { color: COLORS.subtext, fontSize: 13, lineHeight: 20, marginBottom: 8 },

  imageRow: { flexDirection: "row" },
  phImage: { flex: 1, height: 86, borderRadius: 12, backgroundColor: COLORS.divider },

  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  metaText: { color: COLORS.subtext, fontSize: 12 },
  dotSep: { marginHorizontal: 6, color: COLORS.subtext },
  topSection: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 12,
},
avatarEmoji: {
  width: 40,   // 根據你的需求調整
  height: 40,  // 根據你的需求調整
  borderRadius: 20, // 如果要圓形頭像
},
leftColumn: {
  flex: 1,
},
rightIllustration: {
  width: 120,
  alignItems: "center",
  marginTop: 4,
  marginLeft: 40,
},
fairy: {
  width: 100,
  height: 150,
  resizeMode: "contain",
},
rowTitleInline: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 6, // 與「整體運勢」行留點距離
},

pillCircleSmall: {
  width: 33,
  height: 33,
  borderRadius: 15,
  backgroundColor: COLORS.chip,
  alignItems: "center",
  justifyContent: "center",
  marginLeft: 40, // 與文字之間距離
},

topicAvatar: {
  width: 40,
  height: 40,
  borderRadius: 20,
  marginRight: 8,
  overflow: 'hidden',
  backgroundColor: COLORS.chip,
},
topicAvatarImage: {
  width: 40, height: 40, borderRadius: 20, marginRight: 8
},

});
