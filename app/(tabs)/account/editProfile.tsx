import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { supabase } from "../../../lib/supabase";
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedMbti, setSelectedMbti] = useState('');
  const [showMbtiPicker, setShowMbtiPicker] = useState(false);
  const [showReligionPicker, setShowReligionPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userId, setUserId] = useState('');
  const [avatar, setAvatar] = useState('');

  const religions = ['東方信仰', '西方信仰'];
  const mbtiOptions = [
    'INTJ-架構師', 'INTP-邏輯學家', 'ENTJ-指揮官', 'ENTP-辯論家',
    'INFJ-提倡者', 'INFP-調和者', 'ENFJ-主人公', 'ENFP-活動家',
    'ISTJ-物流師', 'ISFJ-守護者', 'ESTJ-管理者', 'ESFJ-執政官',
    'ISTP-鑑賞家', 'ISFP-冒險家', 'ESTP-企業家', 'ESFP-表演者',
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // 獲取當前登入用戶
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('錯誤', '用戶未登入');
        navigation.goBack();
        return;
      }

      setUserId(user.id);

      // 從 user_profiles 表獲取用戶資料
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('獲取用戶資料錯誤:', error);
        Alert.alert('錯誤', '無法載入用戶資料');
      } else if (data) {
        setUsername(data.username || '');
        setBirthDate(data.birthday || '');
        setSelectedMbti(data.mbti || '');
        setSelectedReligion(data.religion || '');
        setAvatar(data.avatar || ''); 
      }
    } catch (err) {
      console.error('載入用戶資料異常:', err);
      Alert.alert('錯誤', '載入資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    // 驗證必填欄位
    if (!username.trim()) {
      Alert.alert('提示', '請輸入使用者名稱');
      return;
    }

    if (!birthDate) {
      Alert.alert('提示', '請選擇生日');
      return;
    }

    try {
      setSaving(true);

      console.log('準備更新資料:', {
        username: username.trim(),
        birthday: birthDate,
        mbti: selectedMbti || null,
        religion: selectedReligion || null,
        avatar: avatar || null,
        userId: userId
      });

      // 更新 users 表
      const { data, error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          birthday: birthDate,
          mbti: selectedMbti || null,
          religion: selectedReligion || null,
          avatar: avatar || null, 
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('更新用戶資料錯誤:', error);
        Alert.alert('儲存失敗', error.message);
        return;
      }

      console.log('更新成功:', data);

      Alert.alert(
        '儲存成功',
        '您的資料已更新',
        [
          {
            text: '確定',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.error('儲存資料異常:', err);
      Alert.alert('錯誤', '儲存資料時發生錯誤: ' + String(err));
    } finally {
      setSaving(false);
    }
  };

  const getDateFromString = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
      const dd = ('0' + selectedDate.getDate()).slice(-2);
      setBirthDate(`${yyyy}/${mm}/${dd}`);
    }
  };

  const getConstellation = (birthday: string) => {
    if (!birthday) return "未設定";
    const [year, month, day] = birthday.split('/').map(Number);
    const constellations = [
      { name: "水瓶座", start: [1, 20], end: [2, 18] },
      { name: "雙魚座", start: [2, 19], end: [3, 20] },
      { name: "牡羊座", start: [3, 21], end: [4, 19] },
      { name: "金牛座", start: [4, 20], end: [5, 20] },
      { name: "雙子座", start: [5, 21], end: [6, 21] },
      { name: "巨蟹座", start: [6, 22], end: [7, 22] },
      { name: "獅子座", start: [7, 23], end: [8, 22] },
      { name: "處女座", start: [8, 23], end: [9, 22] },
      { name: "天秤座", start: [9, 23], end: [10, 23] },
      { name: "天蠍座", start: [10, 24], end: [11, 22] },
      { name: "射手座", start: [11, 23], end: [12, 21] },
      { name: "摩羯座", start: [12, 22], end: [1, 19] },
    ];

    for (const c of constellations) {
      if (
        (month === c.start[0] && day >= c.start[1]) ||
        (month === c.end[0] && day <= c.end[1])
      ) {
        return c.name;
      }
    }
    return "未設定";
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('需要權限', '請允許訪問相簿以選擇頭像');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6b21a8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 100 }]}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
          <Image 
            source={
              avatar 
                ? { uri: avatar } 
                : require("@/assets/images/virgo.png")
            } 
            style={styles.avatar} 
          />
          <View style={styles.editIconContainer}>
            <MaterialIcons name="camera-alt" size={20} color="white" />
          </View>
        </TouchableOpacity>
          <Text style={styles.nickname}>{username || "未設定"}</Text>
          <Text style={styles.constellation}>{getConstellation(birthDate)}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              使用者名稱 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入使用者名稱"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              生日<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.dateInputContainer}>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <TextInput
                  style={[styles.textInput, styles.dateInput]}
                  placeholder="請選擇您的生日"
                  placeholderTextColor="#999"
                  value={birthDate}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.calendarIconButton} 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="event" size={24} color="#6b7280" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={birthDate ? getDateFromString(birthDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>信仰偏好</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowReligionPicker(true)}
            >
              <Text style={[
                styles.pickerText,
                !selectedReligion && styles.placeholderText
              ]}>
                {selectedReligion || '請選擇您的信仰偏好'}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            <Modal visible={showReligionPicker} transparent animationType="fade">
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowReligionPicker(false)}
              >
                <Pressable
                  style={styles.modalContainer}
                  onPress={(e) => e.stopPropagation()}
                >
                  {religions.map((religion) => (
                    <TouchableOpacity
                      key={religion}
                      style={styles.optionItem}
                      onPress={() => {
                        setSelectedReligion(religion);
                        setShowReligionPicker(false);
                      }}
                    >
                      <Text style={styles.optionText}>{religion}</Text>
                    </TouchableOpacity>
                  ))}
                </Pressable>
              </Pressable>
            </Modal>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>MBTI</Text>
            <TouchableOpacity
              style={styles.pickerContainer}
              onPress={() => setShowMbtiPicker(true)}
            >
              <Text
                style={[
                  styles.pickerText,
                  !selectedMbti && styles.placeholderText,
                ]}
              >
                {selectedMbti || "請選擇您的MBTI"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>

            <Modal visible={showMbtiPicker} transparent animationType="fade">
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowMbtiPicker(false)}
              >
                <Pressable
                  style={styles.modalContainer}
                  onPress={(e) => e.stopPropagation()}
                >
                  <ScrollView style={styles.scrollOptions}>
                    {mbtiOptions.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.optionItem}
                        onPress={() => {
                          setSelectedMbti(item);
                          setShowMbtiPicker(false);
                        }}
                      >
                        <Text style={styles.optionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>儲存</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    avatar: { width: 100, height: 100, borderRadius: 50 },
  container: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    paddingBottom: 50,
  },
  nickname: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
    constellation: { fontSize: 14, color: "#888" },
      edit: {
        width: 18,
        height: 18,
      },
  userIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconText: {
    fontSize: 24,
    color: '#9B59B6',
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    color: '#6b21a8',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  required: {
    color: '#FF4444',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateInputContainer: {
    position: 'relative',
  },
  dateInput: {
    paddingRight: 50,
  },
  calendarIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 18,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
    elevation: 6,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#663399',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 35,
    alignSelf: 'center',
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 100,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#663399',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default EditProfileScreen;
