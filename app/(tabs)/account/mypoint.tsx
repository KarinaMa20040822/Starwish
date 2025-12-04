import { supabase } from "../../../lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PointsPage() {
  const [pointsData, setPointsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ 第一步：取得目前登入使用者 email
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) setUserEmail(user.email);
      } catch (err) {
        console.error("取得登入使用者失敗：", err);
      }
    };
    getCurrentUser();
  }, []);

  // ✅ 第二步：用 email 查自建 users.id
  useEffect(() => {
    const fetchUserId = async () => {
      if (!userEmail) return;
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("email", userEmail)
          .single();
        if (error) throw error;
        if (data) setUserId(data.id);
      } catch (err) {
        console.error("查詢 users 表錯誤：", err);
      }
    };
    fetchUserId();
  }, [userEmail]);

  // ✅ 第三步：查積分（若沒有則自動建立）
  useEffect(() => {
    const fetchOrCreatePoints = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("user_points")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        // 🟣 若找不到，建立初始紀錄
        if (!data) {
          const { data: newData, error: insertError } = await supabase
            .from("user_points")
            .insert([
              {
                user_id: userId,
                current_points: 0,
                post_count: 0,
                comment_count: 0,
              },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          setPointsData(newData);
        } else {
          setPointsData(data);
        }
      } catch (err) {
        console.error("抓取或建立積分錯誤：", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreatePoints();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  if (!pointsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#666" }}>查無積分資料</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Points Summary */}
      <View style={styles.pointsBox}>
        <Image
          source={require("@/assets/images/wizard.png")}
          style={styles.avatar}
        />
        <View style={styles.pointsCardOnlyRight}>
          <Text style={styles.points}>⭐ {pointsData.current_points}</Text>
          <Text style={styles.pointsLabel}>當前積分</Text>
        </View>
      </View>

      {/* Points Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>獲取積分方式</Text>

        <View style={styles.pointsCard}>
          <View style={styles.left}>
            <Ionicons name="document-text-outline" size={24} color="#6B4EFF" />
            <View>
              <Text style={styles.cardTitle}>發表文章</Text>
              <Text style={styles.cardSubtitle}>每發表一篇文章可獲得 10 積分</Text>
            </View>
          </View>
          <Text style={styles.pointsValue}>+10</Text>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.left}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#6B4EFF" />
            <View>
              <Text style={styles.cardTitle}>發表留言</Text>
              <Text style={styles.cardSubtitle}>每發表一則留言可獲得 5 積分</Text>
            </View>
          </View>
          <Text style={styles.pointsValue}>+5</Text>
        </View>
      </View>

      {/* Points Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>積分統計</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💬</Text>
            <Text style={styles.statNumber}>{pointsData.post_count}</Text>
            <Text style={styles.statLabel}>發文次數</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📝</Text>
            <Text style={styles.statNumber}>{pointsData.comment_count}</Text>
            <Text style={styles.statLabel}>留言次數</Text>
          </View>
        </View>
      </View>

      {/* Points Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>積分用法</Text>
        <View style={styles.usageBox}>
          <Text style={styles.usageIcon}>🎁</Text>
          <Text style={styles.usagePoints}>5</Text>
          <Text style={styles.usageText}>積分可兌換一次 AI 降價回覆</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ======= 樣式區 =======
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
  },
  pointsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginRight: 60,
  },
  pointsCardOnlyRight: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 16,
    elevation: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  points: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#6B4EFF",
  },
  pointsLabel: {
    fontSize: 14,
    color: "#999",
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  pointsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00C851",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6B4EFF",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
  },
  usageBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 12,
    elevation: 2,
  },
  usageIcon: {
    fontSize: 22,
  },
  usagePoints: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#ae82ef",
  },
  usageText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
});
