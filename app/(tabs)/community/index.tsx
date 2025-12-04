import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Post {
  postid: number;
  user_id: string;
  user: string;
  avatar?: string;
  created_at: string;
  content: string;
  attachments: string[];
  likes: number;
  comments: number;
  shares: number;
  tags: string[];
  zodiacs: string[];
  privacy: string;
}

export default function CommunityIndex() {
  const router = useRouter();
  const { tag } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("熱門");
  const [selectedTag, setSelectedTag] = useState<string | null>(
    tag ? String(tag) : null
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const tabs = ["熱門", "最新", "關注", "我的星座"];

  // ✅ 取得登入使用者
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  // ✅ 讀取貼文
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
    .from("CommunityIndex")
    .select(`
      *,
      users (
        username,
        avatar
      )
    `)
    .order("created_at", { ascending: false });

    if (error) {
      console.error("讀取貼文失敗:", error);
    } else {
      const parsed = (data || []).map((post: any) => ({
        ...post,
        user: post.users?.username || post.user || "匿名使用者",
        avatar: post.users?.avatar || post.avatar || "https://placehold.co/40x40",
        tags:
          typeof post.tags === "string"
            ? (() => {
                try {
                  return JSON.parse(post.tags);
                } catch {
                  return [];
                }
              })()
            : Array.isArray(post.tags)
            ? post.tags
            : [],
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
      setPosts(parsed as Post[]);
    }
    setLoading(false);
  };

  // ✅ 下拉更新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // ✅ 初始化與即時更新
  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel("community-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "CommunityIndex" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (tag) setSelectedTag(String(tag));
  }, [tag]);

  const handleTagPress = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const isVisible = (post: Post) => {
    if (!selectedTag) return true;
    const tags = Array.isArray(post.tags) ? post.tags : [];
    return tags.includes(selectedTag);
  };

  // ✅ 點擊貼文跳轉
  const handlePostClick = (postid: number) => {
    if (postid) {
      router.push({
        pathname: `/community/[post]`,
        params: { postid: postid.toString() },
      });
    }
  };

  // ✅ 點擊「更多」按鈕
  const handleMorePress = (postid: number) => {
    Alert.alert(
      "管理貼文",
      "請選擇要執行的操作",
      [
        {
          text: "編輯貼文",
          onPress: () =>
            router.push({
              pathname: `/community/[post]`,
              params: { postid: postid.toString(), edit: "true" }, // ✅ 傳 edit=true
            }),
        },
        {
          text: "刪除貼文",
          style: "destructive",
          onPress: () => handleDeletePost(postid),
        },
        { text: "取消", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // ✅ 刪除貼文
  const handleDeletePost = async (postid: number) => {
    Alert.alert("確認刪除", "確定要刪除此貼文嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("CommunityIndex")
            .delete()
            .eq("postid", postid);

          if (error) {
            Alert.alert("刪除失敗", error.message);
          } else {
            Alert.alert("已刪除", "貼文已成功刪除");
            fetchPosts();
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 搜尋列 */}
      <View style={styles.searchBarBack}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="搜尋星座、話題..."
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={styles.tabWrapper}
          >
            <Text style={[styles.tab, activeTab === tab && styles.activeTab]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 貼文清單 */}
      <ScrollView
        contentContainerStyle={styles.scrollArea}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#6b21a8"
            style={{ marginTop: 20 }}
          />
        ) : posts.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>
            暫無貼文
          </Text>
        ) : (
          posts
            .filter((post) => isVisible(post))
            .map((post) => (
              <TouchableOpacity
                key={post.postid}
                style={styles.postCard}
                onPress={() => handlePostClick(post.postid)}
                activeOpacity={0.9}
              >
                {/* Header */}
                <View style={styles.postHeader}>
                  <Image
                    source={{
                      uri: post.avatar || "https://placehold.co/40x40?text=U",
                    }}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.username}>
                      {post.user || "匿名使用者"}
                    </Text>
                    <Text style={styles.postTime}>
                      {new Date(post.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {/* 🔹 只有自己的貼文才顯示更多按鈕 */}
                  {post.user_id === currentUserId && (
                    <TouchableOpacity
                      onPress={() => handleMorePress(post.postid)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {post.tags.map((tag, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.tag,
                          selectedTag === tag && styles.activeTagBox,
                        ]}
                        onPress={() => handleTagPress(tag)}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            selectedTag === tag && styles.activeTagText,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Content */}
                <Text style={styles.postContent}>{post.content}</Text>

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <View style={styles.mediaRow}>
                    {post.attachments.map((file: string, idx: number) =>
                      file.endsWith(".mp4") ? (
                        <Video
                          key={idx}
                          source={{ uri: file }}
                          style={styles.media}
                          useNativeControls
                          resizeMode={ResizeMode.COVER}
                        />
                      ) : (
                        <Image
                          key={idx}
                          source={{ uri: file }}
                          style={styles.media}
                          resizeMode="cover"
                        />
                      )
                    )}
                  </View>
                )}

                {/* Footer */}
                <Text style={styles.postFooter}>
                  {post.likes} 讚 ・ {post.comments} 留言 ・ {post.shares} 儲存
                </Text>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      {/* 新增貼文按鈕 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/community/uploadPost")}
        activeOpacity={0.85}
      >
        <FontAwesome name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  scrollArea: { paddingBottom: 100 },
  searchBarBack: { backgroundColor: "white" },
  searchBar: {
    flexDirection: "row",
    margin: 16,
    padding: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  searchIcon: { marginRight: 8 },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#ddd6fe",
    justifyContent: "space-around",
    paddingBottom: 5,
  },
  tabWrapper: { flex: 1, alignItems: "center" },
  tab: { fontSize: 14, color: "#a78bfa", paddingVertical: 8 },
  activeTab: {
    fontWeight: "bold",
    color: "#6b21a8",
    borderBottomWidth: 2,
    borderColor: "#6b21a8",
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 16,
    margin: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  tag: {
    backgroundColor: "#E9D5FF",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: { fontSize: 12, color: "#6B21A8" },
  activeTagBox: { backgroundColor: "#6B21A8" },
  activeTagText: { color: "white" },
  mediaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10,
  },
  media: { width: 120, height: 120, borderRadius: 8, marginBottom: 10 },
  username: { fontWeight: "600", color: "#4c1d95", fontSize: 14 },
  postTime: { fontSize: 12, color: "#9ca3af" },
  postContent: { fontSize: 14, color: "#1f2937", marginVertical: 8 },
  postFooter: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  addButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    backgroundColor: "#663399",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
});