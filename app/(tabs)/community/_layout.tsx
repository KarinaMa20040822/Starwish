// app/(tabs)/community/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function CommunityStack() {
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
        headerBackTitleVisible: false,     // （可選）隱藏返回文字
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: "星願社群" }} />
      <Stack.Screen name="post"  options={{ headerTitle: "貼文內容" }} />
      <Stack.Screen name="uploadPost"  options={{ headerTitle: "發布貼文" }} />
    </Stack>
  );
}
