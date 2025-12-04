import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { askFortuneAI } from "../../lib/ai";

const PURPLE = {
  bg: '#f5f3ff',
  panel: '#E9D7FF',
  deep: '#8E6DE6',
  textDark: '#4B347C',
  textLight: '#8B80A6',
  userBubble: '#8E6DE6',
  aiBubble: '#FFFFFF',
};


interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface FortuneData {
  lot_number: number;
  title: string;
  poem: string;
  meaning: string;
}

export default function DeepReadingChat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lotId = params.lotId ? Number(params.lotId) : null;
  const initialQuestion = params.question as string;

  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingFortune, setIsLoadingFortune] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
    // 🔑 獲取當前用戶 ID
    useEffect(() => {
      const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          console.log('👤 當前用戶:', user.id);
        } else {
          console.warn('⚠️ 未登入');
          // 可選：導向登入頁
          // router.replace('/login');
        }
      };
      
      getCurrentUser();
    }, []);
      // 載入籤詩資料
  useEffect(() => {
    if (lotId) {
      fetchFortune(lotId);
    }
  }, [lotId]);

    // 自動發送初始問題或載入現有會話
    useEffect(() => {
      const existingSessionId = params.sessionId as string;
      
      if (!currentUserId) {
        // 等待獲取用戶 ID
        return;
      }
      
      if (existingSessionId) {
        // 載入現有聊天記錄
        setSessionId(existingSessionId);
        loadExistingSession(existingSessionId);
      } else if (fortune && initialQuestion && messages.length === 0) {
        // 新聊天室：創建 session 並發送第一條訊息
        createChatSession().then(newSessionId => {
          if (newSessionId) {
            handleSend(initialQuestion);
          }
        });
      }
    }, [fortune, initialQuestion, params.sessionId, currentUserId]);
  
    const fetchFortune = async (id: number) => {
      setIsLoadingFortune(true);
      try {
        const { data, error } = await supabase
          .from('fortune_poems')
          .select('*')
          .eq('lot_number', id)
          .limit(1);
  
        if (error) {
          console.error('獲取籤詩失敗:', error);
          return;
        }
  
        if (data && data.length > 0) {
          setFortune(data[0]);
        }
      } catch (err) {
        console.error('載入籤詩異常:', err);
      } finally {
        setIsLoadingFortune(false);
      }
    };
  
    // 🔑 創建聊天室（綁定用戶）
    const createChatSession = async () => {
      if (!currentUserId || !fortune) {
        console.error('❌ 缺少必要資訊');
        return null;
      }
      
      try {
        console.log('📝 創建新聊天室...', {
          userId: currentUserId,
          lotNumber: fortune.lot_number,
        });
  
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: currentUserId, // 🔑 綁定當前用戶
            lot_id: fortune.id,
            lot_number: fortune.lot_number,
            lot_title: fortune.title,
            initial_question: initialQuestion || '請幫我深度解讀籤詩',
          })
          .select()
          .single();
  
        if (error) {
          console.error('❌ 創建聊天室失敗:', error);
          throw error;
        }
        
        console.log('✅ 聊天室創建成功:', data.id);
        setSessionId(data.id);
        return data.id;
      } catch (error) {
        console.error('❌ 創建聊天室異常:', error);
        return null;
      }
    };
  
    // 保存訊息
    const saveMessage = async (role: 'user' | 'ai', content: string, currentSessionId: string) => {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            role,
            content,
          });
  
        if (error) throw error;
  
        // 更新 session 的時間戳
        await supabase
          .from('chat_sessions')
          .update({
            updated_at: new Date().toISOString(),
            message_count: messages.length + 1,
          })
          .eq('id', currentSessionId);
  
        console.log('💾 訊息已保存');
      } catch (error) {
        console.error('❌ 保存訊息失敗:', error);
      }
    };
  
    // 載入現有會話
    const loadExistingSession = async (existingSessionId: string) => {
      try {
        console.log('📂 載入現有會話:', existingSessionId);
        
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', existingSessionId)
          .order('created_at', { ascending: true });
  
        if (error) throw error;
  
        if (data) {
          const loadedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(loadedMessages);
          console.log('✅ 已載入', loadedMessages.length, '條訊息');
        }
      } catch (error) {
        console.error('❌ 載入聊天記錄失敗:', error);
      }
    };
  
    const callFortuneAI = async (userMessage: string): Promise<string> => {
      if (!fortune) {
        return '無法取得籤詩資料，請重新抽籤。';
      }
  
      const payload = {
        text: fortune.poem,
        grade: "深度解讀",
        number: `第${fortune.lot_number}籤`,
        title: fortune.title,
        meaning: fortune.meaning,
        question: userMessage,
      };
  
      try {
        console.log('📞 正在呼叫後端 AI 服務 (OpenAI)...');
        const aiResponse = await askFortuneAI(payload);
        console.log('✅ 後端 AI 回應成功');
        return aiResponse;
      } catch (error: any) {
        console.error('❌ 後端 AI 呼叫錯誤:', error);
        return `抱歉，後端 AI 服務暫時無法使用：\n\n${error.message}\n\n您可以參考基礎解籤內容。`;
      }
    };
  
    const handleSend = async (text?: string) => {
      const messageText = text || inputText.trim();
      if (!messageText || loading || !currentUserId) return;
  
      // 如果還沒有 sessionId，先創建
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await createChatSession();
        if (!currentSessionId) {
          console.error('❌ 無法創建聊天室');
          return;
        }
      }
  
      // 添加用戶消息
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: messageText,
        timestamp: new Date(),
      };
  
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setLoading(true);
  
      // 💾 保存用戶訊息
      await saveMessage('user', messageText, currentSessionId);
  
      try {
        const aiResponse = await callFortuneAI(messageText);
  
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: aiResponse,
          timestamp: new Date(),
        };
  
        setMessages(prev => [...prev, aiMessage]);
        
        // 💾 保存 AI 回覆
        await saveMessage('ai', aiResponse, currentSessionId);
        
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('發送消息失敗:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: '抱歉，發生了一些問題，請稍後再試。',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <View style={styles.messageHeader}>
          <Text style={[styles.messageRole, isUser && { color: 'rgba(255,255,255,0.8)' }]}>
            {isUser ? '🙏 您' : '🔮 解籤大師'}
          </Text>
        </View>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  if (isLoadingFortune) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: '深度解籤', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PURPLE.deep} />
          <Text style={styles.loadingText}>正在載入籤詩...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!fortune) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: '深度解籤', headerShown: true }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>無法載入籤詩資料</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `第${fortune.lot_number}籤 - 深度解籤`,
          headerShown: true 
        }} 
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* 籤詩摘要卡片 */}
        <View style={styles.fortuneCard}>
          <Text style={styles.fortuneTitle}>第{fortune.lot_number}籤 · {fortune.title}</Text>
          <Text style={styles.fortunePoem}>{fortune.poem}</Text>
        </View>

        {/* 聊天訊息列表 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>🔮 歡迎使用 AI 深度解籤</Text>
              <Text style={styles.emptySubtext}>請輸入您的問題，讓解籤大師為您指點迷津</Text>
            </View>
          }
        />

        {/* 載入指示器 */}
        {loading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={PURPLE.deep} />
            <Text style={styles.loadingIndicatorText}>解籤大師思考中...</Text>
          </View>
        )}

        {/* 輸入框 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="輸入您的問題..."
            placeholderTextColor={PURPLE.textLight}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: PURPLE.textDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: PURPLE.textDark,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: PURPLE.deep,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fortuneCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fortuneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PURPLE.textDark,
    marginBottom: 8,
  },
  fortunePoem: {
    fontSize: 14,
    color: PURPLE.textLight,
    lineHeight: 20,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: PURPLE.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: PURPLE.textLight,
    textAlign: 'center',
  },
  messageBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: PURPLE.userBubble,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: PURPLE.aiBubble,
    borderWidth: 1,
    borderColor: PURPLE.panel,
  },
  messageHeader: {
    marginBottom: 4,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    color: PURPLE.textLight,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: PURPLE.textDark,
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  loadingIndicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: PURPLE.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PURPLE.panel,
    marginBottom:50
  },
  input: {
    flex: 1,
    backgroundColor: PURPLE.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: PURPLE.textDark,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 20,
  },
});
