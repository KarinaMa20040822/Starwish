import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function FavoritePostsPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // 🔁 撈取收藏紀錄
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .select(
        `
        id, post_id, created_at,
        CommunityIndex (
          postid, user, avatar, content, attachments, created_at, shares
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped = data.map((fav: any) => ({
        ...fav,
        CommunityIndex: {
          ...fav.CommunityIndex,
          attachments:
            typeof fav.CommunityIndex.attachments === "string"
              ? JSON.parse(fav.CommunityIndex.attachments || "[]")
              : fav.CommunityIndex.attachments || [],
        },
      }));
      setFavorites(mapped);
    }
    setLoading(false);
  };

  // ❌ 取消收藏（同時更新 CommunityIndex.shares）
  const handleRemove = async (favId: string) => {
    const target = favorites.find((f) => f.id === favId);
    if (!target || !target.CommunityIndex) return;

    const postid = target.CommunityIndex.postid;

    // 1️⃣ 刪除 saved_posts
    const { error } = await supabase.from("saved_posts").delete().eq("id", favId);
    if (error) {
      console.error("取消收藏失敗:", error);
      return;
    }

    // 2️⃣ 取得目前收藏數
    const { data: postData } = await supabase
      .from("CommunityIndex")
      .select("shares")
      .eq("postid", postid)
      .single();

    const currentShares = postData?.shares || 0;
    const newShares = Math.max(currentShares - 1, 0);

    // 3️⃣ 更新 CommunityIndex 的 shares
    await supabase
      .from("CommunityIndex")
      .update({ shares: newShares })
      .eq("postid", postid);

    // 4️⃣ 更新前端畫面
    setFavorites((prev) =>
      prev
        .filter((f) => f.id !== favId)
        .map((f) =>
          f.CommunityIndex.postid === postid
            ? { ...f, CommunityIndex: { ...f.CommunityIndex, shares: newShares } }
            : f
        )
    );
  };

  // ✅ 點擊貼文導向 [post]
  const handleOpenPost = (postid: number) => {
    router.push({
      pathname: "/(tabs)/community/[post]",
      params: { postid: postid.toString(), from: "savehistory" },
    });
  };

  const filtered = favorites.filter((fav) =>
    fav.CommunityIndex?.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.page}>
      {/* 搜尋框 */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="搜尋收藏的貼文"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.count}>共 {filtered.length} 則收藏貼文</Text>

      <ScrollView contentContainerStyle={styles.postList}>
        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>載入中...</Text>
        ) : filtered.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>尚無收藏紀錄</Text>
        ) : (
          filtered.map((fav) => {
            const post = fav.CommunityIndex;
            return (
              <TouchableOpacity
                key={fav.id}
                style={styles.postCard}
                activeOpacity={0.9}
                onPress={() => handleOpenPost(post.postid)}
              >
                {/* 作者頭像 */}
                <View style={styles.avatarRow}>
                  <Image
                    source={{ uri: post.avatar || "https://placehold.co/40x40" }}
                    style={styles.avatar}
                  />
                  <View style={styles.info}>
                    <Text style={styles.author}>{post.user}</Text>
                    <Text style={styles.time}>
                      {new Date(post.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {/* 取消收藏按鈕 */}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPressIn={(e) => e.stopPropagation()}
                    onPress={() => handleRemove(fav.id)}
                  >
                    <Text style={styles.removeText}>取消收藏</Text>
                  </TouchableOpacity>
                </View>

                {/* 貼文內容 */}
                <Text style={styles.text}>{post.content}</Text>

                {/* ✅ 附件圖片（可正常顯示且不跑版） */}
                {post.attachments?.length > 0 && (
                  <View style={styles.imageContainer}>
                    {post.attachments.map((img: string, idx: number) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={styles.imageThumb}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f3ff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 16,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  count: { textAlign: "right", marginRight: 20, color: "#813da3", fontSize: 14 },
  postList: { paddingHorizontal: 16, paddingBottom: 20 },
  postCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  avatarRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  info: { flex: 1, flexDirection: "column" },
  author: { fontSize: 14, fontWeight: "600", color: "#333" },
  time: { fontSize: 12, color: "#999" },
  text: { fontSize: 14, color: "#333", marginBottom: 10 },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  imageThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  removeBtn: {
    backgroundColor: "#f87171",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeText: { color: "white", fontSize: 12, fontWeight: "600" },
});
