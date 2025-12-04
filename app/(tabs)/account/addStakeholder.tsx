import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from "../../../lib/supabase";

const AddPersonScreen = () => {
  const navigation = useNavigation();

  const [relationship, setRelationship] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');
  const [showReligionPicker, setShowReligionPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const religions = [
    '佛教',
    '基督教',
    '天主教',
    '道教',
    '伊斯蘭教',
    '無特定信仰',
    '其他'
  ];

  const validateForm = () => {
    if (!relationship.trim()) {
      Alert.alert('提示', '請輸入關係');
      return false;
    }
    if (!nickname.trim()) {
      Alert.alert('提示', '請輸入暱稱');
      return false;
    }
    if (!birthDate.trim()) {
      Alert.alert('提示', '請輸入生日');
      return false;
    }
    if (!selectedReligion) {
      Alert.alert('提示', '請選擇信仰偏好');
      return false;
    }

    // 驗證日期格式
    const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      Alert.alert('提示', '請輸入正確的日期格式 (yyyy/mm/dd)');
      return false;
    }

    // 檢查日期是否有效
    const dateParts = birthDate.split('/');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      Alert.alert('提示', '請輸入有效的日期');
      return false;
    }

    return true;
  };

  const convertDateFormat = (dateString: string) => {
    // 將 yyyy/mm/dd 轉換為 yyyy-mm-dd (資料庫格式)
    return dateString.replace(/\//g, '-');
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 取得當前使用者
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        // 如果沒有使用者，嘗試匿名登入
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          Alert.alert('錯誤', '無法建立使用者session，請稍後再試');
          return;
        }
      }

      // 重新取得使用者資料
      const { data: { user: currentUser }, error: getCurrentUserError } = await supabase.auth.getUser();
      
      if (getCurrentUserError || !currentUser) {
        Alert.alert('錯誤', '無法取得使用者資訊');
        return;
      }

      // 新增利害關係人到資料庫
      const { data, error } = await supabase
        .from('stakeholders')
        .insert([
          {
            user_id: currentUser.id,
            nickname: nickname.trim(),
            relationship: relationship.trim(),
            birth_date: convertDateFormat(birthDate),
            religion: selectedReligion === '無特定信仰' ? null : selectedReligion,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error inserting stakeholder:', error);
        Alert.alert('錯誤', '新增失敗，請稍後再試');
        return;
      }

      console.log('Successfully added stakeholder:', data);

      Alert.alert(
        '成功', 
        '利害關係人已新增！', 
        [
          { 
            text: '確定', 
            onPress: () => {
              // 清空表單
              setRelationship('');
              setNickname('');
              setBirthDate('');
              setSelectedReligion('');
              
              // 回到前一個畫面
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Unexpected error:', error);
      Alert.alert('錯誤', '發生未知錯誤，請稍後再試');
    } finally {
      setIsSubmitting(false);
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
              editable={!isSubmitting}
            />
          </View>

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
              editable={!isSubmitting}
            />
          </View>

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
                editable={!isSubmitting}
              />
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>信仰偏好<Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={[styles.pickerContainer, isSubmitting && styles.disabledInput]}
              onPress={() => !isSubmitting && setShowReligionPicker(true)}
              disabled={isSubmitting}
            >
              <Text style={[
                styles.pickerText,
                !selectedReligion && styles.placeholderText
              ]}>
                {selectedReligion || '請選擇您的信仰偏好'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            <Modal visible={showReligionPicker && !isSubmitting} transparent animationType="fade">
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
                      style={[
                        styles.optionItem,
                        religion === religions[religions.length - 1] && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => {
                        setSelectedReligion(religion);
                        setShowReligionPicker(false);
                      }}
                    >
                      <Text style={styles.optionText}>{religion}</Text>
                      {selectedReligion === religion && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.disabledButton]} 
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>儲存中...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>儲存</Text>
          )}
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
  disabledInput: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
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
    maxHeight: 400,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    fontSize: 16,
    color: '#9B59B6',
    fontWeight: 'bold',
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
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AddPersonScreen;