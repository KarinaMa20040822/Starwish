import React, { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, Image, Pressable, ScrollView, Share, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import { generateDailyStyle, generateAvatarImage } from "../../../service/generateAvtar";
import { useLocalSearchParams } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const viewRef = useRef(null);

  // 新增：接收路由參數
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [styleInfo, setStyleInfo] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const hasGeneratedRef = useRef(false); // 🆕 新增：防止重複生成

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        // 修改：使用從 index 傳來的數據
        const userData = {
            zodiac: getZodiacName(params.astroId), // 需要添加轉換函數
            mbti: "ENFP", // 可以從用戶資料獲取
            luckyColor: params.luckyColor || "紫色",
            luckyNumber: params.luckyNumber || "7",
            avoidColor: params.avoidColor || "#E57373",
            luckyItems: params.luckyItems ? JSON.parse(params.luckyItems as string) : [],
          };

        // 生成造型與小物
        const styleData = await generateDailyStyle(userData);
        if (!styleData) throw new Error("AI 回傳造型失敗");
        setStyleInfo(styleData);
        // 生成圖片
        const imgUrl = await generateAvatarImage(styleData);
        if (!imgUrl) throw new Error("AI 圖片生成失敗");

        setAvatarUrl(imgUrl);
      } catch (error) {
        console.error("AI 資料生成失敗：", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, []);

    // 新增：星座 ID 轉名稱的輔助函數
    const getZodiacName = (astroId: any) => {
        const names = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", 
                       "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
        return names[parseInt(astroId as string)] || "處女座";
      };

  // 截圖 + 分享
  const handleShare = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 0.9,
      });

      await Share.share({
        title: "分享我的今日造型",
        message: "這是我今天的星願指引小人造型",
        url: uri,
      });
    } catch (error) {
      console.error("分享失敗：", error);
    }
  };

  // 載入中畫面
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#A078E3" />
        <Text style={{ marginTop: 10, color: "#9370DB" }}>AI 正在生成您的造型...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}
    >
    <View>
        <Text style={styles.title}>今日專屬造型 ✨</Text>
    </View>
      <View style={styles.card} ref={viewRef}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Image source={require("@/assets/images/model.png")} style={styles.avatar} />
          )}
        </View>
        </View>
        <View style={styles.luckyBox}>
          {styleInfo?.小物?.map((item: any, index: number) => (
            <Text key={index} style={styles.luckyText}>
              {item.名稱}・{item.功效}
            </Text>
          ))}
        </View>


      {/* 分享按鈕 */}
      <View style={styles.shareSection}>
      <Pressable style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>📤 分享我的小人</Text>
      </Pressable>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9370DB",
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 220,
    height: 220,
    resizeMode: "contain",
    borderRadius: 20,
  },
  luckyBox: {
    backgroundColor: "#EBDDFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 10,
    width: "90%",
  },
  luckyText: {
    color: "#4A3B73",
    fontSize: 14,
    marginVertical: 2,
    textAlign: "left",
  },
  shareButton: {
    backgroundColor: "#663399",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    marginTop: 20,
  },
  shareText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  shareSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
});