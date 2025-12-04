// app/(tabs)/_layout.tsx
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, Pressable, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // 小圓底的 Tab 圖示
  const iconWrapper =
    (name: string) =>
    // eslint-disable-next-line react/display-name
    ({ color, focused }: { color: string; focused: boolean }) =>
      (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: focused ? "#9370DB" : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconSymbol size={24} name={name} color={focused ? "#fff" : color} />
        </View>
      );

  // 右上角設定鈕（固定色）
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
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerTitleStyle: { color: "#663399" },
        headerBackTitleVisible: false,
        headerRight: () => <Gear />,

        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="ask"
        options={{
          headerShown: false, // ask 有自己的 Stack header
          title: "",
          tabBarIcon: iconWrapper("star.square.on.square.fill"),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          headerShown: false, // community 有自己的 Stack header
          title: "",
          tabBarIcon: iconWrapper("person.2.fill"),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: iconWrapper("house.fill"),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          headerShown: false, // shop 有自己的 Stack header
          headerTitle: "星願指引",
          title: "",
          tabBarIcon: iconWrapper("bag.fill"),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          headerShown: false, // account 有自己的 Stack header
          title: "",
          tabBarIcon: iconWrapper("person.fill"),
        }}
      />
    </Tabs>
  );
}
