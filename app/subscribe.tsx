import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

export default function SubscribeScreen() {
    return (
        <ScrollView style={styles.container}>
            <Image
                source={require("@/assets/images/pro-icon.png")}
                style={styles.proIcon}
            />
            <Text style={styles.title}>升級至 Pro 會員</Text>
            <Text style={styles.subtitle}>
                解鎖更多專業功能，讓星願指引成為你最強大的人生導師
            </Text>

            {/* 功能區塊 */}
            <Text style={styles.planTitle}>專屬會員功能</Text>

            {featureList.map((item, index) => (
                <View style={styles.featureBox} key={index}>
                    <View style={styles.featureRow}>
                        <View style={styles.featureIcon}>
                            <MaterialIcons name={item.icon} size={20} color="#fff" />
                        </View>
                        <View style={styles.featureContent}>
                            <Text style={styles.featureTitle}>{item.title}</Text>
                            <Text style={styles.featureDescription}>{item.description}</Text>
                        </View>
                    </View>
                </View>
            ))}

            {/* 價格方案區塊 */}
            <Text style={styles.planTitle}>選擇方案</Text>
            <View style={styles.planBox}>
                <Text style={styles.planName}>月付方案</Text>
                <Text style={styles.planPrice}>NT$ 99 / 月</Text>
                <Text style={styles.planNote}>靈活付費，隨時取消</Text>
            </View>
            <View style={styles.planBox}>
                <Text style={styles.planName}>年付方案</Text>
                <View style={styles.row}>
                    <Text style={styles.planPrice}>NT$ 990 / 年</Text>
                    <Text style={styles.planOldPrice}>NT$ 1188</Text>
                </View>
                <Text style={styles.planNote}>最划算選擇，平均每月僅83元</Text>
            </View>

            {/* 優勢區塊 */}
            <LinearGradient
                colors={["#C083EC", "#9153D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.benefitBox}
            >
                <Text style={styles.gradientTitle}>
                    <Ionicons name="sparkles" size={18} color="#fff" /> 會員專屬優勢
                </Text>
                <View style={styles.advantageRow}>
                    <View style={styles.advantageItem}>
                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                        <Text style={styles.advantageText}>無廣告干擾</Text>
                    </View>
                    <View style={styles.advantageItem}>
                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                        <Text style={styles.advantageText}>優先客服支援</Text>
                    </View>
                </View>
                <View style={styles.advantageRow}>
                    <View style={styles.advantageItem}>
                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                        <Text style={styles.advantageText}>獨家內容搶先看</Text>
                    </View>
                    <View style={styles.advantageItem}>
                        <Ionicons name="checkmark" size={16} color="#fff" style={styles.checkIcon} />
                        <Text style={styles.advantageText}>專屬會員活動</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* 升級按鈕 */}
            <Pressable style={styles.button}>
                <Text style={styles.buttonText}>立即升級 Pro 會員</Text>
            </Pressable>

            <Text style={styles.note}>
                點擊升級即視為同意會員條款與付費授權，可前往設定取消自動續費
            </Text>
        </ScrollView>
    );
}

const featureList = [
    {
        icon: "people",
        title: "利害關係人",
        description: "深度分析你的人際關係網，找出對你最重要的貴人與需要注意的關係"
    },
    {
        icon: "person-search",
        title: "每日貴人",
        description: "深度分析你的人際關係網，找出對你最重要的貴人與需要注意的關係"
    },
    {
        icon: "smart-toy",
        title: "AI解籤無限次",
        description: "深度分析你的人際關係網，找出對你最重要的貴人與需要注意的關係"
    },
    {
        icon: "card-giftcard",
        title: "幸運小物贈送",
        description: "深度分析你的人際關係網，找出對你最重要的貴人與需要注意的關係"
    }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f5f3ff',
    },
    proIcon: {
        width: 100,
        height: 100,
        alignSelf: "center",
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        textAlign: "center",
        color: "#666",
        fontSize: 14,
        marginBottom: 20,
        maxWidth: 230,
        alignSelf: "center",
    },
    featureDescription: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
        textAlign: "left",
        lineHeight: 18,
        maxWidth: 280,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    featureBox: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        gap: 12,
    },
    featureIcon: {
        backgroundColor: "#BFA2E0",
        padding: 8,
        borderRadius: 8,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: "bold",
    },
    featureText: {
        fontSize: 16,
        color: "#333",
    },
    planTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    planBox: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    planName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
        color: "#333",
    },
    planPrice: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#6C3EB5",
    },
    planOldPrice: {
        fontSize: 14,
        color: "#999",
        marginLeft: 8,
        textDecorationLine: "line-through",
    },
    planNote: {
        fontSize: 12,
        color: "#666",
        marginTop: 6,
    },
    row: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    benefitBox: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    gradientTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 12,
    },
    advantageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        gap: 12,
    },
    advantageItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    advantageText: {
        color: "#fff",
        fontSize: 14,
    },
    checkIcon: {
        marginRight: 4,
    },
    button: {
        backgroundColor: "#6C3EB5",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    note: {
        fontSize: 11,
        color: "#999",
        textAlign: "center",
        marginBottom: 50,
        marginTop: 10,
    },
});
