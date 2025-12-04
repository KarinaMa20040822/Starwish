// app/(tabs)/account/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AccountLayout() {
  const router = useRouter();

  const Gear = () => (
    <Pressable
      onPress={() => router.push("/setting")}
      hitSlop={8}
      style={{ paddingHorizontal: 12 }}
    >
     <Ionicons name="settings-sharp" size={28} color="#9370DB" />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerRight: () => <Gear />,
        headerTitleStyle: { color: "#663399" },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index"        options={{ headerTitle: "星願指引" }} />
      <Stack.Screen name="login"        options={{ headerTitle: "星願指引" }} />
      <Stack.Screen name="profile"      options={{ headerTitle: "星願指引" }} />
      <Stack.Screen name="savehistory"  options={{ headerTitle: "收藏紀錄" }} />
      <Stack.Screen name="askhistory"   options={{ headerTitle: "占卜紀錄" }} />
      <Stack.Screen name="stakeholder"  options={{ headerTitle: "利害關係人" }} />
      <Stack.Screen name="Addstakeholder"  options={{ headerTitle: "利害關係人" }} />
      <Stack.Screen name="mypoint"      options={{ headerTitle: "我的積分" }} />
      <Stack.Screen name="editProfile"      options={{ headerTitle: "編輯個人資料" }} />
    </Stack>
  );
}
