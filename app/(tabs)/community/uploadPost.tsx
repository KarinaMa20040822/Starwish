import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function UploadPost() {
  const allZodiacs: string[] = [
    "牡羊座", "金牛座", "雙子座", "巨蟹座",
    "獅子座", "處女座", "天秤座", "天蠍座",
    "射手座", "魔羯座", "水瓶座", "雙魚座",
  ];
  const relatedTags: string[] = ["#自我照護", "#相位解析", "#星願小物"];

  const [privacy, setPrivacy] = useState<string>("公開");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [selectedZodiacs, setSelectedZodiacs] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllZodiacs, setShowAllZodiacs] = useState<boolean>(false);
  const [content, setContent] = useState<string>("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  // 🔹 抓取登入使用者資料（從 users 表）
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.error("未登入:", error);
        return;
      }

      // 從 users 資料表取得暱稱與頭像
      const { data: profile, error: profileErr } = await supabase
        .from("users")
        .select("id, username, avatar")
        .eq("id", user.id)
        .single();

      if (profileErr) {
        console.error("💥 讀取 users 資料表錯誤:", profileErr);
      }

      setCurrentUser({
        id: user.id,
        username: profile?.username || user.email,
        avatar: profile?.avatar || "https://placehold.co/40x40",
      });
    };

    fetchUser();
  }, []);

  // 🔹 選擇圖片或影片
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setMediaFiles((prev) => [...prev, ...uris]);
    }
  };

  const toggleZodiac = (zodiac: string) => {
    setSelectedZodiacs((prev) =>
      prev.includes(zodiac)
        ? prev.filter((z) => z !== zodiac)
        : [...prev, zodiac]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  // 🔹 發布貼文
  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert("錯誤", "請輸入貼文內容");
      return;
    }

    if (!currentUser) {
      Alert.alert("錯誤", "請先登入再發文");
      return;
    }

    let uploadedUrls: string[] = [];

    // 🔹 上傳圖片或影片到 Supabase Storage
    if (mediaFiles.length > 0) {
      try {
        for (const fileUri of mediaFiles) {
          const fileExt = fileUri.split(".").pop()?.toLowerCase() || "jpg";
          const isVideo = ["mp4", "mov"].includes(fileExt);
          const fileName = `post_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;

          const response = await fetch(fileUri);
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const { error: uploadError } = await supabase.storage
            .from("post-media")
            .upload(fileName, uint8Array, {
              contentType: isVideo ? "video/mp4" : "image/jpeg",
              upsert: true,
            });

          if (uploadError) {
            console.error("檔案上傳失敗:", uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName);

          uploadedUrls.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.error("檔案處理錯誤:", err);
        Alert.alert("錯誤", "檔案處理失敗");
        return;
      }
    }

    // 🔹 合併標籤
    const zodiacTags = selectedZodiacs.map((z) => `#${z}`);
    const combinedTags = [...selectedTags, ...zodiacTags];

    // 🔹 寫入資料庫
    const { error } = await supabase.from("CommunityIndex").insert([
      {
        user_id: currentUser.id,     // auth.users.id
        user: currentUser.username,  // ✅ 顯示 username
        avatar: currentUser.avatar,  // ✅ 使用 users.avatar
        content,
        attachments: uploadedUrls,
        likes: 0,
        comments: 0,
        shares: 0,
        zodiacs: selectedZodiacs,
        tags: combinedTags,
        privacy,
      },
    ]);

    if (error) {
      console.error("新增貼文失敗:", error);
      Alert.alert("失敗", "新增貼文失敗");
    } else {
      Alert.alert("成功", "貼文已發布！");
      setContent("");
      setMediaFiles([]);
      setSelectedZodiacs([]);
      setSelectedTags([]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 使用者頭像與設定 */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Image
              source={
                currentUser?.avatar
                  ? { uri: currentUser.avatar }
                  : require("../../../assets/images/icon.png")
              }
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {currentUser ? currentUser.username : "載入中..."}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text>{privacy} ▼</Text>
          </TouchableOpacity>
        </View>

        {/* 輸入框 */}
        <View style={styles.postInputAreaWrapper}>
          <TextInput
            style={styles.postTextarea}
            placeholder="分享你的星座心情、運勢或建議..."
            multiline
            value={content}
            onChangeText={setContent}
          />
        </View>

        {/* 星座選擇 */}
        <View style={styles.hotTopicsSection}>
          <View style={styles.hotTopicsTitleContainer}>
            <Text style={styles.hotTopicsTitle}>選擇相關星座</Text>
            <TouchableOpacity
              onPress={() => setShowAllZodiacs(!showAllZodiacs)}
            >
              <Text>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.hotTopicsList}>
            {(showAllZodiacs ? allZodiacs : allZodiacs.slice(0, 4)).map(
              (zodiac) => (
                <TouchableOpacity
                  key={zodiac}
                  style={[
                    styles.hotTopic,
                    selectedZodiacs.includes(zodiac) &&
                      styles.selectedTopic,
                  ]}
                  onPress={() => toggleZodiac(zodiac)}
                >
                  <Text style={styles.hotTopicText}>{zodiac}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>

        {/* 話題標籤 */}
        <View style={styles.hotTopicsSection}>
          <Text style={styles.hotTopicsTitle}>加入話題標籤</Text>
          <View style={styles.hotTopicsList}>
            {relatedTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.hotTopic,
                  selectedTags.includes(tag) && styles.selectedTopic,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={styles.hotTopicText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 圖片/影片上傳 */}
        <View style={styles.hotTopicsSection}>
          <Text style={styles.hotTopicsTitle}>添加圖片或影片</Text>
          <View style={styles.imageUploadPreview}>
            {mediaFiles.map((file, idx) => {
              const isVideo = file.endsWith(".mp4") || file.endsWith(".mov");
              return (
                <View key={idx} style={styles.imageBox}>
                  {isVideo ? (
                    <Video
                      source={{ uri: file }}
                      style={styles.imagePreview}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                    />
                  ) : (
                    <Image
                      source={{ uri: file }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  )}
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() =>
                      setMediaFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
            <TouchableOpacity style={styles.imageBox} onPress={pickMedia}>
              <Text style={styles.uploadText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 發布按鈕 */}
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>發布</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: { flex: 1, backgroundColor: "#F0E6FF" },
  scrollContent: { paddingBottom: 60 },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  username: { fontSize: 16, fontWeight: "bold" },
  privacyButton: {
    backgroundColor: "#B69EE5",
    paddingVertical: 5,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  postInputAreaWrapper: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  postTextarea: {
    height: 100,
    padding: 10,
    textAlignVertical: "top",
    color: "#111",
  },
  hotTopicsSection: {
    padding: 20,
    backgroundColor: "white",
    marginHorizontal: 10,
    marginTop: 12,
    borderRadius: 12,
  },
  hotTopicsTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  hotTopicsTitle: { fontWeight: "bold", fontSize: 16, color: "#4c1d95" },
  hotTopicsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hotTopic: {
    backgroundColor: "#E8DDFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  selectedTopic: { backgroundColor: "#B69EE5", color: "white" },
  hotTopicText: { color: "#5D3B94", fontSize: 13 },
  imageUploadPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  imageBox: {
    width: 100,
    height: 100,
    backgroundColor: "#E8DDFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    margin: 5,
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%" },
  deleteIcon: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    backgroundColor: "#0008",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#7c3aed",
  },
  submitContainer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#663399",
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
