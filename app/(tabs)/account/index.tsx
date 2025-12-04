import { MaterialIcons } from '@expo/vector-icons';
import React, { Dispatch, SetStateAction } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "../../../lib/supabase";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';

type FormData = {
  email: string;
  password: string;
  username: string;
  birthday: string;
  mbti: string;
  confirmPassword: string;
  agree: boolean;
  avatar: string; 
};

type LoginFormData = {
  email: string;
  password: string;
};

type LoginPageProps = {
  formData: LoginFormData;
  handleInputChange: (field: keyof LoginFormData, value: string) => void;
  setCurrentPage: Dispatch<SetStateAction<'login' | 'register'>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  onLoginSuccess?: () => void;
};

const LoginPage: React.FC<LoginPageProps> = ({
  formData,
  handleInputChange,
  setCurrentPage,
  showPassword,
  setShowPassword,
  onLoginSuccess,
}) => {
  return (
    <View style={styles.pageContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <Text style={styles.subtitle}>尚未登入</Text>
          <Text style={styles.description}>請登入或註冊以使用完整功能</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              電子郵件
              <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              密碼
              <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={24}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgot}>忘記密碼？</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.7}
            onPress={async () => {
              try {
                console.log("嘗試登入:", formData.email);

                // 使用 Supabase Auth 登入
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: formData.email,
                  password: formData.password,
                });

                if (error) {
                  console.error("登入錯誤:", error);
                  Alert.alert("登入失敗", error.message);
                  return;
                }

                if (!data.user) {
                  Alert.alert("登入失敗", "無法取得用戶資訊");
                  return;
                }

                console.log("登入成功，用戶 ID:", data.user.id);

                // 登入成功後，從 users 表取得額外資料
                const { data: profileData, error: profileError } = await supabase
                  .from("users")
                  .select("*")
                  .eq("id", data.user.id)
                  .single();

                if (profileError) {
                  console.error("無法取得用戶資料:", profileError);
                  // 即使取得profile失敗，仍然允許登入
                  Alert.alert(
                    "登入成功！",
                    "歡迎回來！請完善您的個人資料",
                    [
                      {
                        text: "確定",
                        onPress: () => {
                          router.replace("/account/profile");
                        }
                      }
                    ]
                  );
                  return;
                }

                console.log("用戶資料:", profileData);

                Alert.alert(
                  "登入成功！",
                  `歡迎回來${profileData?.username ? `，${profileData.username}` : ''}！`,
                  [
                    {
                      text: "確定",
                      onPress: () => {
                        router.replace("/account/profile");
                      }
                    }
                  ]
                );

                if (onLoginSuccess) onLoginSuccess();
                
              } catch (err) {
                console.error("登入異常:", err);
                Alert.alert("登入發生錯誤", String(err));
              }
            }}
          >
            <Text style={styles.buttonText}>登入</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => setCurrentPage('register')}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: '#663399' }]}>註冊新帳號</Text>
          </TouchableOpacity>

          <Text style={styles.alt}>或使用以下方式登入</Text>

          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButtonAlt}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://www.facebook.com/')}
            >
              <Image source={require('../../../assets/images/facebook.png')} style={styles.iconImage} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButtonAlt}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://line.me/')}
            >
              <Image source={require('../../../assets/images/line.png')} style={styles.iconImage} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButtonAlt}
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://accounts.google.com/')}
            >
              <Image source={require('../../../assets/images/gmail.png')} style={styles.iconImage} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

type RegisterPageProps = {
  formData: FormData;
  handleInputChange: (field: keyof FormData, value: string | boolean) => void;
  setCurrentPage: Dispatch<SetStateAction<'login' | 'register'>>;
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: Dispatch<SetStateAction<boolean>>;
  showMbtiOptions: boolean;
  setShowMbtiOptions: Dispatch<SetStateAction<boolean>>;
  errors: Partial<Record<keyof FormData, string>>;
  validateRegister: () => boolean;
  setFormData: Dispatch<SetStateAction<FormData>>;
};

const BirthdayPicker: React.FC<{
  birthday: string;
  setBirthday: (val: string) => void;
}> = ({ birthday, setBirthday }) => {
  const [showPicker, setShowPicker] = React.useState(false);

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

  const onChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
      const dd = ('0' + selectedDate.getDate()).slice(-2);
      setBirthday(`${yyyy}/${mm}/${dd}`);
    }
  };

  return (
    <View style={styles.dateInputContainer}>
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <TextInput
          style={[styles.textInput, styles.dateInput]}
          placeholder="請選擇您的生日"
          placeholderTextColor="#999"
          value={birthday}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.calendarIconButton} 
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="event" size={24} color="#6b7280" />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={birthday ? getDateFromString(birthday) : new Date()}
          mode="date"
          display="default"
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
};

const RegisterPage: React.FC<RegisterPageProps> = ({
  formData,
  handleInputChange,
  setCurrentPage,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  showMbtiOptions,
  setShowMbtiOptions,
  errors,
  validateRegister,
  setFormData,
}) => {

  const pickImage = async () => {
    // 請求相簿權限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('需要權限', '請允許訪問相簿以選擇頭像');
      return;
    }
  
    // 開啟圖片選擇器
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
  
    if (!result.canceled && result.assets[0]) {
      handleInputChange('avatar', result.assets[0].uri);
    }
  };
  
  return (
    <View style={styles.pageContainer}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <Text style={styles.subtitle}>註冊帳號</Text>
          <Text style={styles.description}>加入星願指引，探索更多星座的神秘世界</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              電子郵件 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入您的電子郵件"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              使用者名稱
              <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="請輸入您的使用者名稱"
              placeholderTextColor="#999"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>頭像</Text>
            {/* 顯示當前頭像 */}
            {formData.avatar ? (
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Image 
                  source={{ uri: formData.avatar }} 
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              </View>
            ) : null}
            
            {/* 選擇圖片按鈕 */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: '#8b5cf6' }]}
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>
                {formData.avatar ? '更換頭像' : '選擇頭像'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              生日 <Text style={styles.required}>*</Text>
            </Text>
            <BirthdayPicker
              birthday={formData.birthday}
              setBirthday={(value) => handleInputChange('birthday', value)}
            />
            {errors.birthday && <Text style={styles.errorText}>{errors.birthday}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              MBTI性格類型
              <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowMbtiOptions(true)}>
              <Text style={styles.dropdownText}>{formData.mbti ? formData.mbti : '請選擇您的MBTI類型'}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" />
            </TouchableOpacity>

            <Modal visible={showMbtiOptions} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowMbtiOptions(false)}>
                <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                  <ScrollView style={styles.scrollOptions}>
                    {[
                      'INTJ-架構師', 'INTP-邏輯學家', 'ENTJ-指揮官', 'ENTP-辯論家',
                      'INFJ-提倡者', 'INFP-調停者', 'ENFJ-主人公', 'ENFP-活動家',
                      'ISTJ-物流師', 'ISFJ-守護者', 'ESTJ-管理者', 'ESFJ-執政官',
                      'ISTP-鑑賞家', 'ISFP-冒險家', 'ESTP-企業家', 'ESFP-表演者',
                    ].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.optionItem}
                        onPress={() => {
                          handleInputChange('mbti', type);
                          setShowMbtiOptions(false);
                        }}
                      >
                        <Text style={styles.optionText}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
            {errors.mbti && <Text style={styles.errorText}>{errors.mbti}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              密碼
              <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                placeholder="請設定6位以上的密碼"
                placeholderTextColor="#999"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIcon} activeOpacity={0.7}>
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              確認密碼 <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                placeholder="請再次輸入密碼"
                placeholderTextColor="#999"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                secureTextEntry={!showConfirmPassword}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeIcon} activeOpacity={0.7}>
                <MaterialIcons name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <View style={styles.termsRow}>
            <Switch value={formData.agree} onValueChange={(value) => handleInputChange('agree', value)} />
            <Text style={styles.termsText}>我已閱讀並同意 服務條款 與 隱私條款</Text>
          </View>
          {errors.agree && <Text style={styles.errorText}>{errors.agree}</Text>}

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.7}
            onPress={async () => {
              if (!validateRegister()) return;

              try {
                console.log("開始註冊流程...");

                // Step 1: 使用 Supabase Auth 註冊（安全的密碼處理）
                const { data: authData, error: authError } = await supabase.auth.signUp({
                  email: formData.email,
                  password: formData.password,
                });

                if (authError) {
                  console.error("Auth 註冊錯誤:", authError);
                  Alert.alert("註冊失敗", authError.message);
                  return;
                }

                const user = authData.user;
                if (!user) {
                  Alert.alert("註冊失敗", "無法創建用戶");
                  return;
                }

                console.log("Auth 註冊成功，用戶 ID:", user.id);

                // Step 2: 將額外資料存到自定義 users 表（不包含密碼）
                const { error: profileError } = await supabase.from("users").insert({
                  id: user.id,
                  email: formData.email,
                  username: formData.username,
                  birthday: formData.birthday,
                  mbti: formData.mbti,
                  avatar: formData.avatar, 
                  // 注意：不要存儲密碼！密碼已由 Supabase Auth 安全處理
                });

                if (profileError) {
                  console.error("保存用戶資料失敗:", profileError);
                  Alert.alert("註冊成功，但保存資料失敗", profileError.message);
                  return;
                }

                console.log("用戶資料保存成功");

                // Step 3: 根據是否有 session 決定後續流程
                const session = authData.session;
                if (session) {
                  // 如果有 session，表示用戶已經登入（郵件確認已關閉）
                  Alert.alert(
                    "註冊成功！", 
                    "歡迎加入星願指引！",
                    [
                      {
                        text: "開始使用",
                        onPress: () => {
                          router.replace("/account/profile");
                        }
                      }
                    ]
                  );
                } else {
                  // 如果沒有 session，需要郵件確認
                  Alert.alert(
                    "註冊成功！", 
                    "請檢查您的郵件並確認後登入",
                    [
                      {
                        text: "前往登入",
                        onPress: () => setCurrentPage('login')
                      }
                    ]
                  );
                }

              } catch (err) {
                console.error("註冊錯誤:", err);
                Alert.alert("註冊發生錯誤", String(err));
              }
            }}
          >
            <Text style={styles.buttonText}>註冊</Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text>已有帳號？</Text>
            <TouchableOpacity onPress={() => setCurrentPage('login')}>
              <Text style={styles.link}>立即登入</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const AstrologyApp: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showMbtiOptions, setShowMbtiOptions] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormData, string>>>({});
  const [loginFormData, setLoginFormData] = React.useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [registerFormData, setRegisterFormData] = React.useState<FormData>({
    email: '',
    password: '',
    username: '',
    birthday: '',
    mbti: '',
    confirmPassword: '',
    agree: false,
    avatar: '', 
  });

  const validateRegister = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(registerFormData.email)) {
      newErrors.email = '請輸入有效的電子郵件';
    }
    if (!registerFormData.username.trim()) {
      newErrors.username = '請輸入使用者名稱';
    }
    if (!registerFormData.birthday) {
      newErrors.birthday = '請選擇您的生日';
    }
    if (!registerFormData.mbti) {
      newErrors.mbti = '請選擇您的MBTI類型';
    }
    if (registerFormData.password.length < 6) {
      newErrors.password = '密碼長度需至少6位數';
    }
    if (registerFormData.password !== registerFormData.confirmPassword) {
      newErrors.confirmPassword = '兩次輸入的密碼不一致';
    }
    if (!registerFormData.agree) {
      newErrors.agree = '您必須同意服務條款與隱私政策';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginInputChange = (field: keyof LoginFormData, value: string) => {
    setLoginFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterInputChange = (field: keyof FormData, value: string | boolean) => {
    setRegisterFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {currentPage === 'login' ? (
          <LoginPage
            formData={loginFormData}
            handleInputChange={handleLoginInputChange}
            setCurrentPage={setCurrentPage}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        ) : (
          <RegisterPage
            formData={registerFormData}
            handleInputChange={handleRegisterInputChange}
            setCurrentPage={setCurrentPage}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            showMbtiOptions={showMbtiOptions}
            setShowMbtiOptions={setShowMbtiOptions}
            errors={errors}
            validateRegister={validateRegister}
            setFormData={setRegisterFormData}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AstrologyApp;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  keyboardView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b21a8',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    color: '#6b21a8',
    marginBottom: 8,
    fontWeight: '500',
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  dateInputContainer: {
    position: 'relative',
  },
  dateInput: {
    paddingRight: 50,
  },
  calendarIconButton: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'white',
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 300,
    paddingVertical: 8,
  },
  scrollOptions: {
    maxHeight: 280,
  },
  forgot: {
    textAlign: 'right',
    color: '#6b21a8',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: '#663399',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#663399',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  alt: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  iconButtonAlt: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  iconImage: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 18,
    marginLeft: 8,
  },
  link: {
    color: '#6b21a8',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
});
