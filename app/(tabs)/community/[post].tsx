import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import * as ImagePicker from "expo-image-picker"; // 🟣 新增
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

interface Comment {
  id: string;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  avatar?: string;
}

export default function Post() {
  const { post, postid } = useLocalSearchParams();
  const realPostId = Number(postid || post);
  const router = useRouter();
  const insets = useSafeAreaInsets();


  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [postData, setPostData] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editAttachments, setEditAttachments] = useState<string[]>([]); // 🟣 新增
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isActionLocked, setIsActionLocked] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height - insets.bottom);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const getCurrentUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const handleGoBack = () => {
    router.replace("/(tabs)/community");
  };

  useEffect(() => {
    if (!realPostId || isNaN(realPostId)) return;

    const fetchData = async () => {
      setLoading(true);
      const uid = await getCurrentUserId();
      setCurrentUserId(uid);

      const { data: postData, error: postErr } = await supabase
      .from("CommunityIndex")
      .select(`
        *,
        users (
          username,
          avatar
        )
      `)
      .eq("postid", realPostId)
      .single();

      if (postErr) {
        console.error("撈取貼文錯誤：", postErr.message);
        setLoading(false);
        return;
      }

      let attachments: string[] = [];
      try {
        attachments =
          typeof postData.attachments === "string"
            ? JSON.parse(postData.attachments || "[]")
            : postData.attachments || [];
      } catch {
        attachments = [];
      }

      setPostData({ 
        ...postData, 
        attachments,
        user: postData.users?.username || postData.user || "匿名使用者",
        avatar: postData.users?.avatar || postData.avatar || "https://placehold.co/40x40"
      });
      setEditContent(postData.content);
      setEditAttachments(attachments); // 🟣 新增

      const { data: commentsData } = await supabase
        .from("comments")
        .select(
          `
          id, post_id, user_id, content, created_at,
          users ( username, avatar, email )
        `
        )
        .eq("post_id", realPostId)
        .order("created_at", { ascending: false });

      if (commentsData) {
        setComments(
          commentsData.map((c: any) => ({
            ...c,
            username: c.users?.username || c.users?.email,
            avatar: c.users?.avatar || "https://placehold.co/40x40",
          }))
        );
      }

      if (uid) {
        const { data: liked } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", realPostId)
          .eq("user_id", uid)
          .maybeSingle();
        setIsLiked(!!liked);

        const { data: saved } = await supabase
          .from("saved_posts")
          .select("id")
          .eq("post_id", realPostId)
          .eq("user_id", uid)
          .maybeSingle();
        setIsSaved(!!saved);
      }

      setLoading(false);
    };

    fetchData();
  }, [realPostId]);

  // 🟣 新增：挑選圖片
  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets.map((a) => a.uri);
      setEditAttachments((prev) => [...prev, ...selected]);
    }
  };

  // 🟣 新增：刪除圖片
  const removeImage = (index: number) => {
    setEditAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    if (!currentUserId) return alert("請先登入");

    const { data, error } = await supabase
      .from("comments")
      .insert([{ post_id: realPostId, user_id: currentUserId, content: newComment }])
      .select(
        `
        id, post_id, user_id, content, created_at,
        users ( username, avatar, email )
      `
      );

    if (error) return alert("留言失敗：" + error.message);

    if (data && data.length > 0) {
      const c = data[0];
      const newComments = [
        {
          ...c,
          username: c.users?.username || c.users?.email,
          avatar: c.users?.avatar || "https://placehold.co/40x40",
        },
        ...comments,
      ];
      setComments(newComments);
      setNewComment("");
      Keyboard.dismiss();

      const newCount = (postData.comments || 0) + 1;
      setPostData((prev: any) => ({ ...prev, comments: newCount }));
      await supabase.from("CommunityIndex").update({ comments: newCount }).eq("postid", realPostId);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return alert("請先登入");
    if (isActionLocked) return;
    setIsActionLocked(true);

    const newState = !isLiked;
    setIsLiked(newState);

    if (newState) {
      await supabase.from("post_likes").insert([{ post_id: realPostId, user_id: currentUserId }]);
      const newLikes = (postData.likes || 0) + 1;
      setPostData((prev: any) => ({ ...prev, likes: newLikes }));
      await supabase.from("CommunityIndex").update({ likes: newLikes }).eq("postid", realPostId);
    } else {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", realPostId)
        .eq("user_id", currentUserId);
      const newLikes = Math.max((postData.likes || 1) - 1, 0);
      setPostData((prev: any) => ({ ...prev, likes: newLikes }));
      await supabase.from("CommunityIndex").update({ likes: newLikes }).eq("postid", realPostId);
    }

    setIsActionLocked(false);
  };

  const handleSave = async () => {
    if (!currentUserId) return alert("請先登入");
    if (isActionLocked) return;
    setIsActionLocked(true);

    const { data: existing } = await supabase
      .from("saved_posts")
      .select("id")
      .eq("post_id", realPostId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from("saved_posts").delete().eq("id", existing.id);
      const newShares = Math.max((postData.shares || 1) - 1, 0);
      setPostData((prev: any) => ({ ...prev, shares: newShares }));
      await supabase.from("CommunityIndex").update({ shares: newShares }).eq("postid", realPostId);
      setIsSaved(false);
    } else {
      await supabase.from("saved_posts").insert([{ post_id: realPostId, user_id: currentUserId }]);
      const newShares = (postData.shares || 0) + 1;
      setPostData((prev: any) => ({ ...prev, shares: newShares }));
      await supabase.from("CommunityIndex").update({ shares: newShares }).eq("postid", realPostId);
      setIsSaved(true);
    }

    setIsActionLocked(false);
  };

  // ✅ 儲存編輯
// ✅ 儲存編輯
  const handleEditPost = async () => {
    if (!editContent.trim()) return alert("內容不可為空");
    const { error } = await supabase
      .from("CommunityIndex")
      .update({
        content: editContent,
        attachments: editAttachments, // ✅ 不要 JSON.stringify
      })
      .eq("postid", realPostId);

    if (error) return alert("更新失敗：" + error.message);
    setPostData((prev: any) => ({ ...prev, content: editContent, attachments: editAttachments }));
    setIsEditing(false);
  };


  const handleDeletePost = async () => {
    Alert.alert("確認刪除", "確定要刪除此貼文嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          await supabase.from("comments").delete().eq("post_id", realPostId);
          await supabase.from("post_likes").delete().eq("post_id", realPostId);
          await supabase.from("saved_posts").delete().eq("post_id", realPostId);
          await supabase.from("CommunityIndex").delete().eq("postid", realPostId);
          alert("貼文已刪除");
          handleGoBack();
        },
      },
    ]);
  };

  if (loading)
    return <Text style={{ textAlign: "center", marginTop: 20 }}>載入中...</Text>;
  if (!postData)
    return <Text style={{ textAlign: "center", marginTop: 20 }}>貼文不存在</Text>;

  const isOwner = currentUserId === postData.user_id;

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={styles.postCard}>
          {/* Header */}
          <View style={styles.postHeader}>


            <Image
              source={{ uri: postData.avatar || "https://placehold.co/40x40" }}
              style={styles.avatar}
            />
            <View style={styles.postInfo}>
              <Text style={styles.username}>{postData.user}</Text>
              <Text style={styles.postTime}>
                {new Date(postData.created_at).toLocaleString()}
              </Text>
            </View>

            {isOwner && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                  <Text style={styles.editBtn}>{isEditing ? "取消" : "編輯"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePost}>
                  <Text style={styles.deleteBtn}>刪除</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content */}
          {isEditing ? (
            <>
              <TextInput
                style={styles.editInput}
                multiline
                value={editContent}
                onChangeText={setEditContent}
              />

              {/* 🟣 編輯圖片區 */}
              <View style={styles.mediaRow}>
                {editAttachments.map((file, idx) => (
                  <View key={idx}>
                    <TouchableOpacity onPress={() => removeImage(idx)}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#ef4444"
                        style={{ position: "absolute", top: -8, right: -8, zIndex: 1 }}
                      />
                      <Image source={{ uri: file }} style={styles.media} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={pickImages}
                  style={[
                    styles.media,
                    {
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#ede9fe",
                      borderWidth: 1,
                      borderColor: "#c4b5fd",
                    },
                  ]}
                >
                  <Ionicons name="add" size={28} color="#7c3aed" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleEditPost}>
                <Text style={{ color: "white" }}>✅ 儲存</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.postContent}>{postData.content}</Text>
              {postData.attachments?.length > 0 && (
                <View style={styles.mediaRow}>
                  {postData.attachments.map((file: string, idx: number) =>
                    file.endsWith(".mp4") ? (
                      <Video
                        key={idx}
                        source={{ uri: file }}
                        style={styles.media}
                        useNativeControls
                        resizeMode={ResizeMode.COVER}
                      />
                    ) : (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setCurrentIndex(idx);
                          setIsViewerVisible(true);
                        }}
                      >
                        <Image source={{ uri: file }} style={styles.media} />
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerItem} onPress={handleLike}>
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? "#e11d48" : "#6b7280"}
              />
              <Text style={styles.footerText}>{postData.likes || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => inputRef.current?.focus()}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
              <Text style={styles.footerText}>{postData.comments || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerItem} onPress={handleSave}>
              <FontAwesome
                name={isSaved ? "bookmark" : "bookmark-o"}
                size={22}
                color={isSaved ? "#7c3aed" : "#6b7280"}
              />
              <Text style={styles.footerText}>{postData.shares || 0}</Text>
            </TouchableOpacity>
          </View>

          {/* Comments */}
          <View style={styles.commentSection}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Image
                  source={{ uri: comment.avatar }}
                  style={[styles.avatar, { width: 30, height: 30 }]}
                />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.commentUser}>{comment.username}</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment input */}
      <View
        style={[
          styles.commentInputWrapper,
          { bottom: keyboardHeight > 0 ? keyboardHeight + 35 : insets.bottom + 52 },
        ]}
      >
        <View style={styles.commentInput}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="發表留言..."
            placeholderTextColor="#aaa"
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleCommentSubmit}>
            <Text style={{ color: "white", fontWeight: "bold" }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 圖片放大 */}
      <ImageViewing
        images={postData.attachments.map((file: string) => ({ uri: file }))}
        imageIndex={currentIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  postCard: { backgroundColor: "white", margin: 16, padding: 16, borderRadius: 16 },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 9999, marginRight: 12 },
  postInfo: { flex: 1 },
  username: { fontWeight: "bold", color: "#4c1d95", fontSize: 14 },
  postTime: { fontSize: 12, color: "#9ca3af" },
  postContent: { fontSize: 14, color: "#1f2937", marginVertical: 8 },
  editInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    minHeight: 60,
    marginBottom: 8,
  },
  saveBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#7c3aed",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mediaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 10 },
  media: { width: 120, height: 120, borderRadius: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 14, color: "#374151" },
  commentSection: { paddingTop: 12 },
  comment: { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  commentUser: { fontWeight: "600", color: "#6b21a8", fontSize: 13 },
  commentText: { fontSize: 13, color: "#1f2937" },
  commentTime: { fontSize: 11, color: "#9ca3af" },
  commentInputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 14 },
  sendBtn: {
    backgroundColor: "#9370DB",
    marginLeft: 8,
    borderRadius: 9999,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtn: {
    backgroundColor: "#c1a6fa",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "#f68181",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
