import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Card, EmptyState, StatusBadge } from "../../../components/ui";
import { formatDate, formatQty } from "../utils/formatters";

export function CombinedHistoryTable({ t, combinedHistory, onRequestDelete }) {
  if (combinedHistory.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="leaf-outline"
          message={t.noSupplyRequestsYet}
          description={t.supplyRequestHistoryWillAppear}
        />
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden p-0">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        <View className="min-w-[508px]">
          <View className="flex-row border-b-2 border-[#2e7d32] bg-[#2e7d32]/10 px-3.5 py-3 dark:border-[#66bb6a] dark:bg-[#66bb6a]/10">
            <Text className="w-[150px] text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
              {t.colDate?.charAt(0).toUpperCase() + t.colDate?.slice(1).toLowerCase() || "Date"}
            </Text>
            <Text className="w-[110px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
              {t.colType?.charAt(0).toUpperCase() + t.colType?.slice(1).toLowerCase() || "Type"}
            </Text>
            <Text className="w-[80px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
              {t.colQty?.charAt(0).toUpperCase() + t.colQty?.slice(1).toLowerCase() || "Qty"}
            </Text>
            <Text className="w-[90px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
              {t.status?.charAt(0).toUpperCase() + t.status?.slice(1).toLowerCase() || "Status"}
            </Text>
            <Text className="w-[50px] text-center text-[13px] font-bold text-[#2e7d32] dark:text-[#66bb6a]">
              {t.action?.charAt(0).toUpperCase() + t.action?.slice(1).toLowerCase()}
            </Text>
          </View>

          {combinedHistory.map((req, i) => (
            <View
              key={`${req.category}-${req.id || i}`}
              className={`flex-row items-center px-3.5 py-3.5 ${i < combinedHistory.length - 1 ? "border-b border-[#e0e0e0] dark:border-[#333333]" : ""} ${i % 2 === 0 ? "bg-transparent" : "bg-[#f5f5f5]/40 dark:bg-[#1e1e1e]/40"}`}
            >
              <Text numberOfLines={1} className="w-[150px] text-[11px] font-medium text-[#212121] dark:text-white">
                {formatDate(req.createdAt)}
              </Text>
              <Text numberOfLines={1} className="w-[110px] text-center text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                {req.displayType}
              </Text>
              <Text numberOfLines={1} className="w-[80px] text-center text-[11px] font-semibold text-[#212121] dark:text-white">
                {formatQty(
                  req.quantity,
                  req.category === "Other Item" ? "units" : (req.unit ?? "kg"),
                  t
                )}
              </Text>
              <View className="w-[90px] items-center">
                <StatusBadge status={req.status || "pending"} size="small" />
              </View>
              <View className="w-[50px] items-center">
                {(req.status === "pending" || req.status === "Pending") && (
                  <TouchableOpacity onPress={() => onRequestDelete(req)}>
                    <Ionicons name="trash-outline" size={19} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View className="flex-row items-center justify-between border-t border-[#e0e0e0] bg-[#f5f5f5] px-3.5 py-3 dark:border-[#333333] dark:bg-[#1e1e1e]">
            <Text className="text-[13px] text-[#757575] dark:text-[#b0b0b0]">
              {t.total}: {combinedHistory.length}
            </Text>
            <Text className="text-[11px] text-[#757575] dark:text-[#b0b0b0]">
              {combinedHistory.length} {combinedHistory[0]?.category === "Fertilizer" ? t.fertilizerLower : t.itemsLower}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Card>
  );
}
