import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

interface ChatSession {
  id: string;
  lot_number: number;
  lot_title: string;
  initial_question: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview_message?: string; // 最後一條訊息預覽
}

const PURPLE = {
  bg: '#f5f3ff',
  card: '#FFFFFF',
  primary: '#9333ea',
  border: '#e9d5ff',
  textDark: '#111827',
  textGray: '#4b5563',
  textLight: '#9ca3af',
};

export default function DivinationHistory() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔑 獲取當前用戶
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        console.log('👤 當前用戶:', user.id);
      } else {
        console.warn('⚠️ 未登入');
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchChatSessions();
    }
  }, [currentUserId]);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, sessions]);

  // 獲取聊天記錄
  const fetchChatSessions = async () => {
    if (!currentUserId) {
      console.warn('⚠️ 用戶未登入，無法獲取聊天記錄');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📂 獲取用戶聊天記錄:', currentUserId);

      // 🔑 只查詢當前用戶的聊天室
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (sessionsData) {
        console.log('✅ 獲取到', sessionsData.length, '個聊天記錄');
        // 為每個 session 獲取最後一條訊息作為預覽
        const sessionsWithPreview = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: lastMessage } = await supabase
              .from('chat_messages')
              .select('content, role')
              .eq('session_id', session.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            return {
              ...session,
              preview_message: lastMessage?.content || session.initial_question,
            };
          })
        );

        setSessions(sessionsWithPreview);
        setFilteredSessions(sessionsWithPreview);
      }
    } catch (error) {
      console.error('獲取聊天記錄失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChatSessions();
    setRefreshing(false);
  };

  // 搜尋過濾
  const filterSessions = () => {
    if (!searchQuery.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = sessions.filter(
      (session) =>
        session.lot_title.toLowerCase().includes(query) ||
        session.initial_question.toLowerCase().includes(query) ||
        session.lot_number.toString().includes(query) ||
        session.preview_message?.toLowerCase().includes(query)
    );
    setFilteredSessions(filtered);
  };

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 點擊卡片進入聊天室
  const handleSessionPress = (session: ChatSession) => {
    router.push({
      pathname: '../ask/chat',
      params: {
        sessionId: session.id,
        lotId: session.lot_number.toString(),
      },
    });
  };

  // 刪除聊天記錄
  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      // 更新本地狀態
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (error) {
      console.error('刪除聊天記錄失敗:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE.primary} />
        <Text style={styles.loadingText}>載入中...</Text>
      </View>
    );
  }

  // 🔒 未登入狀態
  if (!currentUserId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={PURPLE.border} />
          <Text style={styles.emptyText}>請先登入</Text>
          <Text style={styles.emptySubtext}>登入後即可查看您的解籤記錄</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#aaa" style={styles.searchIcon} />
        <TextInput
          placeholder="搜尋運勢記錄..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {/* Records List */}
      <View style={styles.recordList}>
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={PURPLE.border} />
            <Text style={styles.emptyText}>
              {searchQuery ? '沒有找到相關記錄' : '還沒有任何解籤記錄'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? '試試其他關鍵字' : '開始抽籤來獲取運勢指引吧！'}
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.recordCard}
              onPress={() => handleSessionPress(session)}
              activeOpacity={0.7}
            >
              <View style={styles.recordHeader}>
                <View style={styles.recordTitleContainer}>
                  <Text style={styles.lotBadge}>第{session.lot_number}籤</Text>
                  <Text style={styles.recordTitle}>{session.lot_title}</Text>
                </View>
                <View style={styles.recordMeta}>
                  <Text style={styles.recordTime}>
                    {formatTime(session.updated_at)}
                  </Text>
                  {/* 刪除按鈕 */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.recordContent} numberOfLines={2}>
                {session.preview_message}
              </Text>

              <View style={styles.recordFooter}>
                <View style={styles.recordTags}>
                  <View style={styles.tag}>
                    <Ionicons name="chatbubble-outline" size={12} color={PURPLE.primary} />
                    <Text style={styles.tagText}>{session.message_count} 則對話</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>深度解籤</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PURPLE.textLight} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PURPLE.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PURPLE.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: PURPLE.textGray,
  },
  searchBar: {
    backgroundColor: PURPLE.card,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PURPLE.textDark,
  },
  recordList: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: PURPLE.textGray,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: PURPLE.textLight,
    marginTop: 8,
  },
  recordCard: {
    backgroundColor: PURPLE.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lotBadge: {
    backgroundColor: PURPLE.primary,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recordTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: PURPLE.textDark,
  },
  recordMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordTime: {
    fontSize: 12,
    color: PURPLE.textLight,
  },
  deleteButton: {
    padding: 4,
  },
  recordContent: {
    fontSize: 13,
    color: PURPLE.textGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PURPLE.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PURPLE.border,
  },
  tagText: {
    color: PURPLE.primary,
    fontSize: 11,
    fontWeight: '500',
  },
});