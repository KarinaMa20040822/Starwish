import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function CommunityScreen() {
  const router = useRouter();
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    
    // 检查是否输入了问题
    if (!trimmedQuestion) {
      Alert.alert('提示', '請輸入您想詢問的問題才能開始抽牌');
      return;
    }

    // 检查问题长度
    if (trimmedQuestion.length < 5) {
      Alert.alert('提示', '問題太短了，請輸入更詳細的問題（至少5個字）');
      return;
    }

    // 将问题传递给塔罗牌页面
    router.push({
      pathname: '/(tabs)/ask/drawcards', // 確保路徑是正確的
      params: { question: trimmedQuestion } // 傳遞參數
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Body */}
      <View style={styles.bodyCard}>
        <Text style={styles.sectionTitle}>你的問題是？</Text>
        <Text style={styles.subtitle}>請詳細描述您想詢問的問題，這將幫助塔羅牌為您提供更精準的指引</Text>

        <View style={styles.textAreaWrap}>
          <TextInput
            multiline
            placeholder="例如：我在感情上遇到了困難，不知道該如何選擇..."
            placeholderTextColor="#B3A8CC"
            style={styles.textArea}
            value={question}
            onChangeText={setQuestion}
            maxLength={500}
          />
          <View style={styles.charCount}>
            <Text style={styles.charCountText}>{question.length}/500</Text>
          </View>
        </View>

          <TouchableOpacity
               style={[
                 styles.primaryBtn,
                 !question.trim() && styles.primaryBtnDisabled
               ]}
               activeOpacity={0.7}
               disabled={!question.trim()}
               onPress={handleSubmit}
             >
               <Text
                 style={[
                   styles.primaryBtnText,
                   !question.trim() && styles.primaryBtnTextDisabled
                 ]}
               >
                 開始抽牌
               </Text>
             </TouchableOpacity>

        {/* 示例问题 */}
        <View style={styles.exampleContainer}>
          <Text style={styles.exampleTitle}>常見問題示例：</Text>
          {[
            '我的事業發展會如何？',
            '這段感情的未來走向如何？',
            '我應該如何面對目前的困境？',
            '什麼時候會有轉機出現？'
          ].map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleItem}
              onPress={() => setQuestion(example)}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
      backgroundColor: '#f5f3ff',
  },

  bodyCard: {
    margin: 16,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PURPLE.textDark,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: PURPLE.textLight,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },

  textAreaWrap: {
    width: '100%',
    backgroundColor: PURPLE.white,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    position: 'relative',
  },
  
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: PURPLE.textDark,
    lineHeight: 24,
  },

  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },

  charCountText: {
    fontSize: 12,
    color: PURPLE.textLight,
  },

  primaryBtn: {
    marginTop: 20,
    backgroundColor: PURPLE.deep,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    shadowColor: PURPLE.deep,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  primaryBtnDisabled: {
    backgroundColor: PURPLE.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  primaryBtnText: {
    color: PURPLE.white,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 16,
  },

  primaryBtnTextDisabled: {
    opacity: 0.7,
  },

  exampleContainer: {
    marginTop: 24,
    width: '100%',
  },

  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PURPLE.textDark,
    marginBottom: 12,
  },

  exampleItem: {
    backgroundColor: PURPLE.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 128, 166, 0.2)',
  },

  exampleText: {
    fontSize: 14,
    color: PURPLE.textDark,
    lineHeight: 18,
  },
});
