import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import { supabase } from "../../../lib/supabase";

const windowWidth = Dimensions.get('window').width;

const categories = ['全部', '水晶', '數位', '飾品', '開運物品'];

const categoryIcons = [
  { name: '愛情運', icon: require('@/assets/images/love.png') },
  { name: '財運', icon: require('@/assets/images/money.png') },
  { name: '事業運', icon: require('@/assets/images/work.png') },
  { name: '健康運', icon: require('@/assets/images/healthy.png') },
];

export default function ShoppingApp() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [hotProducts, setHotProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userZodiac, setUserZodiac] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    // 取得當前使用者
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 從 users 表取得生日
      const { data, error } = await supabase
        .from('users')
        .select('birthday')
        .eq('id', user.id)
        .single();
      
      if (data?.birthday) {
        const zodiac = getZodiacSign(data.birthday);
        setUserZodiac(zodiac);
      }
    }
  };
  const getZodiacSign = (birthday: string): string => {
    const date = new Date(birthday);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '牡羊座';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '金牛座';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return '雙子座';
    if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return '巨蟹座';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '獅子座';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '處女座';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return '天秤座';
    if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return '天蠍座';
    if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return '射手座';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '摩羯座';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '水瓶座';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return '雙魚座';
    
  };
  const zodiacSymbols: { [key: string]: string } = {
    '牡羊座': '♈',
    '金牛座': '♉',
    '雙子座': '♊',
    '巨蟹座': '♋',
    '獅子座': '♌',
    '處女座': '♍',
    '天秤座': '♎',
    '天蠍座': '♏',
    '射手座': '♐',
    '摩羯座': '♑',
    '水瓶座': '♒',
    '雙魚座': '♓',
  };
  useEffect(() => {
    loadData(activeCategory);
  }, [activeCategory]);

  const loadData = async (category: string) => {
    setLoading(true);

    const fetchSection = async (sectionName: string) => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('section', sectionName)
        .order('created_at', { ascending: false });

      if (category !== '全部') {
        query = query.eq('category', category); // 若 category 是 array，可改用 .contains([category])
      }

      const { data, error } = await query;
      if (error) console.error(error);
      return data || [];
    };

    const [featured, hot, newProds, all] = await Promise.all([
      fetchSection('featured'),
      fetchSection('hot'),
      fetchSection('new'),
      fetchSection('all'),
    ]);

    setFeaturedProducts(featured);
    setHotProducts(hot);
    setNewProducts(newProds);
    setAllProducts(all);
    setLoading(false);
  };

  const handleProductPress = (link: string) => {
    Linking.openURL(link).catch(() => {
      alert('無法開啟連結');
    });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.mainTitleContainer}>
          <Text style={styles.mainTitle}>幸運小物商城</Text>
        </View>

        {/* 今日幸運推薦卡片 */}
        <View style={styles.luckyCardContainer}>
          <View style={styles.luckyCard}>
            <View style={styles.luckyCardContent}>
              <View style={styles.luckyCardText}>
                <Text style={styles.luckyCardTitle}>今日幸運推薦</Text>
                <Text style={styles.luckyCardSubtitle}>提升你的好運勢</Text>
              </View>
              <View style={styles.luckyCardIcon}>
                <View style={styles.luckyCardIconInner} />
              </View>
            </View>
            <View style={[styles.decorCircle, styles.decorCircle1]} />
            <View style={[styles.decorCircle, styles.decorCircle2]} />
          </View>
        </View>

        {/* 分類 tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 幸運分類圖示 */}
        <View style={styles.fortuneCategories}>
          <Text style={styles.sectionTitle}>幸運分類</Text>
          <View style={styles.fortuneGrid}>
            {categoryIcons.map((item) => (
              <View key={item.name} style={styles.fortuneItem}>
                <Image source={item.icon} style={styles.fortuneIcon} />
                <Text style={styles.fortuneName}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 今日幸運推薦商品區塊 */}
        <View style={styles.section}>
          <View style={styles.virgoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.virgoicon}>{zodiacSymbols[userZodiac]}</Text>
            <Text style={styles.virgoContainerTitle}>{userZodiac}本月幸運物</Text>
          </View>
            {loading ? (
              <ActivityIndicator size="large" color="#9370DB" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.productCard}
                    onPress={() => handleProductPress(product.link)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: product.image }} style={styles.productImageLarge} resizeMode="cover" />
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>{product.price}</Text>
                  </TouchableOpacity>
                ))}
                {featuredProducts.length === 0 && (
                  <View style={{ padding: 20 }}>
                    <Text style={{ color: '#666' }}>目前還沒有商品</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>

        {/* 熱門推薦 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>熱門推薦</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#9370DB" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {hotProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(product.link)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: product.image }} style={styles.productImageLarge} resizeMode="cover" />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </TouchableOpacity>
              ))}
              {hotProducts.length === 0 && (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#666' }}>目前還沒有商品</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* 新品上架 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>新品上架</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#9370DB" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {newProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(product.link)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: product.image }} style={styles.productImageLarge} resizeMode="cover" />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </TouchableOpacity>
              ))}
              {newProducts.length === 0 && (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#666' }}>目前還沒有商品</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* 所有商品 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>所有商品</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#9370DB" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {allProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => handleProductPress(product.link)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: product.image }} style={styles.productImageLarge} resizeMode="cover" />
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{product.price}</Text>
                </TouchableOpacity>
              ))}
              {allProducts.length === 0 && (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: '#666' }}>目前還沒有商品</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  mainTitleContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  luckyCardContainer: {
    marginHorizontal: 20,
    marginBottom: 28,
  },
  luckyCard: {
    backgroundColor: '#9370DB',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  luckyCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  luckyCardText: {
    flex: 1,
  },
  luckyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  luckyCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  luckyCardIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luckyCardIconInner: {
    width: 48,
    height: 48,
    backgroundColor: '#f9ca24',
    borderRadius: 24,
  },
  decorCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  decorCircle1: {
    width: 96,
    height: 96,
    top: -32,
    right: -32,
  },
  decorCircle2: {
    width: 64,
    height: 64,
    bottom: -16,
    left: -16,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingBottom: 150,
  },
  categoryTabs: {
    maxHeight: 48,
  },
  categoryTab: {
    backgroundColor: '#DDCDFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#9370DB',
  },
  categoryTabText: {
    color: '#7e22ce',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: 'white',
  },
  fortuneCategories: {
    marginTop: 32,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#6b21a8',
    fontWeight: '600',
    marginBottom: 16,
  },
  fortuneGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fortuneItem: {
    width: (windowWidth - 64) / 4,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
    fortuneIcon: {
      width: 40,
      height: 40,
      resizeMode: 'contain',
      marginBottom: 6,
    },
  fortuneName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    marginTop: 40,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  virgoContainerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    left:16,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 14,
    width: 160,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  productImageLarge: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '700',
    marginTop: 6,
  },
  virgoicon: {
    position: 'relative',
    fontSize: 18,
  },
  virgoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  featuredGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredProductCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    width: (windowWidth - 80) / 2,
  },
  featuredProductImage: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featuredProductPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e74c3c',
  },
});