import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Button, Card, Input } from "../../../components/ui";
import { formatCurrency, formatDisplayDate } from "../utils/formatters";

export function RequestFormCard({
  colors, fs, t,
  advanceLimit, amount, setAmount, amountNum,
  prevMonthLabel, currentMonthLabel, selectedMonthKey, setSelectedMonthKey,
  selectedDate, onOpenCalendar,
  loading, onSubmit,
}) {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 20 }}>
        {t.newAdvanceRequest}
      </Text>

      {/* Advance Limit Banner */}
      {advanceLimit !== null && (
        <View style={{
          backgroundColor: "#dcfce7", borderRadius: 10, padding: 12,
          flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#16a34a20", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="shield-checkmark" size={fs.lg} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#166534", fontSize: fs.xs, fontWeight: "600" }}>{t.yourAdvanceLimit}</Text>
            <Text style={{ color: "#166534", fontSize: fs.md, fontWeight: "800" }}>Rs. {formatCurrency(advanceLimit)}</Text>
            {amountNum > 0 && (
              <Text style={{ color: "#15803d", fontSize: fs.xs, marginTop: 2 }}>
                {t.remainingAfterRequest}: Rs. {formatCurrency(Math.max(0, advanceLimit - amountNum))}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Month Selector */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
          {t.selectMonth}
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[{ key: "prev", label: prevMonthLabel }, { key: "current", label: currentMonthLabel }].map((m) => {
            const isActive = selectedMonthKey === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedMonthKey(m.key)}
                style={{
                  flex: 1, paddingVertical: 10, paddingHorizontal: 8,
                  borderRadius: 10, borderWidth: 1.5,
                  borderColor: isActive ? colors.primary : colors.border,
                  backgroundColor: isActive ? colors.primary + "15" : colors.surface,
                  alignItems: "center", gap: 4,
                }}
              >
                <Ionicons name="calendar-outline" size={fs.base} color={isActive ? colors.primary : colors.textMuted} />
                <Text style={{ color: isActive ? colors.primary : colors.text, fontSize: fs.xs, fontWeight: isActive ? "700" : "500", textAlign: "center" }}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Calendar Date Picker trigger */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: colors.textSecondary, fontSize: fs.sm, fontWeight: "600", marginBottom: 8 }}>
          {t.date ?? "Date"}
        </Text>
        <TouchableOpacity
          onPress={onOpenCalendar}
          style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            backgroundColor: colors.surface, borderRadius: 10,
            borderWidth: 1.5, borderColor: colors.border,
            paddingHorizontal: 14, paddingVertical: 13,
          }}
        >
          <Ionicons name="calendar" size={fs.lg} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: fs.base, fontWeight: "600", flex: 1 }}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Ionicons name="chevron-down" size={fs.base} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <Input
        label={`${t.amountRs}${advanceLimit !== null ? `  ·  ${t.max} Rs. ${formatCurrency(advanceLimit)}` : ""}`}
        value={amount}
        onChangeText={(v) => {
          if (advanceLimit !== null) {
            const num = parseFloat(v);
            if (!isNaN(num) && num > advanceLimit) return;
          }
          setAmount(v);
        }}
        placeholder={t.enterAmount}
        keyboardType="numeric"
      />

      <View style={{
        backgroundColor: "#fef3c7", borderRadius: 10, padding: 12,
        flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 20,
      }}>
        <Ionicons name="information-circle" size={fs.lg} color="#d97706" />
        <Text style={{ color: "#92400e", fontSize: fs.xs, flex: 1 }}>{t.autoRejectWarning}</Text>
      </View>

      <Button title={t.submitRequest} onPress={onSubmit} loading={loading} icon="send-outline" />
    </Card>
  );
}
