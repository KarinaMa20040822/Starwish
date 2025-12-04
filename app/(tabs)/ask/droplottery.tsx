import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { supabase } from "../../../lib/supabase";
import FortuneSlip from "./FortuneSlip";

const PURPLE = {
  bg: '#f5f3ff',
  panel: '#E9D7FF',
  deep: '#8E6DE6',
  textDark: '#4B347C',
  textLight: '#8B80A6',
};

export default function ProfileLotShakeScreen() {
  const router = useRouter();
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [enabled, setEnabled] = useState(false);
  const [showFortune, setShowFortune] = useState(false);
  const [currentLotId, setCurrentLotId] = useState(1);
  const [totalLots, setTotalLots] = useState(100); // 預設值
  const lastShakeRef = useRef<number>(0);

  // 從資料庫獲取籤詩總數
  const fetchTotalLots = async () => {
    try {
      // 方法1: 使用 count
      const { count, error } = await supabase
        .from('fortune_poems')
        .select('lot_number', { count: 'exact', head: true });

      if (error) {
        console.error('獲取籤詩總數失敗:', error);
        // 如果失敗，使用備用方法
        await fetchTotalLotsBackup();
        return;
      }

      if (count !== null && count > 0) {
        setTotalLots(count);
        console.log('📊 籤詩總數:', count);
      } else {
        // 如果 count 為 0，使用備用方法
        await fetchTotalLotsBackup();
      }
    } catch (err) {
      console.error('獲取籤詩總數異常:', err);
      await fetchTotalLotsBackup();
    }
  };

  // 備用方法：查詢最大 lot_number
  const fetchTotalLotsBackup = async () => {
    try {
      const { data, error } = await supabase
        .from('fortune_poems')
        .select('lot_number')
        .order('lot_number', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const maxLotNumber = data[0].lot_number;
        setTotalLots(maxLotNumber);
        console.log('📊 籤詩總數 (備用方法):', maxLotNumber);
      }
    } catch (err) {
      console.error('備用方法失敗:', err);
    }
  };

  useEffect(() => {
    // 獲取籤詩總數
    fetchTotalLots();

    // 啟動加速度計
    setEnabled(true);
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => detectShake(x, y, z));
    
    return () => {
      sub && sub.remove();
      setEnabled(false);
    };
  }, []);

  const detectShake = (x: number, y: number, z: number) => {
    const g = Math.sqrt(x * x + y * y + z * z);
    const delta = Math.abs(g - 1);
    const threshold = 0.9;
    const cooldownMs = 1200;
    const now = Date.now();
    
    if (delta > threshold && now - lastShakeRef.current > cooldownMs) {
      lastShakeRef.current = now;
      onShake();
    }
  };

  const onShake = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    
    // 搖晃動畫
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 80, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: true }),
    ]).start(() => {
      // 🎲 產生 1 到 totalLots 範圍的隨機籤號
      const lotId = Math.floor(Math.random() * totalLots) + 1;
      console.log('🎰 抽到籤號:', lotId, '/ 總共', totalLots, '支籤');
      setCurrentLotId(lotId);
      setShowFortune(true);
    });
  };

  const handleFortuneHide = () => {
    setShowFortune(false);
  };

  const handleDeepReading = () => {
    // 隱藏籤詩彈窗
    setShowFortune(false);
    
    // 跳轉到聊天室進行深度解籤
    router.push({
      pathname: './chat', // 根據您的路由結構調整為正確的聊天頁面路徑
      params: {
        lotId: String(currentLotId),
        question: `請幫我深度解讀第${currentLotId}籤的含義`
      }
    });
  };

  const rotate = shakeAnim.interpolate({ 
    inputRange: [-1, 1], 
    outputRange: ['-8deg', '8deg'] 
  });

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen 
        options={{
          title: '搖籤求運',
          headerShown: true,
        }}
      />
      
      <View style={styles.bodyCard}>
        <Text style={styles.tip}>請專心冥想您的問題，然後搖一搖手機</Text>
        
        <Animated.Image
          source={require('@/assets/images/poem.png')}
          style={[styles.sticks, { transform: [{ rotate }] }]}
          resizeMode="contain"
        />
        
        {/*<Text style={styles.status}>
          {enabled ? `感測器已啟用（共 ${totalLots} 支籤）` : '感測器未啟用'}
      </Text>*/}
        
        {/* 使用說明 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>🔮 求籤步驟</Text>
          <Text style={styles.instructionText}>1. 靜心思考您想問的問題</Text>
          <Text style={styles.instructionText}>2. 輕搖手機抽取靈籤</Text>
          <Text style={styles.instructionText}>3. 誠心看待籤詩指引</Text>
          <Text style={styles.instructionText}>4. 可選擇深度解籤功能</Text>
        </View>
      </View>

      {/* 籤詩組件 */}
      <FortuneSlip
        visible={showFortune}
        lotId={currentLotId}
        onHide={handleFortuneHide}
        onDeepReading={handleDeepReading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PURPLE.bg
  },
  
  bodyCard: {
    flex: 1,
    margin: 16,
    borderRadius: 18,
    alignItems: 'center',
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  
  tip: {
    color: PURPLE.textDark,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  sticks: {
    width: '70%',
    height: 300
  },
  
  status: {
    marginTop: 12,
    fontSize: 12,
    color: PURPLE.textLight
  },
  
  instructionContainer: {
    marginTop: 32,
    backgroundColor: 'rgba(142, 109, 230, 0.1)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PURPLE.textDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  instructionText: {
    fontSize: 14,
    color: PURPLE.textLight,
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});