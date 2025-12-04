import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ===== 顏色常數 =====
const COLORS = {
  bg: "#F5F3FF",
  card: "#FFFFFF",
  chip: "#FFFFFF",
  chipBorder: "#D9C8FF",
  text: "#3B2B54",
  sub: "#7B6E95",
  line: "#E9E1FF",
  purple: "#9C7CFF",
  bullet: "#7F5BFF",
  lemon: "#F5D44B",
  lightBlue: "#CDE7FF",
  orange: "#FFA726",
  deepGreen: "#2E7D32",
  primary: "#663399",
};

// ===== 工具：顏色中英文轉換 =====
const COLOR_NAME_TO_HEX: Record<string, string> = {
  檸檬黃: "#F5D44B",
  淺藍: "#CDE7FF",
  橘色: "#FFA726",
  深綠: "#2E7D32",
  紫色: "#9C7CFF",
  黃色: "#FDBA22",
};
const HEX_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_NAME_TO_HEX).map(([k, v]) => [v.toUpperCase(), k])
);



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

const ZODIAC_TO_EMOJI: Record<string, string> = {
    牡羊座: "♈",
    金牛座: "♉",
    雙子座: "♊",
    巨蟹座: "♋",
    獅子座: "♌",
    處女座: "♍",
    天秤座: "♎",
    天蠍座: "♏",
    射手座: "♐",
    摩羯座: "♑",
    水瓶座: "♒",
    雙魚座: "♓",
};


// ===== 工具：幸運方位定位 =====
function getDotPosition(dir: string) {
  const edge = 18;
  const center = 54 - 7;
  const map = {
    N: { top: edge, left: center },
    NE: { top: edge, right: edge },
    E: { top: center, right: edge },
    SE: { bottom: edge, right: edge },
    S: { bottom: edge, left: center },
    SW: { bottom: edge, left: edge },
    W: { top: center, left: edge },
    NW: { top: edge, left: edge },
  };
  return map[dir] ?? map.NE;
}
function dirLabelToCode(label?: string) {
  const t = label || "";
  if (t.includes("東北")) return "NE";
  if (t.includes("東南")) return "SE";
  if (t.includes("西北")) return "NW";
  if (t.includes("西南")) return "SW";
  if (t.includes("北")) return "N";
  if (t.includes("南")) return "S";
  if (t.includes("東")) return "E";
  if (t.includes("西")) return "W";
  return "NE";
}
const DIR_NAME: Record<string, string> = {
  N: "北方",
  NE: "東北方",
  E: "東方",
  SE: "東南方",
  S: "南方",
  SW: "西南方",
  W: "西方",
  NW: "西北方",
};

// 工具：把 "HH:MM" 轉換成一天的比例 (0~1)
function timeToRatio(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h * 60 + (m || 0)) / (24 * 60);
}



function getLuckyTimeRange(luckyTime?: string) {
  if (!luckyTime) return [0, 0];
  const parts = luckyTime.split("-");
  if (parts.length !== 2) return [0, 0];
  const startRatio = timeToRatio(parts[0]);
  const endRatio = timeToRatio(parts[1]);
  return [startRatio, endRatio];
}


// ===== 小元件 =====
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);
const Chip = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.chip}>
    <Text style={styles.chipText}>{children}</Text>
  </View>
);

// ===== 主畫面 =====
export default function LuckyIndexScreen() {
  const params = useLocalSearchParams();
  const astroId = params.astroId as string | undefined; // ⭐️ 新增: 讀取傳入的 astroId

  const [fortune, setFortune] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const luckyDirCode = useMemo(
    () => dirLabelToCode(fortune?.daily?.luckyDirection),
    [fortune]
  );
  const dotStyle = useMemo(() => getDotPosition(luckyDirCode), [luckyDirCode]);

  useEffect(() => {
        // ⭐️ 檢查 astroId 是否存在，若無則不執行或使用預設值
        if (!astroId) {
            console.warn("❌ LuckyIndexScreen: 缺少 astroId 參數，使用預設值 6");
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
        setFortune(data);
      } catch (err) {
        console.error("抓取失敗", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [astroId]);

// ✨ 呼吸閃爍動畫
const fadeAnim = useRef(new Animated.Value(0.7)).current;

useEffect(() => {
  const loopAnim = Animated.loop(
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 2000,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ])
  );
  loopAnim.start();
  return () => loopAnim.stop();
}, []);


  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: "幸運指數",
          headerTitleAlign: "center",
          headerTitleStyle: {
            color: COLORS.primary,
            fontSize: 20,
            fontWeight: "700",
          },
        }}
      />
        <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <>
            {/* 幸運數字 */}
<View style={styles.card}>
    <SectionTitle>幸運數字</SectionTitle>
    <View style={styles.rowWrap}>
        {[
            fortune?.daily?.luckyNumber || "—", 
            ...Array.from({ length: 4 }, () => Math.floor(Math.random() * 50) + 1), // 後面隨機
        ].map((num, index) => {
            const isSelected = index === 0; // 只高光第一個
            return (
                <View
                    key={index}
                    style={[
                        styles.numCircle,
                        isSelected && styles.numCircleSelected
                    ]}
                >
                    <Text
                        style={[
                            styles.numText,
                            isSelected && styles.numTextSelected
                        ]}
                    >
                        {num}
                    </Text>
                </View>
            );
        })}
    </View>
</View>


{/* 幸運色 / 霉運色 */}
<View style={styles.row2}>
  {/* 幸運色 */}
  <View style={styles.cardHalf}>
    <SectionTitle>幸運色</SectionTitle>
    <View style={styles.colorRow}>
      <View style={styles.colorCol}>
        <View
          style={[
            styles.colorBox,
            { backgroundColor: resolveColor(fortune?.daily?.luckyColor) },
          ]}
        />
        <Text style={styles.colorLabelCenter}>
          {fortune?.daily?.luckyColor || "—"}
        </Text>
      </View>
    </View>
  </View>

  {/* 霉運色（每日固定不同） */}
  <View style={styles.cardHalf}>
    <SectionTitle>霉運色</SectionTitle>
    <View style={styles.colorRow}>
      <View style={styles.colorCol}>
        {(() => {
          // ✅ 使用 COLORS 裡的顏色池
          const unluckyPool = [
            { name: "檸檬黃", hex: COLORS.lemon },
            { name: "淺藍", hex: COLORS.lightBlue },
            { name: "橘色", hex: COLORS.orange },
            { name: "深綠", hex: COLORS.deepGreen },
            { name: "紫色", hex: COLORS.purple },
            { name: "灰色", hex: "#BDBDBD" },
          ];

          const luckyName = fortune?.daily?.luckyColor || "";

          // ✅ 以日期生成穩定亂數
          const today = new Date();
          const dateKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}-${
            fortune?.daily?.luckyConstellation || ""
          }`;

          let hash = 0;
          for (let i = 0; i < dateKey.length; i++) {
            hash = dateKey.charCodeAt(i) + ((hash << 5) - hash);
          }

          let index = Math.abs(hash) % unluckyPool.length;
          let random = unluckyPool[index];

          // ✅ 避免跟幸運色重複
          if (random.name === luckyName) {
            index = (index + 1) % unluckyPool.length;
            random = unluckyPool[index];
          }

          return (
            <>
              <View
                style={[
                  styles.colorBox,
                  { backgroundColor: random.hex },
                ]}
              />
              <Text style={styles.colorLabelCenter}>{random.name}</Text>
            </>
          );
        })()}
      </View>
    </View>
  </View>
</View>


            {/* 幸運方位 */}
            <View style={styles.card}>
              <SectionTitle>幸運方位</SectionTitle>
              <View style={styles.directionRow}>
                <View style={styles.compass}>
                  <View style={styles.compassCircle}>
                    <View
                      style={[
                        styles.crossLine,
                        { transform: [{ rotate: "0deg" }] },
                      ]}
                    />
                    <View
                      style={[
                        styles.crossLine,
                        { transform: [{ rotate: "90deg" }] },
                      ]}
                    />
                    <View
                      style={[
                        styles.crossLineThin,
                        { transform: [{ rotate: "45deg" }] },
                      ]}
                    />
                    <View
                      style={[
                        styles.crossLineThin,
                        { transform: [{ rotate: "-45deg" }] },
                      ]}
                    />
                    <View style={[styles.dotPointer, dotStyle]} />
                  </View>
                  <Text style={[styles.dirText, { top: -6 }]}>北</Text>
                  <Text style={[styles.dirText, { bottom: -6 }]}>南</Text>
                  <Text style={[styles.dirText, { left: -8, top: "46%" }]}>
                    西
                  </Text>
                  <Text style={[styles.dirText, { right: -8, top: "46%" }]}>
                    東
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dirPara}>
                    今日幸運方位：
                    <Text style={styles.dirStrong}>
                      {DIR_NAME[luckyDirCode]}
                    </Text>
                    
                  </Text>
                  <Text style={styles.dirSub}>
                    適合前往此方位展開活動{"\n"}或擺放重要物品
                    </Text>
                </View>
              </View>
            </View>

            {/* 幸運時段 */}
                <View style={styles.card}>
                <SectionTitle>幸運時段</SectionTitle>

                <View style={styles.timeBar}>
                    {fortune?.daily?.luckyTime ? (
                    <Animated.View
                style={[
                    styles.timeHighlight,
                    {
                    left: `${getLuckyTimeRange(fortune.daily.luckyTime)[0] * 100}%`,
                    width: `${
                        Math.max(
                        (getLuckyTimeRange(fortune.daily.luckyTime)[1] -
                            getLuckyTimeRange(fortune.daily.luckyTime)[0]) *
                            100,
                        10 // ✅ 最小寬度 10%
                        )
                    }%`,
                    opacity: fadeAnim,
                    },
                ]}
                />
                    ) : (
                    <Text style={{ textAlign: "center", fontSize: 12, color: "#7B6E95" }}>
                        尚無幸運時段資料
                    </Text>
                    )}
                </View>

                <View style={styles.scaleRow}>
                    <Text style={styles.scaleText}>0h</Text>
                    <Text style={styles.scaleText}>6h</Text>
                    <Text style={styles.scaleText}>12h</Text>
                    <Text style={styles.scaleText}>18h</Text>
                    <Text style={styles.scaleText}>24h</Text>
                </View>

                <Text style={styles.timeNote}>
                    今日幸運時段：
                    <Text style={styles.timeStrong}>
                    {fortune?.daily?.luckyTime || "—"}
                    </Text>
                </Text>
                </View>


                {/* 幸運物品（三欄、整體往右一些） */}
                    <View style={[styles.card, { marginBottom: 20 }]}>
                    <SectionTitle>幸運物品</SectionTitle>
                    <View style={styles.itemGrid}>
                        {(fortune?.daily?.luckyItems || [
                        "水晶飾品",
                        "筆記本",
                        "香氛蠟燭",
                        "幸運手環",
                        "小植物",
                        "紫色衣物",
                        ]).map((t: string) => (
                        <View style={styles.itemRow} key={t}>
                            <View style={styles.bullet} />
                            <Text style={styles.itemText}>{t}</Text>
                        </View>
                        ))}
                    </View>
                    </View>

          </>
        )}
        </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
    safe: { flex: 1,  backgroundColor: '#f5f3ff', },
    container: { padding: 14, paddingBottom: 24 },

    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.line,
    },

    row2: { flexDirection: "row", gap: 12, marginBottom: 12 },
    cardHalf: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.line,
    },

    // 小標題統一：#663399、size 16
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#663399",
        marginBottom: 10,
    },

    // 幸運數字：五顆均分
    rowWrap: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    chip: {
        height: 44,
        width: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.chip,
        borderWidth: 1.5,
        borderColor: COLORS.chipBorder,
    },
    chipText: { fontSize: 16, fontWeight: "700", color: "#663399" },
    numCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#D9C8FF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#FFFFFF",
},
numCircleSelected: {
    backgroundColor: "#E9DCFF",
    borderColor: "#D9C8FF",
},
numText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#663399",
},
numTextSelected: {
    fontWeight: "800",
    color: "#3B2B54",
},


    // 幸運色／霉運色
    colorRow: { flexDirection: "row", justifyContent: "space-between" },
    colorCol: { width: "47%", alignItems: "center" },
    colorBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.line,
        marginBottom: 6,
    },
    colorLabelCenter: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: "600",
        textAlign: "center",
    },

    // 幸運方位
    directionRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    compass: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
    compassCircle: {
        width: 108,
        height: 108,
        borderRadius: 54,
        borderWidth: 2,
        borderColor: COLORS.chipBorder,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    crossLine: { position: "absolute", width: 2, height: 92, backgroundColor: COLORS.chipBorder },
    crossLineThin: { position: "absolute", width: 1, height: 92, backgroundColor: COLORS.line },
    dotPointer: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.purple },
    dirText: { position: "absolute", fontSize: 12, color: COLORS.sub },
    dirPara: { fontSize: 13, color: COLORS.text, marginBottom: 6 },
    dirStrong: { color: "#663399", fontWeight: "800" },
    dirSub: { fontSize: 12, lineHeight: 18, color: COLORS.sub },

timeBar: {
  height: 24,
  borderRadius: 12,
  overflow: "hidden",
  backgroundColor: "#EDE5FF", // 淺紫底
  position: "relative",
  marginTop: 6,
  marginBottom: 8,
},
timeHighlight: {
  position: "absolute",
  top: 0,
  bottom: 0,
  borderRadius: 12,
  backgroundColor: "rgba(156, 124, 255, 0.85)", // 紫亮條
  shadowColor: "#CDBBFF",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 10,
  elevation: 6,
  borderWidth: 0.5,
  borderColor: "rgba(255,255,255,0.6)",
},



    scaleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 2,
        marginBottom: 4,
    },

    scaleText: {
        fontSize: 10,
        color: COLORS.sub,
    },

    timeNote: {
        fontSize: 12,
        color: COLORS.sub,
        textAlign: "center",
        marginTop: 4,
    },

    timeStrong: {
        color: "#663399",
        fontWeight: "800",
    },

    // 幸運物品（三欄、往右一些）
    itemGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between", // 三欄平均分布
        rowGap: 10,
        paddingLeft: 8, // 往右一點
    },
    itemRow: {
        width: "30%", // 三欄
        flexDirection: "row",
        alignItems: "center",
    },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bullet, marginRight: 6 },
    itemText: { fontSize: 13, color: COLORS.text },
});
