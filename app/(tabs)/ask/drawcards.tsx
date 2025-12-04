import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from "../../lib/supabase";
// ★ 新增：AI 呼叫（請確認 app/lib/ai.ts 已建立並輸出 askTarotAI）
import { askTarotAI } from "../../lib/ai";

interface Card {
  id: number;
  code: string;
  name_zh: string;
  name_en: string;
  arcana: string;
  suit: string | null;
  number: number;
  image_url: string;
  meaning_upright: string;
  meaning_reversed: string;
  isFlipped: boolean;
  isReversed?: boolean; // 是否逆位
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function TarotScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const TAB_BAR_HEIGHT = 20;
  const { question } = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // 頁面狀態
  const [currentScreen, setCurrentScreen] = useState<'drawing' | 'chat'>('drawing');
  
  // 抽牌相關狀態
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
  const [cardFadeValues, setCardFadeValues] = useState<Animated.Value[]>([]);
  const [cardMoveValues, setCardMoveValues] = useState<{
    translateY: Animated.Value;
    scale: Animated.Value;
  }[]>([]);

  // 聊天相關狀態
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDrawnCard, setCurrentDrawnCard] = useState<Card | null>(null);
  const drawnCardOpacity = useRef(new Animated.Value(0)).current;
  const [errorText, setErrorText] = useState<string>("");

  // 從 Supabase 載入塔羅牌資料
  useEffect(() => {
    loadTarotCards();
  }, []);

  const loadTarotCards = async () => {
    try {
      setIsLoadingCards(true);
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('*')
        .in('arcana', ['major', 'minor'])
        .order('number', { ascending: true });

      if (error) {
        console.error('Error loading cards:', error);
        Alert.alert('錯誤', '無法載入塔羅牌資料');
        return;
      }

      if (data && data.length > 0) {
        const loadedCards = data.map((card: any) => ({
          ...card,
          isFlipped: false,
          isReversed: false,
        }));

        setCards(loadedCards);
        setAnimatedValues(Array.from({ length: loadedCards.length }, () => new Animated.Value(0)));
        setCardFadeValues(Array.from({ length: loadedCards.length }, () => new Animated.Value(1)));
        setCardMoveValues(Array.from({ length: loadedCards.length }, () => ({
          translateY: new Animated.Value(0),
          scale: new Animated.Value(1),
        })));
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('錯誤', '載入塔羅牌時發生錯誤');
    } finally {
      setIsLoadingCards(false);
    }
  };

  const handleCardPress = (cardId: number) => {
    if (selectedCards.length >= 3) {
      Alert.alert('提示', '最多只能選擇3張牌');
      return;
    }
  
    const cardIndex = cards.findIndex(card => card.id === cardId);
    const selectedCard = cards[cardIndex];
    if (selectedCard.isFlipped) return;

    // 隨機決定是否逆位（50%機率）
    const isReversed = Math.random() > 0.5;
  
    // 翻牌動畫
    Animated.timing(animatedValues[cardIndex], {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setCards(prev => prev.map(card =>
        card.id === cardId ? { ...card, isFlipped: true, isReversed } : card
      ));
  
      // 顯示抽出的牌（淡入效果）
      setCurrentDrawnCard({ ...selectedCard, isReversed });
      Animated.timing(drawnCardOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setSelectedCards(prev => [...prev, { ...selectedCard, isFlipped: true, isReversed }]);
      });
    });
  };

  const proceedToChat = () => {
    if (selectedCards.length === 0) {
      Alert.alert('提示', '請至少選擇一張牌');
      return;
    }
    setCurrentScreen('chat');
    setTimeout(() => { void sendInitialAiResponse(); }, 300);
  };

  // ★ 改為真正呼叫 AI（初次解牌）
  const sendInitialAiResponse = async () => {
    try {
      setIsLoading(true);
      setErrorText("");

      const payloadCards = selectedCards.map((c) => ({
        name: c.name_zh || c.name_en,  // 後端以 name 為主；中文或英文皆可
        position: c.isReversed ? 'reversed' : 'upright',
      }));

      const userQuestion = (question as string) || "（使用者未輸入問題）";
      const answer = await askTarotAI({
        question: userQuestion,
        cards: payloadCards,
        spread: selectedCards.length === 1 ? "單張" : "三張牌陣",
      });

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: answer ?? "（未取得內容）",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([aiMessage]);
      scrollToBottom();
    } catch (err: any) {
      setErrorText(err?.message ?? "AI 呼叫失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  // ★ 使用者追問 → 再呼叫 AI
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setErrorText("");

    try {
      const payloadCards = selectedCards.map((c) => ({
        name: c.name_zh || c.name_en,
        position: c.isReversed ? 'reversed' : 'upright',
      }));

      const answer = await askTarotAI({
        question: userMessage.text,   // 把追問當成新的 question
        cards: payloadCards,
        spread: selectedCards.length === 1 ? "單張" : "三張牌陣",
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer ?? "（未取得內容）",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
    } catch (err: any) {
      setErrorText(err?.message ?? "AI 呼叫失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const resetCards = () => {
    Alert.alert(
      '重新開始',
      '確定要重新抽牌嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          onPress: () => {
            setCards(prev => prev.map(card => ({ ...card, isFlipped: false, isReversed: false })));
            setSelectedCards([]);
            setMessages([]);
            setCurrentScreen('drawing');
            animatedValues.forEach(value => value.setValue(0));
            cardFadeValues.forEach(value => value.setValue(1));
            cardMoveValues.forEach(value => {
              value.translateY.setValue(0);
              value.scale.setValue(1);
            });
            setErrorText("");
          }
        }
      ]
    );
  };

  const quickQuestions = [
    "請幫我解釋得更詳細一些？",
    "這對我的感情有什麼影響？",
    "我應該如何行動？"
  ];

  // 載入中畫面
  if (isLoadingCards) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PURPLE.deep} />
        <Text style={{ marginTop: 16, color: PURPLE.textDark }}>載入塔羅牌中...</Text>
      </SafeAreaView>
    );
  }

  // 抽牌頁面渲染
  const renderDrawingScreen = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 80 }}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>請左右滑動抽取3張牌</Text>
          <Text style={styles.instructionSubtitle}>
            已選擇 {selectedCards.length}/3 張牌
          </Text>
          {question && (
            <Text style={styles.questionText}>問題：{String(question)}</Text>
          )}
        </View>
  
        {/* Horizontal Cards */}
        <View style={{ height: 200, paddingHorizontal: 16, marginBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cards.map((card, index) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(card.id)}
                activeOpacity={0.8}
                style={{
                  marginLeft: index === 0 ? 0 : -80,
                  width: 120,
                  height: 180,
                }}
              >
                <Animated.View
                  style={[
                    styles.card,
                    card.isFlipped && styles.cardFlipped,
                    {
                      opacity: cardFadeValues[index],
                      transform: [
                        {
                          rotateY: animatedValues[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '180deg'],
                          }),
                        },
                        {
                          translateY: cardMoveValues[index].translateY,
                        },
                        {
                          scale: cardMoveValues[index].scale,
                        }
                      ],
                    },
                  ]}
                >
                  {!card.isFlipped ? (
                    <View style={styles.cardBack}>
                      <Ionicons
                        name="star-outline"
                        size={40}
                        color={PURPLE.cardStar}
                      />
                    </View>
                  ) : (
                    <View style={styles.cardFront}>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={styles.cardImagePlaceholder}>
                          <View
                            style={{
                              width: 105,
                              height: 180,
                              borderRadius: 12,
                              overflow: 'hidden',
                              backgroundColor: PURPLE.cardFront,
                              justifyContent: 'center',
                              alignItems: 'center',
                              transform: card.isReversed ? [{ rotate: '180deg' }] : undefined,
                            }}
                          >
                            <Image
                              source={{ uri: card.image_url }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
  
        {/* Selected Cards Display */}
        {selectedCards.length > 0 && (
          <View style={styles.selectedCardsContainer}>
            <Text style={styles.selectedTitle}>已選擇的牌：</Text>
            <View style={styles.selectedCards}>
              {selectedCards.map((card) => (
                <View key={`selected-${card.id}`} style={styles.selectedCardContainer}>
                  <View style={styles.selectedCardImageContainer}>
                    <Image
                      source={{ uri: card.image_url }}
                      style={styles.selectedCardMini}
                      resizeMode="cover"
                    />
                    <Text style={styles.selectedCardName}>
                      {card.name_zh}
                      {card.isReversed && ' (逆位)'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: PURPLE.bg }}>
          <TouchableOpacity
            style={[
              styles.proceedBtn,
              selectedCards.length === 0 && styles.proceedBtnDisabled
            ]}
            onPress={proceedToChat}
            disabled={selectedCards.length === 0}
          >
            <Text style={[
              styles.proceedBtnText,
              selectedCards.length === 0 && styles.proceedBtnTextDisabled
            ]}>
              開始AI解牌
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
  
  // 聊天頁面渲染
  const renderChatScreen = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + 10 : 0}
    >
      <View style={{ flex: 1 }}>
        {/* Selected Cards Summary */}
        <View style={styles.cardsSummary}>
          <TouchableOpacity onPress={resetCards} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={PURPLE.textDark} />
          </TouchableOpacity>
          <View style={styles.cardsSummaryTitleWrapper}>
            <Text style={styles.cardsSummaryTitle}>你抽到的牌：</Text>
            <View style={styles.summaryCards}>
              {selectedCards.map((card) => (
                <View key={`summary-${card.id}`} style={styles.summaryCardContainer}>
                  <Image
                    source={{ uri: card.image_url }}
                    style={styles.selectedCardMini}
                    resizeMode="cover"
                  />
                  <Text style={styles.summaryCardName}>
                    {card.name_zh}
                    {card.isReversed && '\n(逆位)'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            ...styles.messagesContent,
            paddingBottom: 50,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessageContainer : styles.aiMessageContainer
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                  {message.text}
                </Text>
              </View>
              {!message.isUser && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color={PURPLE.white} />
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={[styles.messageBubble, styles.aiMessage, styles.loadingMessage]}>
                <Text style={styles.loadingText}>AI正在思考中...</Text>
              </View>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color={PURPLE.white} />
              </View>
            </View>
          )}

          {!!errorText && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={[styles.messageBubble, styles.aiMessage]}>
                <Text style={[styles.messageText, styles.aiMessageText]}>
                  {errorText}
                </Text>
              </View>
              <View style={styles.aiAvatar}>
                <Ionicons name="alert" size={16} color={PURPLE.white} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions + Input */}
        <View style={{ backgroundColor: PURPLE.white, paddingBottom: insets.bottom + TAB_BAR_HEIGHT }}>
          {!isLoading && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickQuestionsContainer}
            >
              {quickQuestions.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickQuestion}
                  onPress={() => setInputText(q)}
                >
                  <Text style={styles.quickQuestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="輸入你的問題..."
              placeholderTextColor={PURPLE.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? PURPLE.white : PURPLE.textLight}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* 抽到的牌動畫顯示層 */}
      {currentDrawnCard && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 10,
          }}
          onPress={() => {
            Animated.timing(drawnCardOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }).start(() => {
              setCurrentDrawnCard(null);
              drawnCardOpacity.setValue(0);
            });
          }}
        >
          <Animated.View
            style={{
              width: 250,
              alignItems: 'center',
              opacity: drawnCardOpacity,
            }}
          >
            {/* 卡片圖片 */}
            <View
              style={{
                width: 250,
                height: 430,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: PURPLE.cardFront,
                justifyContent: 'center',
                alignItems: 'center',
                transform: currentDrawnCard.isReversed ? [{ rotate: '180deg' }] : undefined,
              }}
            >
              <Image
                source={{ uri: currentDrawnCard.image_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>

            {/* 卡片下方文字 */}
            <View style={{ marginTop: 12, alignItems: 'center', flexShrink: 0 }}>
              <Text style={styles.cardName}>
                {currentDrawnCard.name_zh}
                {currentDrawnCard.isReversed && ' (逆位)'}
              </Text>
              <Text style={styles.cardDescription}>
                {currentDrawnCard.isReversed 
                  ? currentDrawnCard.meaning_reversed 
                  : currentDrawnCard.meaning_upright}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      )}

      {currentScreen === 'drawing' ? renderDrawingScreen() : renderChatScreen()}
    </SafeAreaView>
  );
}

const PURPLE = {
  bg: '#F2EAFE',
  panel: '#E9D7FF',
  deep: '#8E6DE6',
  white: '#FFFFFF',
  textDark: '#4B347C',
  textLight: '#8B80A6',
  cardBack: '#6B46C1',
  cardStar: '#C4B5FD',
  cardFront: '#FFFFFF',
  userMessage: '#8E6DE6',
  aiMessage: '#E9D7FF',
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PURPLE.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PURPLE.textDark,
  },
  instructionCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PURPLE.textDark,
    marginBottom: 4,
  },
  instructionSubtitle: {
    fontSize: 14,
    color: PURPLE.textLight,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: PURPLE.textDark,
    textAlign: 'center',
    backgroundColor: PURPLE.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '30%',
    aspectRatio: 0.7,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    borderColor: 'rgba(0,0,0,0.1)',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: PURPLE.cardFront,
  },
  cardBack: {
    flex: 1,
    backgroundColor: PURPLE.cardBack,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardFront: {
    flex: 1,
    backgroundColor: PURPLE.cardFront,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 15,
    color: PURPLE.white,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedCardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE.textDark,
    marginBottom: 8,
  },
  selectedCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedCard: {
    backgroundColor: PURPLE.deep,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedCardContainer: {
    alignItems: 'center',
  },
  selectedCardImageContainer: {
    alignItems: 'center',
  },
  selectedCardMini: {
    width: 40,
    height: 60,
    backgroundColor: PURPLE.deep,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedCardName: {
    color: PURPLE.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  proceedBtn: {
    backgroundColor: PURPLE.deep,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PURPLE.deep,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  proceedBtnDisabled: {
    backgroundColor: PURPLE.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedBtnText: {
    color: PURPLE.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  proceedBtnTextDisabled: {
    color: PURPLE.white,
    opacity: 0.7,
  },
  chatContainer: {
    flex: 1,
  },
  cardsSummary: {
    backgroundColor: PURPLE.panel,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardsSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE.textDark,
    marginBottom: 8,
  },
  cardsSummaryTitleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  summaryCardContainer: {
    alignItems: 'center',
  },
  summaryCardMini: {
    width: 30,
    height: 45,
    backgroundColor: PURPLE.deep,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  summaryCard: {
    backgroundColor: PURPLE.deep,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryCardName: {
    color: PURPLE.white,
    fontSize: 12,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: PURPLE.userMessage,
    marginLeft: 40,
  },
  aiMessage: {
    backgroundColor: PURPLE.aiMessage,
    marginRight: 40,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: PURPLE.white,
  },
  aiMessageText: {
    color: PURPLE.textDark,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PURPLE.deep,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 4,
  },
  loadingMessage: {
    opacity: 0.8,
  },
  loadingText: {
    color: PURPLE.textLight,
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickQuestion: {
    backgroundColor: PURPLE.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: PURPLE.panel,
  },
  quickQuestionText: {
    color: PURPLE.textDark,
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PURPLE.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 2,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: PURPLE.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 15,
    color: PURPLE.textDark,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PURPLE.deep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: PURPLE.panel,
  },
});