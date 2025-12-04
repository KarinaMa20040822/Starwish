import { supabase } from '@/lib/supabase'; // ✅ 這行要確保路徑正確
import { useNavigation } from '@react-navigation/native';
import { Session } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const AddPersonScreen = () => {
  const navigation = useNavigation();

  const [session, setSession] = useState<Session | null>(null);
  const [relationship, setRelationship] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');
  const [showReligionPicker, setShowReligionPicker] = useState(false);

  const religions = [
    '佛教',
    '基督教',
    '天主教',
    '道教',
    '伊斯蘭教',
    '無特定信仰',
    '其他'
  ];

  // ✅ 抓取目前登入者
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('錯誤', '請先登入');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('提示', '請輸入關係');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('提示', '請輸入暱稱');
      return;
    }
    if (!birthDate.trim()) {
      Alert.alert('提示', '請輸入生日');
      return;
    }
    if (!selectedReligion.trim()) {
      Alert.alert('提示', '請選擇信仰偏好');
      return;
    }


    try {
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('stakeholders')
        .insert([
          {
            user_id: userId,
            relationship,
            nickname,
            birth_date: birthDate.replace(/\//g, '-'), // 轉成 yyyy-mm-dd
            religion: selectedReligion,
          },
        ]);

      if (error) throw error;

      Alert.alert('成功', '人物已新增', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error('❌ Supabase insert error:', err.message);
      Alert.alert('錯誤', err.message || '新增失敗，請稍後再試');
    }
  };

  const formatDate = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    let formatted = numbers;

    if (numbers.length >= 5) {
      formatted = `${numbers.slice(0, 4)}/${numbers.slice(4, 6)}/${numbers.slice(6, 8)}`;
    } else if (numbers.length >= 3) {
      formatted = `${numbers.slice(0, 4)}/${numbers.slice(4)}`;
    }

    return formatted.slice(0, 10);
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDate(text);
    setBirthDate(formatted);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 100 }]}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <View style={styles.userIcon}>
              <Text style={styles.userIconText}>👤</Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          {/* 關係 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              關係 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入您與他的關係"
              placeholderTextColor="#999"
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>

          {/* 暱稱 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              利害關係人暱稱 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入您的利害關係人的暱稱"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          {/* 生日 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>生日<Text style={styles.required}>*</Text></Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={[styles.textInput, styles.dateInput]}
                placeholder="yyyy / mm / dd"
                placeholderTextColor="#999"
                value={birthDate}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
          </View>

          {/* 信仰偏好 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>信仰偏好<Text style={styles.required}>*</Text></Text>
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
              <Text style={styles.dropdownIcon}>▼</Text>
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
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>儲存</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#9B59B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 18,
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
    fontSize: 16,
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
    paddingHorizontal: 40,
    alignSelf: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddPersonScreen;
