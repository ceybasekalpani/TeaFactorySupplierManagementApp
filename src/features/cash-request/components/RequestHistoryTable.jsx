import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Card, EmptyState, StatusBadge } from "../../../components/ui";
import { formatCurrency, formatDate } from "../utils/formatters";

// Fixed column widths — header and rows both use these so they always align
const COL = {
  date:   160,
  month:  110,
  amount: 110,
  status: 100,
  action:  60,
};
const TABLE_MIN_WIDTH = COL.date + COL.month + COL.amount + COL.status + COL.action + 28; // +28 for paddingHorizontal*2

export function RequestHistoryTable({ colors, fs, t, advanceRequests, onRequestDelete }) {
  return (
    <>
      <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, marginBottom: 12 }}>
        {t.advanceRequestHistory}{advanceRequests.length > 0 ? ` (${advanceRequests.length})` : ""}
      </Text>

      {advanceRequests.length === 0 ? (
        <Card>
          <EmptyState icon="document-text-outline" message={t.noAdvanceRequestsYet} description={t.requestHistoryWillAppear} />
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
          {/* ── Horizontal scroll wrapper for responsive table ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ minWidth: TABLE_MIN_WIDTH, flexGrow: 1 }}
            bounces={false}
          >
            <View style={{ flex: 1, minWidth: TABLE_MIN_WIDTH }}>

              {/* Table Header */}
              <View style={{
                flexDirection: "row", backgroundColor: colors.primary + "10",
                paddingVertical: 14, paddingHorizontal: 14,
                borderBottomWidth: 2, borderBottomColor: colors.primary,
              }}>
                <Text style={{ width: COL.date, color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                  {t.requestDate?.charAt(0).toUpperCase() + t.requestDate?.slice(1).toLowerCase() || "Date"}
                </Text>

                <Text style={{ width: COL.month, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                  {t.month?.charAt(0).toUpperCase() + t.month?.slice(1).toLowerCase() || "Month"}
                </Text>

                <Text style={{ width: COL.amount, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "right", marginRight: 8 }}>
                  {t.amountRsHeader}
                </Text>

                <Text style={{ width: COL.status, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                  {t.status?.charAt(0).toUpperCase() + t.status?.slice(1).toLowerCase() || "Status"}
                </Text>

                <Text style={{ width: COL.action, color: colors.primary, fontSize: fs.sm, fontWeight: "700", textAlign: "center" }}>
                  {(t.action ?? "Action")?.charAt(0).toUpperCase() + (t.action ?? "Action")?.slice(1).toLowerCase()}
                </Text>
              </View>

              {/* Table Rows */}
              {advanceRequests.map((req, i) => (
                <View
                  key={req.id}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingVertical: 16, paddingHorizontal: 14,
                    borderBottomWidth: i < advanceRequests.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: i % 2 === 0 ? "transparent" : colors.surface + "40",
                  }}
                >
                  <Text style={{ width: COL.date, color: colors.text, fontSize: fs.sm, fontWeight: "500" }}>
                    {formatDate(req.createdAt)}
                  </Text>
                  <Text style={{ width: COL.month, color: colors.textSecondary, fontSize: fs.sm, textAlign: "center" }}>
                    {req.month || "-"}
                  </Text>
                  <Text style={{ width: COL.amount, color: colors.text, fontSize: fs.sm, fontWeight: "600", textAlign: "right", marginRight: 8 }}>
                    Rs. {formatCurrency(req.amount)}
                  </Text>
                  <View style={{ width: COL.status, alignItems: "center" }}>
                    <StatusBadge status={req.status || "pending"} size="small" />
                  </View>
                  {/* Delete button — only for pending */}
                  <View style={{ width: COL.action, alignItems: "center" }}>
                    {(req.status === "pending" || req.status === "Pending") && (
                      <TouchableOpacity onPress={() => onRequestDelete(req.id)}>
                        <Ionicons name="trash-outline" size={fs.lg} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {/* Table Footer */}
              <View style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                paddingVertical: 14, paddingHorizontal: 14,
                backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
                  {t.totalRequests}: {advanceRequests.length}
                </Text>
                <Text style={{ color: colors.primary, fontSize: fs.sm, fontWeight: "700" }}>
                  {t.total}: Rs. {formatCurrency(advanceRequests.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0))}
                </Text>
              </View>

            </View>
          </ScrollView>
          {/* ── End horizontal scroll wrapper ── */}
        </Card>
      )}
    </>
  );
}
