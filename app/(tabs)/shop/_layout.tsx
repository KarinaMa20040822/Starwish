// app/(tabs)/account/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ShopLayout() {
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
        headerBackTitleVisible: false,
        // ★ 標題顏色
        headerTitleStyle: { color: "#663399" },
      }}
    >
      <Stack.Screen name="index"           options={{ headerTitle: "星願指引" }} />
    </Stack>
  );
}
