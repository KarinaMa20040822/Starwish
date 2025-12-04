import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
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
} from 'react-native';
import editProfile from './(tabs)/account/editProfile';

const AddPersonScreen = () => {
  const navigation = useNavigation();

  const [relationship, setRelationship] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedReligion, setSelectedReligion] = useState('');
  const [selectedMbti, setSelectedMbti] = useState('');
  const [showMbtiPicker, setShowMbtiPicker] = useState(false);
  const [showReligionPicker, setShowReligionPicker] = useState(false);

  const religions = [
    '東方信仰',
    '西方信仰',
  ];
    const mbti = [
      "ISTJ", "ISFJ", "INFJ", "INTJ",
      "ISTP", "ISFP", "INFP", "INTP",
      "ESTP", "ESFP", "ENFP", "ENTP",
      "ESTJ", "ESFJ", "ENFJ", "ENTJ",
    ];

    const handleSave = () => {
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
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image source={require("@/assets/images/virgo.png")} style={styles.avatar} />
            <View style={styles.proTag}>
            </View>
            <Text style={styles.nickname}>仙女下凡</Text>
            <Text style={styles.constellation}>處女座</Text>
          </View>
        <View style={styles.formContainer}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              使用者名稱 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="仙女下凡"
              placeholderTextColor="#999"
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>生日<Text style={styles.required}>*</Text></Text>
            <View style={styles.dateInputContainer}>
              <TextInput
                style={[styles.textInput, styles.dateInput]}
                placeholder="2004 / 08 / 22"
                placeholderTextColor="#999"
                value={birthDate}
                onChangeText={handleDateChange}
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={styles.calendarIcon}>📅</Text>
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
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>MBTI</Text>

            {/* 觸發下拉選單 */}
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
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>

            {/* 彈窗 Modal */}
            <Modal visible={showMbtiPicker} transparent animationType="fade">
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowMbtiPicker(false)}
              >
                <Pressable
                  style={styles.modalContainer}
                  onPress={(e) => e.stopPropagation()}
                >
                  {mbti.map((item) => (
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
                </Pressable>
              </Pressable>
            </Modal>
          </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>儲存</Text>
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
});

export default editProfile;
