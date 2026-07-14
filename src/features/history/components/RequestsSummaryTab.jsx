import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Card } from "../../../components/ui";
import { EmptyNote } from "./EmptyNote";
import { RequestRow } from "./RequestRow";
import { StatRow } from "./StatRow";
import { SummarySection } from "./SummarySection";

export function RequestsSummaryTab({ colors, fs, t, summaryMonths, activeSummaryKey, setSelectedMonth, monthSummary, requestsSummary }) {
  return (
    <>
      <Text
        style={{
          fontSize:      fs.sm,
          fontWeight:    "700",
          color:         colors.textSecondary,
          marginBottom:  12,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {t("selectMonth")}
      </Text>

      {/* Month pill picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        <View style={{ flexDirection: "row", gap: 10 }}>
          {summaryMonths.map((m) => {
            const active = m.key === activeSummaryKey;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedMonth(m.key)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical:   10,
                  borderRadius:      25,
                  backgroundColor:   active ? colors.primary : colors.surface,
                  borderWidth:       1.5,
                  borderColor:       active ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color:      active ? "#fff" : colors.textSecondary,
                    fontSize:   fs.sm,
                    fontWeight: "600",
                  }}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {monthSummary ? (
        <>
          {/* ── Cash Requests ── */}
          <SummarySection
            icon="💵"
            title={t("cashRequests")}
            accentColor="#16a34a"
            count={monthSummary.cash?.count ?? 0}
            colors={colors}
            fs={fs}
          >
            {(monthSummary.cash?.count ?? 0) > 0 ? (
              <>
                <StatRow label={t("totalAmount")} value={`Rs. ${(monthSummary.cash?.totalAmount ?? 0).toLocaleString()}`} colors={colors} fs={fs} />
                <StatRow label={t("pending")}     value={monthSummary.cash?.pendingCount  ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("approved")}    value={monthSummary.cash?.approvedCount ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("paid")}        value={monthSummary.cash?.paidCount     ?? 0} colors={colors} fs={fs} />
                {(monthSummary.cash?.requests ?? []).map((r, i) => (
                  <RequestRow
                    key={i}
                    left={`Rs. ${Number(r.amount ?? 0).toLocaleString()}`}
                    requestDate={r.requestDate}
                    status={r.status}
                    colors={colors}
                    fs={fs}
                    t={t}
                  />
                ))}
              </>
            ) : (
              <EmptyNote text={t("noCashRequests")} colors={colors} fs={fs} />
            )}
          </SummarySection>

          {/* ── Fertilizer Requests ── */}
          <SummarySection
            icon="🌿"
            title={t("fertilizerRequests")}
            accentColor="#0891b2"
            count={monthSummary.fertilizer?.count ?? 0}
            colors={colors}
            fs={fs}
          >
            {(monthSummary.fertilizer?.count ?? 0) > 0 ? (
              <>
                <StatRow label={t("totalQty")}    value={`${monthSummary.fertilizer?.totalQuantity ?? 0} units`} colors={colors} fs={fs} />
                <StatRow label={t("pending")}     value={monthSummary.fertilizer?.pendingCount    ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("approved")}    value={monthSummary.fertilizer?.approvedCount   ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("dispatched")}  value={monthSummary.fertilizer?.dispatchedCount ?? 0} colors={colors} fs={fs} />
                {(monthSummary.fertilizer?.requests ?? []).map((r, i) => (
                  <RequestRow
                    key={i}
                    left={`${r.fertilizerType} — ${r.quantity} ${r.unit ?? "kg"}`}
                    requestDate={r.requestDate}
                    status={r.status}
                    colors={colors}
                    fs={fs}
                    t={t}
                  />
                ))}
              </>
            ) : (
              <EmptyNote text={t("noFertilizerRequests")} colors={colors} fs={fs} />
            )}
          </SummarySection>

          {/* ── Item Requests ── */}
          <SummarySection
            icon="📦"
            title={t("itemRequests")}
            accentColor="#7c3aed"
            count={monthSummary.item?.count ?? 0}
            colors={colors}
            fs={fs}
          >
            {(monthSummary.item?.count ?? 0) > 0 ? (
              <>
                <StatRow label={t("totalQty")}  value={`${monthSummary.item?.totalQuantity ?? 0} units`} colors={colors} fs={fs} />
                <StatRow label={t("pending")}   value={monthSummary.item?.pendingCount    ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("approved")}  value={monthSummary.item?.approvedCount   ?? 0} colors={colors} fs={fs} />
                <StatRow label={t("issued")}    value={monthSummary.item?.issuedCount     ?? 0} colors={colors} fs={fs} />
                {(monthSummary.item?.requests ?? []).map((r, i) => (
                  <RequestRow
                    key={i}
                    left={`${r.itemType} — ${r.quantity} ${r.unit ?? "units"}`}
                    requestDate={r.requestDate}
                    status={r.status}
                    colors={colors}
                    fs={fs}
                    t={t}
                  />
                ))}
              </>
            ) : (
              <EmptyNote text={t("noItemRequests")} colors={colors} fs={fs} />
            )}
          </SummarySection>
        </>
      ) : (
        <Card>
          <Text
            style={{
              color:           colors.textSecondary,
              textAlign:       "center",
              paddingVertical: 16,
              fontSize:        fs.sm,
            }}
          >
            {requestsSummary.length === 0 ? t("loadingSummary") : t("noDataForMonth")}
          </Text>
        </Card>
      )}
    </>
  );
}
