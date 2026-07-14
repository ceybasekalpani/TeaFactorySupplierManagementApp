import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { getGreeting } from "../utils/greeting";

export function WelcomeBanner({ colors, fs, t, currentUser, activeReg, dateStr }) {
  return (
    <View style={{ margin: 16, borderRadius: 22, overflow: "hidden", backgroundColor: colors.primary }}>
      <View style={{ position: "absolute", right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.08)" }} />
      <View style={{ position: "absolute", right: 30, bottom: -40, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)" }} />
      <View style={{ position: "absolute", left: -20, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)" }} />
      <View style={{ padding: 20 }}>
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: fs.sm }}>{getGreeting(t)},</Text>
        <Text style={{ color: "#fff", fontSize: fs["2xl"], fontWeight: "800", marginTop: 2 }}>
          {currentUser?.name} 👋
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <View style={{
            backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4,
          }}>
            <Ionicons name="card-outline" size={fs.xs} color="#fff" />
            <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "600" }}>{currentUser?.id}</Text>
          </View>
          {activeReg?.route && (
            <View style={{
              backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 4,
            }}>
              <Ionicons name="map-outline" size={fs.xs} color="#fff" />
              <Text style={{ color: "#fff", fontSize: fs.xs, fontWeight: "600" }}>
                {activeReg.route.split(" - ")[0]}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: fs.xs, marginTop: 10 }}>{dateStr}</Text>
      </View>
    </View>
  );
}
