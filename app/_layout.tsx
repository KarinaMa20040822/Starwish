// app/_layout.tsx
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerTitleAlign: "center",
            headerTitleStyle: { color: "#663399", fontWeight: "700" },
          }}
        >
          {/* Tabs 容器本身隱藏 header */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* 設定頁：固定返回標籤顯示「星願指引」 */}
          <Stack.Screen
            name="setting"
            options={{
              title: "設定",
              headerBackTitle: "返回",
            }}
          />

          {/* 訂閱頁：同樣固定返回標籤 */}
          <Stack.Screen
            name="subscribe"
            options={{
              title: "星願指引Pro",
            }}
          />
          <Stack.Screen
            name="editProfile"
            options={{
              title: "個人資料",
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
