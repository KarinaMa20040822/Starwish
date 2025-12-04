import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase"; // 請根據你的路徑調整

type PushTypeKey = "zodiac" | "lunar" | "relationship";
const pushOptions: { label: string; key: PushTypeKey }[] = [
  { label: "星座運勢", key: "zodiac" },
  { label: "農民曆提醒", key: "lunar" },
  { label: "利害關係人運勢", key: "relationship" },
];

const LINE_CLIENT_ID = "2008066976";
const REDIRECT_URI = "https://auth.expo.io/@karinama/starwish-native";
const discovery = {
  authorizationEndpoint: "https://access.line.me/oauth2/v2.1/authorize",
  tokenEndpoint: "https://api.line.me/oauth2/v2.1/token",
};

// 信仰類型對應
const beliefLabels = {
  eastern: "東方信仰",
  western: "西方信仰",
};

// 🔗 LINE 綁定
async function loginWithLine(userId: string) {
  const request = new AuthSession.AuthRequest({
    clientId: LINE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    responseType: "code",
    scopes: ["profile", "openid", "email"],
    usePKCE: false,
  });
  const result = await request.promptAsync(discovery, { useProxy: true });
  if (result.type === "success" && result.params.code) {
    try {
      const res = await fetch(
        "https://ypoikgkkikfxtgnsnocd.supabase.co/functions/v1/line-bind",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: result.params.code,
            userId: userId,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert("綁定成功", "LINE 帳號已成功綁定！");
      } else {
        Alert.alert("綁定失敗", JSON.stringify(data.error));
      }
    } catch (err: any) {
      Alert.alert("綁定失敗", err.message || "未知錯誤");
    }
  } else {
    Alert.alert("綁定失敗", "請再試一次");
  }
}

export default function SettingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [selectedBelief, setSelectedBelief] = useState<"eastern" | "western">("eastern");
  const [pushTypes, setPushTypes] = useState({
    zodiac: false,
    lunar: false,
    relationship: false,
  });

  // 🔄 載入用戶資料
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 1. 獲取當前登入用戶
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        Alert.alert("錯誤", "請先登入");
        router.replace("/account");
        return;
      }

      setUserId(user.id);

      // 2. 從 users 資料表獲取用戶資料
      const { data: userData, error: dbError } = await supabase
        .from("users")
        .select("religion")
        .eq("id", user.id)
        .single();

      if (dbError) {
        console.error("獲取用戶資料失敗:", dbError);
        return;
      }

      // 3. 設定信仰偏好
      if (userData?.religion === "eastern" || userData?.religion === "western") {
        setSelectedBelief(userData.religion);
      }

    } catch (error) {
      console.error("載入用戶資料錯誤:", error);
      Alert.alert("載入失敗", "請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // 💾 更新信仰偏好
  const updateBelief = async (belief: "eastern" | "western") => {
    if (!userId) {
      Alert.alert("錯誤", "請先登入");
      return;
    }

    // 先更新 UI
    setSelectedBelief(belief);

    try {
      // 更新資料庫
      const { error } = await supabase
        .from("users")
        .update({ religion: belief })
        .eq("id", userId);

      if (error) {
        console.error("更新信仰偏好失敗:", error);
        Alert.alert("更新失敗", "請稍後再試");
        // 還原 UI
        setSelectedBelief(belief === "eastern" ? "western" : "eastern");
      }
    } catch (error) {
      console.error("更新錯誤:", error);
      Alert.alert("更新失敗", "網路錯誤");
      // 還原 UI
      setSelectedBelief(belief === "eastern" ? "western" : "eastern");
    }
  };

  // 🚪 登出功能
  const handleLogout = () => {
    Alert.alert("確認登出", "確定要登出帳號嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            console.log("已登出");
            Alert.alert("已登出", "期待再次與你相遇 💫");
            router.replace("/account");
          } catch (err) {
            Alert.alert("登出失敗", "請稍後再試");
          }
        },
      },
    ]);
  };

  // 載入中顯示
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#BFA2E0" />
        <Text style={{ marginTop: 12, color: "#999" }}>載入中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>帳號設定</Text>
      <Pressable
        style={styles.itemRow}
        onPress={() => router.push("/editProfile")}
      >
        <Text style={styles.itemText}>個人資料</Text>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
      <Pressable
        style={styles.itemRow}
        onPress={() => router.push("/subscribe")}
      >
        <Text style={styles.itemText}>訂閱管理</Text>
        <Text style={styles.arrow}>→</Text>
      </Pressable>
      <Pressable
        style={styles.itemRow}
        onPress={() => userId && loginWithLine(userId)}
      >
        <Text style={styles.itemText}>LINE 帳號綁定</Text>
        <Text style={styles.arrow}>→</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>偏好設定</Text>
      <Text style={styles.itemText}>信仰偏好</Text>
      <View style={styles.beliefRow}>
        <Pressable
          style={
            selectedBelief === "eastern"
              ? styles.beliefBtnSelected
              : styles.beliefBtn
          }
          onPress={() => updateBelief("eastern")}
        >
          <Text
            style={
              selectedBelief === "eastern"
                ? styles.beliefTextSelected
                : styles.beliefText
            }
          >
            東方信仰
          </Text>
        </Pressable>

        <Pressable
          style={
            selectedBelief === "western"
              ? styles.beliefBtnSelected
              : styles.beliefBtn
          }
          onPress={() => updateBelief("western")}
        >
          <Text
            style={
              selectedBelief === "western"
                ? styles.beliefTextSelected
                : styles.beliefText
            }
          >
            西方信仰
          </Text>
        </Pressable>
      </View>

      <Text style={styles.helperText}>
        {selectedBelief === "eastern"
          ? "包含：易經、農民曆、生肖、道教等"
          : "包含：塔羅牌、占星術等"}
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>通知設定</Text>
      <View style={styles.switchRow}>
        <Text style={styles.itemText}>開啟推播通知</Text>
        <Switch value={pushEnabled} onValueChange={setPushEnabled} />
      </View>

      <Text style={[styles.itemText, { marginTop: 16 }]}>選擇推播類型</Text>
      {pushOptions.map(({ label, key }) => (
        <View style={styles.switchRow} key={key}>
          <Text style={styles.itemText}>{label}</Text>
          <Switch
            value={pushTypes[key]}
            onValueChange={(val) =>
              setPushTypes((prev) => ({ ...prev, [key]: val }))
            }
          />
        </View>
      ))}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>登出</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#f5f3ff", flex: 1 },
  centerContent: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  itemText: { fontSize: 16 },
  arrow: { fontSize: 20, color: "#999" },
  beliefRow: { flexDirection: "row", marginTop: 8, gap: 12 },
  beliefBtnSelected: {
    flex: 1,
    backgroundColor: "#BFA2E0",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  beliefBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#BFA2E0",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  beliefText: { color: "#BFA2E0", fontWeight: "500" },
  beliefTextSelected: { color: "#fff", fontWeight: "500" },
  helperText: { fontSize: 12, color: "#999", marginTop: 4 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  logoutButton: {
    marginTop: 40,
    backgroundColor: "#BFA2E0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});