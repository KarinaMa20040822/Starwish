// app/(tabs)/account/_layout.tsx
import { Stack, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AskLayout() {
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
      <Stack.Screen name="asktarot"        options={{ headerTitle: "塔羅問事" }} />
      <Stack.Screen name="drawcards"      options={{ headerTitle: "塔羅問事" }} />
      <Stack.Screen name="droplottery"  options={{ headerTitle: "東方籤詩" }} />
      <Stack.Screen name="chat"  options={{ headerTitle: "聊天室" }} />
    </Stack>
  );
}
