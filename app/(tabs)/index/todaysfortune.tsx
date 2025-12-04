// app/todaysfortune.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router"; // ⭐️ 新增引入
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View, } from "react-native";

const COLORS = {
    bg: "#F0E6FF",
    primary: "#663399",
    white: "#FFFFFF",
    text: "#3B2B54",
    subtext: "#6F5C90",
    chip: "#E9DCFF",
    star: "#FDBA22",
    divider: "#E7D9FF",
    border: "#E9DDFE",
    accent: "#F28B2B", // 農民曆小標題橘
    danger: "#E85C4A", // 「宜」
    muted: "#9BA0A6",  // 「忌」
};

type StarRowProps = { score?: number };
const StarRow = ({ score = 5 }: StarRowProps) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
        {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
                key={i}
                name={i < Math.floor(score) ? "star" : i < score ? "star-half" : "star-outline"}
                size={16}
                color={COLORS.star}
                style={{ marginLeft: i === 0 ? 0 : 3 }}
            />
        ))}
    </View>
);

type ItemRowProps = { emoji: string; title: string; text: string; stars?: number };
const ItemRow = ({ emoji, title, text, stars = 5 }: ItemRowProps) => (
    <View style={styles.itemCard}>
        {/* 標題 + 星星 同一行且靠左 */}
        <View style={styles.itemHeaderRow}>
            <View style={styles.itemTitleRow}>
                <View style={styles.emojiBadge}><Text style={{ fontSize: 16 }}>{emoji}</Text></View>
                <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
            </View>
            <View style={{ marginLeft: 8 }}>
                <StarRow score={stars} />
            </View>
        </View>

        <Text style={styles.itemText}>{text}</Text>
    </View>
);

export default function TodaysFortune() {
    const navigation = useNavigation();
    const params = useLocalSearchParams(); // ⭐️ 新增: 取得參數
    const astroId = params.astroId as string | undefined; // ⭐️ 讀取傳入的 astroId
    const [fortune, setFortune] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [advice, setAdvice] = useState<string>("");
    const [almanac, setAlmanac] = useState<any>(null);
      
    

    // 用系統 Header，但樣式統一
    useLayoutEffect(() => {
        navigation.setOptions?.({
            headerShown: true,
            title: "今日運勢",
            headerTitleAlign: "center",
            headerTitleStyle: { color: "#663399", fontSize: 20, fontWeight: "700" },
            headerStyle: { backgroundColor: COLORS.white }, // 不拉高，跟另一頁一致
            headerShadowVisible: false,
            headerBackTitleVisible: false,
            // 如果返回箭頭也要深紫，打開下面這行
            // headerTintColor: "#663399",
        });
    }, [navigation]);
    
  useEffect(() => {
        // ⭐️ 檢查 astroId 是否存在，若無則不執行或使用預設值
        if (!astroId) {
            console.warn("❌ TodaysFortune: 缺少 astroId 參數，使用預設值 6");
            // 如果沒有 ID，我們仍然可以嘗試用一個預設值，例如 '6' (處女座)
            // 或是直接 return, 讓 loading 畫面持續
        }
        const currentAstroId = astroId || '6';

    async function fetchData() {
      try {
        // ⚡ 模擬器用 10.0.2.2，手機用 ngrok
        const baseUrl =
          Platform.OS === "android"
            ? "http://10.0.2.2:3000" // Android 模擬器
            : "https://2ec87ef7a386.ngrok-free.app"; // ngrok URL

        const res = await fetch(`${baseUrl}/fortune?astroId=${currentAstroId}`);
        const data = await res.json();
        setFortune(data.daily.fortune);

          // 🔮 新增：呼叫 AI 建議 API
      const adviceRes = await fetch(`${baseUrl}/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall: data.daily.fortune.overall,
          love: data.daily.fortune.love,
          work: data.daily.fortune.work,
          wealth: data.daily.fortune.wealth,
        }),
      });
      const adviceData = await adviceRes.json();
      setAdvice(adviceData.advice);

        // 🌾 抓農民曆（你剛剛的 /today API）
        const almanacRes = await fetch(`${baseUrl}/today`);
        const almanacData = await almanacRes.json();
        setAlmanac(almanacData);

      } catch (err) {
        console.error("抓取失敗", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [astroId]);
  
      if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>   
                <ItemRow
                    emoji="🔮"
                    title="今日運勢總覽"
                    text={fortune?.overall?.text || "—"}
                    stars={fortune?.overall?.score || 0}
                />
                <ItemRow
                    emoji="💜"
                    title="愛情運勢"
                    text={fortune?.love?.text || "—"}
                    stars={fortune?.love?.score || 0}
                />
                <ItemRow
                    emoji="💼"
                    title="事業運勢"
                    text={fortune?.work?.text || "—"}
                    stars={fortune?.work?.score || 0}
                />
                <ItemRow
                    emoji="💰"
                    title="財富運勢"
                    text={fortune?.wealth?.text || "—"}
                    stars={fortune?.wealth?.score || 0}
                />

                {/* 今日需要注意 */}
                <View style={styles.noticeCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <Ionicons name="alert-circle" size={18} color={COLORS.primary} />
                        <Text style={[styles.cardTitlePurple, { marginLeft: 6 }]}>今日需要注意</Text>
                    </View>
                    {advice ? (
                    <View style={{ borderRadius: 12, padding: 10 }}>
                        <Text style={{ color: COLORS.subtext, lineHeight: 20 }}>{advice}</Text>
                    </View>
                    ) : null}

                </View>

                {/* 農民曆（標題在框外） */}
                <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <Ionicons name="calendar" size={18} color={COLORS.accent} />
                        <Text style={[styles.cardTitleOrange, { marginLeft: 6 }]}>農民曆</Text>
                    </View>

                    {/* 白色框：全部內容 */}
                    <View style={styles.almanacCard}>
                        {/* 國曆/農曆/節氣 */}
                        <View style={styles.innerPanel}>
                            <View style={styles.kvRow}>
                                <Text style={styles.kvKey}>國曆</Text>
                                <Text style={styles.kvVal}>{almanac.solar}</Text>
                            </View>
                            <View style={styles.kvRow}>
                                <Text style={styles.kvKey}>農曆</Text>
                                <Text style={styles.kvVal}>{almanac.lunar}</Text>
                            </View>
                            <View style={[styles.kvRow, { borderBottomWidth: 0 }]}>
                                <Text style={styles.kvKey}>節氣</Text>
                                <Text style={styles.kvVal}>{almanac.solarTerm}</Text>
                            </View>
                        </View>

                        {/* 宜 / 忌 */}
                        <View style={{ marginTop: 10 }}>
                            <View style={styles.yiJiRow}>
                                <View style={[styles.roundBadge, { backgroundColor: COLORS.danger }]}>
                                    <Text style={styles.roundBadgeText}>宜</Text>
                                </View>
                                <Text style={styles.kvValMulti}>{almanac.yi || "—"}</Text>
                            </View>
                            <View style={[styles.yiJiRow, { marginTop: 8 }]}>
                                <View style={[styles.roundBadge, { backgroundColor: COLORS.muted }]}>
                                    <Text style={styles.roundBadgeText}>忌</Text>
                                </View>
                                <Text style={styles.kvValMulti}>{almanac.ji || "—"}</Text>
                            </View>
                        </View>

                        {/* 小卡 */}
                        <View style={styles.gridRow}>
                            <View style={styles.gridBox}>
                                <Text style={styles.gridKey}>沖</Text>
                                <Text style={styles.gridVal}>{almanac.chong || "—"}</Text>
                            </View>
                            <View style={styles.gridBox}>
                                <Text style={styles.gridKey}>煞</Text>
                                <Text style={styles.gridVal}>{almanac.sha || "—"}</Text>
                            </View>
                        </View>

                        <View style={styles.gridRow}>
                            <View style={styles.gridBox}>
                                <Text style={styles.gridKey}>吉時</Text>
                                <Text style={styles.gridVal}>{almanac.jishi || "—"}</Text>
                            </View>
                            <View style={styles.gridBox}>
                                <Text style={styles.gridKey}>凶煞</Text>
                                <Text style={styles.gridVal}>{almanac.badGods || "—"}</Text>
                            </View>
                        </View>

                        <View style={styles.gridRow}>
                            <View style={[styles.gridBox, { flex: 1 }]}>
                                <Text style={styles.gridKey}>方位</Text>
                                <Text style={styles.gridVal}>{almanac.direction || "—"}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f5f3ff'},
    container: { padding: 16, paddingBottom: 0 },

    /* ===== 運勢卡 ===== */
    itemCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        marginBottom: 13,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
    },
    itemHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
    },
    emojiBadge: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: COLORS.chip, alignItems: "center", justifyContent: "center",
        marginRight: 8,
    },
    itemTitle: { color: COLORS.text, fontWeight: "700", fontSize: 16, maxWidth: 180 },
    itemText: { color: COLORS.subtext, fontSize: 13.5, lineHeight: 22, marginTop: 8, marginBottom: 2 },

    /* ===== 小節標題 ===== */
    cardTitlePurple: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
    cardTitleOrange: { color: COLORS.accent, fontWeight: "700", fontSize: 16 },

    /* ===== 注意卡 ===== */
    noticeCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
        marginTop: 8,
        marginBottom: 10,
    },
    bulletRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 4 },
    bulletDot: { color: COLORS.primary, marginRight: 6, fontSize: 14, lineHeight: 20 },
    bulletText: { color: COLORS.subtext, fontSize: 13.5, lineHeight: 20, flex: 1, marginBottom: 2 },

    /* ===== 農民曆 ===== */
    almanacCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 12,
    },
    innerPanel: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },
    kvRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    kvKey: { width: 48, color: COLORS.text, fontWeight: "700", fontSize: 14 },
    kvVal: { color: COLORS.subtext, fontSize: 14, flex: 1 },

    yiJiRow: { flexDirection: "row", alignItems: "flex-start" },
    roundBadge: {
        width: 23, height: 23, borderRadius: 11,
        alignItems: "center", justifyContent: "center",
        marginRight: 8,
    },
    roundBadgeText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
    kvValMulti: { color: COLORS.subtext, fontSize: 14, lineHeight: 20, flex: 1 },

    gridRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    gridBox: {
        flex: 1,
        backgroundColor: "#F7F1FF",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    gridKey: { color: COLORS.text, fontWeight: "700", fontSize: 15, marginBottom: 4 },
    gridVal: { color: COLORS.subtext, fontSize: 14, lineHeight: 18 },
});
