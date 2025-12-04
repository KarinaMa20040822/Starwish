import { Text, View, StyleSheet, Image, Pressable, ActivityIndicator } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { supabase } from "../../../lib/supabase";

// 信仰類型對應
const beliefLabels: { [key: string]: string } = {
  eastern: "東方信仰",
  western: "西方信仰",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPoints, setUserPoints] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // 獲取當前登入用戶
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("用戶未登入");
        setLoading(false);
        return;
      }

      // 從 users 表獲取用戶資料
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("獲取用戶資料錯誤:", userError);
      } else {
        setUserProfile(userData);
      }

      // 從 user_points 表獲取積分數據
      const { data: pointsData, error: pointsError } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (pointsError) {
        console.error("獲取積分資料錯誤:", pointsError);
        // 如果沒有資料，設置默認值
        setUserPoints({
          current_points: 0,
          post_count: 0,
          comment_count: 0
        });
      } else {
        setUserPoints(pointsData);
      }
    } catch (err) {
      console.error("載入用戶資料異常:", err);
    } finally {
      setLoading(false);
    }
  };

  // 計算生肖
  const getZodiacAnimal = (birthday: string) => {
    if (!birthday) return "未設定";
    const year = parseInt(birthday.split('-')[0]);
    const animals = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
    return animals[(year - 4) % 12];
  };

  // 計算星座
  const getConstellation = (birthday: string) => {
    if (!birthday) return "未設定";
    const [year, month, day] = birthday.split('-').map(Number);
    const constellations = [
      { name: "水瓶座", start: [1, 20], end: [2, 18] },
      { name: "雙魚座", start: [2, 19], end: [3, 20] },
      { name: "牡羊座", start: [3, 21], end: [4, 19] },
      { name: "金牛座", start: [4, 20], end: [5, 20] },
      { name: "雙子座", start: [5, 21], end: [6, 21] },
      { name: "巨蟹座", start: [6, 22], end: [7, 22] },
      { name: "獅子座", start: [7, 23], end: [8, 22] },
      { name: "處女座", start: [8, 23], end: [9, 22] },
      { name: "天秤座", start: [9, 23], end: [10, 23] },
      { name: "天蠍座", start: [10, 24], end: [11, 22] },
      { name: "射手座", start: [11, 23], end: [12, 21] },
      { name: "摩羯座", start: [12, 22], end: [1, 19] },
    ];

    for (const c of constellations) {
      if (
        (month === c.start[0] && day >= c.start[1]) ||
        (month === c.end[0] && day <= c.end[1])
      ) {
        return c.name;
      }
    }
    return "未設定";
  };

  // 轉換信仰顯示
  const getReligionDisplay = (religion: string) => {
    if (!religion) return "未設定";
    return beliefLabels[religion] || religion;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6b21a8" />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          無法載入用戶資料，請重新登入
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
      <Image 
        source={
          userProfile.avatar 
            ? { uri: userProfile.avatar } 
            : require("@/assets/images/virgo.png")
        } 
        style={styles.avatar} 
      />
        <Text style={styles.nickname}>{userProfile.username || "未設定"}</Text>
        <Text style={styles.constellation}>{getConstellation(userProfile.birthday)}</Text>
      </View>

      {/* 會員資料 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.memberTitle}>會員資料</Text>
          <Pressable onPress={() => router.push("./editProfile")}>
            <Image source={require("@/assets/images/edit.png")} style={styles.edit} />
          </Pressable>
        </View>
        <View style={styles.infoGridOut}>
          <View style={styles.infoGrid}>
            <Field label="生日" value={userProfile.birthday || "未設定"} />
            <Field label="生肖" value={getZodiacAnimal(userProfile.birthday)} />
            <Field label="MBTI" value={userProfile.mbti || "未設定"} />
            <Field label="信仰喜好" value={getReligionDisplay(userProfile.religion)} />
          </View>
        </View>
      </View>

      {/* 會員功能 */}
      <View style={styles.section}>
        <Text style={styles.memberTitle}>會員功能</Text>
        <View style={styles.featureRow}>
          <Feature
            icon={require("@/assets/images/heart.png")}
            label="收藏記錄"
            to="./savehistory"
            onPress={(to) => router.push(to)}
          />
          <Feature
            icon={require("@/assets/images/history.png")}
            label="占卜歷史"
            to="./askhistory"
            onPress={(to) => router.push(to)}
          />
          <Feature
            icon={require("@/assets/images/relation.png")}
            label="利害關係"
            to="./stakeholder"
            onPress={(to) => router.push(to)}
          />
          <Feature
            icon={require("@/assets/images/reward.png")}
            label="積分"
            to="./mypoint"
            onPress={(to) => router.push(to)}
          />
        </View>
      </View>

      {/* 活動資訊 */}
      <View style={styles.sectionRow}>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>社群活動</Text>
          <Text style={styles.infoText}>
            討論參與:{userPoints?.post_count || 0}次
          </Text>
          <Text style={styles.infoText}>
            獲得點讚:{userPoints?.comment_count || 0}次
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>商城訂單</Text>
          <Text style={styles.infoText}>待收貨:1件</Text>
          <Text style={styles.infoText}>歷史訂單:5筆</Text>
        </View>
      </View>

      <Text style={styles.footer}>© 2025 星願指引 版權所有</Text>
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}:</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function Feature({
  icon,
  label,
  to,
  onPress,
}: {
  icon: any;
  label: string;
  to: string;
  onPress: (to: string) => void;
}) {
  return (
    <Pressable style={styles.featureItem} onPress={() => onPress(to)}>
      <Image source={icon} style={{ width: 35, height: 35, marginBottom: 6 }} />
      <Text style={styles.featureText} numberOfLines={1} ellipsizeMode="tail">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 20,
  },

  /** Avatar */
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  proTag: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
    top: 10,
    right: 110,
    elevation: 2,
  },
  proText: { color: "orange", fontWeight: "bold", fontSize: 12 },
  nickname: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  constellation: { fontSize: 14, color: "#888" },
  edit: {
    width: 18,
    height: 18,
  },
  /** 區塊 */
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  memberTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 10 },
  infoGridOut: {
    alignItems:"center"
  },
  /** 會員資料：兩欄 × 兩列（置左） */
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width:"90%",
  },
  field: {
    width: "50%",
    flexDirection: "row",
    marginBottom: 8,
    paddingRight: 8,
  },
  fieldLabel: { fontSize: 14, color: "#333", fontWeight: "500" },
  fieldValue: { fontSize: 14, color: "#333", flexShrink: 1 },

  /** 會員功能：四個平均分散在一列 */
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  featureItem: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  /** 下方資訊卡 */
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  infoTitle: { fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  infoText: { fontSize: 13, color: "#444", textAlign: "center" },

  footer: { textAlign: "center", fontSize: 12, color: "#888", marginTop: 12 },
});