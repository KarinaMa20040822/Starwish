import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator } from 'react-native';
import { supabase } from "../../../lib/supabase";

const { width } = Dimensions.get('window');

interface FortuneSlipProps {
  visible: boolean;
  lotId: number;
  onHide: () => void;
  onDeepReading: () => void;
}

interface FortuneData {
  id: number;
  lot_number: number;
  title: string;
  poem: string;
  meaning: string;
}

const PURPLE = {
  bg: '#F2EAFE',
  panel: '#E9D7FF',
  deep: '#8E6DE6',
  textDark: '#4B347C',
  textLight: '#8B80A6',
  accent: '#B794F6',
};

const FortuneSlip: React.FC<FortuneSlipProps> = ({ visible, lotId, onHide, onDeepReading }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [fortune, setFortune] = useState<FortuneData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 從資料庫獲取籤詩
  const fetchFortune = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('fortune_poems')
        .select('*')
        .eq('lot_number', id)
        .limit(1);

      if (error) {
        console.error('獲取籤詩失敗:', error);
        setError('無法載入籤詩內容');
        return;
      }

      // 檢查是否有資料
      if (data && data.length > 0) {
        setFortune(data[0]);
      } else {
        console.error('找不到對應的籤詩:', id);
        setError(`找不到第 ${id} 籤，請重新抽籤`);
      }
    } catch (err) {
      console.error('獲取籤詩異常:', err);
      setError('載入籤詩時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && lotId) {
      fetchFortune(lotId);
    }
  }, [visible, lotId]);

  useEffect(() => {
    if (visible && fortune) {
      // 淡入動畫
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fortune]);

  const hideSlip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
      setFortune(null);
      setError(null);
    });
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={hideSlip}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.slipContainer}>
            {/* 籤詩紙張背景 */}
            <View style={styles.paperBackground}>
              {/* 載入中狀態 */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#8E6DE6" />
                  <Text style={styles.loadingText}>正在抽取籤詩...</Text>
                </View>
              )}

              {/* 錯誤狀態 */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => fetchFortune(lotId)}
                  >
                    <Text style={styles.retryButtonText}>重新載入</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 籤詩內容 */}
              {fortune && !loading && !error && (
                <>
                  {/* 頂部標題 */}
                  <View style={styles.header}>
                    <Text style={styles.templeTitle}>龍山寺靈籤</Text>
                    <View style={styles.divider} />
                  </View>

                  {/* 籤號 */}
                  <View style={styles.lotNumberContainer}>
                    <Text style={styles.lotNumber}>第{fortune.lot_number}籤</Text>
                    <Text style={styles.lotType}>{fortune.title}</Text>
                  </View>

                  {/* 籤詩內容 */}
                  <View style={styles.contentContainer}>
                    <Text style={styles.fortuneText}>{fortune.poem}</Text>
                  </View>

                  {/* 解籤 */}
                  <View style={styles.meaningContainer}>
                    <Text style={styles.meaningTitle}>解籤：</Text>
                    <Text style={styles.meaningText}>{fortune.meaning}</Text>
                  </View>

                  {/* 底部裝飾 */}
                  <View style={styles.footer}>
                    <Text style={styles.blessText}>🙏 誠心祈福 🙏</Text>
                    
                    {/* 深度解籤按鈕 */}
                    <TouchableOpacity
                      style={styles.deepReadingBtn}
                      onPress={onDeepReading}
                    >
                      <Text style={styles.deepReadingBtnText}>💬 深度解籤</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.tapHint}>輕點螢幕收起籤詩</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  slipContainer: {
    width: width * 0.85,
    maxWidth: 320,
    alignItems: 'center',
  },
  paperBackground: {
    backgroundColor: '#FDF6E3',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#D4B896',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#8B4513',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    color: '#D2691E',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8E6DE6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  templeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#CD853F',
    marginTop: 8,
  },
  lotNumberContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  lotNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  lotType: {
    fontSize: 16,
    color: '#D2691E',
    marginTop: 4,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: '#FFFEF7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6D3A3',
  },
  fortuneText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#654321',
    textAlign: 'center',
    fontWeight: '500',
  },
  meaningContainer: {
    marginBottom: 16,
  },
  meaningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 14,
    color: '#654321',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E6D3A3',
  },
  blessText: {
    fontSize: 14,
    color: '#D2691E',
    fontWeight: '500',
    marginBottom: 12,
  },
  deepReadingBtn: {
    backgroundColor: '#8E6DE6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#8E6DE6',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  deepReadingBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#A0522D',
    fontStyle: 'italic',
    opacity: 0.7,
  },
});

export default FortuneSlip;