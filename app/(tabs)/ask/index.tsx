import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AskScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Section title */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>選擇預測方式</Text>
            <Text style={styles.sectionSub}>東方或西方的智慧，為你指引方向</Text>
          </View>

          {/* 西方塔羅牌 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>西方塔羅牌</Text>
            <Text style={styles.cardSub}>源自歐洲的神秘預測系統</Text>

            <Image
              source={require('@/assets/images/tarot.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryBtn}
            onPress={() => router.push('/ask/asktarot')}
          >
            <Text style={styles.primaryBtnText}>選擇塔羅牌</Text>
          </TouchableOpacity>

          </View>

          {/* 東方籤詩 */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>東方籤詩</Text>
            <Text style={styles.cardSub}>源自東方傳統智慧的預測方式</Text>

            <Image
              source={require('@/assets/images/sticks.png')}
              style={styles.cardImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.primaryBtn}
              onPress={() => router.push('ask/droplottery')} 
            >
              <Text style={styles.primaryBtnText}>選擇籤詩</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const PURPLE = {
  bg: '#f5f3ff',
  card: 'white',
  deep: '#B69EE5',
  deep2: '#f5f3ff',
  white: '#FFFFFF',
  textDark: '#5D3B94',
  textLight: '#7A5BA9',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PURPLE.bg },
  container: { flex: 1, backgroundColor: PURPLE.bg },

  scrollContent: { paddingHorizontal: 18, paddingTop: 6 },

  sectionHeader: {
    alignItems: 'center', marginBottom: 14, marginTop: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: PURPLE.textDark, marginBottom: 6 },
  sectionSub: { fontSize: 12, color: PURPLE.textLight },

  card: {
    backgroundColor: PURPLE.card,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: PURPLE.textDark, marginBottom: 6 },
  cardSub: { fontSize: 12, color: PURPLE.textLight, marginBottom: 12 },
  cardImage: { width: '80%', height: 140, marginBottom: 14 },

  primaryBtn: {
    backgroundColor: PURPLE.deep,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: PURPLE.deep,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primaryBtnText: { color: PURPLE.white, fontWeight: '700', letterSpacing: 1 },
});
