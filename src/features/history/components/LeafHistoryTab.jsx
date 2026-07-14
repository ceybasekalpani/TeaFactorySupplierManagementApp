import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button, Card } from "../../../components/ui";
import { BarChart } from "./BarChart";
import { PeriodSelector } from "./PeriodSelector";

export function LeafHistoryTab({ colors, fs, t, leafPeriod, setLeafPeriod, historyArray, maxNet, pdfLoading, onDownloadPdf }) {
  return (
    <>
      <PeriodSelector
        leafPeriod={leafPeriod}
        setLeafPeriod={setLeafPeriod}
        colors={colors}
        fs={fs}
        t={t}
      />

      {/* Summary KPI cards */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
        {[
          {
            label: leafPeriod === "6m" ? t("totalNetSixMo") : t("totalNetTwelveMo"),
            value: Math.round(
              historyArray.reduce((s, h) => s + (h?.totalNet || 0), 0)
            ),
            color: colors.primary,
            icon:  "🍃",
          },
          {
            label: t("collectionDays"),
            value: historyArray.reduce((s, h) => s + (h?.days || 0), 0),
            color: colors.accent,
            icon:  "📅",
          },
        ].map((kpi, i) => (
          <View
            key={i}
            style={{
              flex:            1,
              backgroundColor: colors.card,
              borderRadius:    16,
              padding:         16,
              borderWidth:     1,
              borderColor:     colors.cardBorder,
              alignItems:      "center",
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 6 }}>{kpi.icon}</Text>
            <Text
              style={{
                color:      kpi.color,
                fontSize:   fs.xl,
                fontWeight: "800",
              }}
            >
              {kpi.value.toLocaleString()}
            </Text>
            <Text
              style={{
                color:     colors.textSecondary,
                fontSize:  fs.xs,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              {kpi.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Bar chart card */}
      <Text
        style={{
          fontSize:      fs.sm,
          fontWeight:    "700",
          color:         colors.textSecondary,
          marginBottom:  10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {t("monthlyNetLeafCollection")}
      </Text>
      <Card style={{ marginBottom: 20, paddingVertical: 16, paddingHorizontal: 8 }}>
        <BarChart historyArray={historyArray} maxNet={maxNet} colors={colors} fs={fs} t={t} />
      </Card>

      {/* Table */}
      <Text
        style={{
          fontSize:      fs.sm,
          fontWeight:    "700",
          color:         colors.textSecondary,
          marginBottom:  10,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {leafPeriod === "6m" ? t("sixMonthSummary") : t("twelveMonthSummary")}
      </Text>

      <View
        style={{
          backgroundColor: colors.card,
          borderRadius:    16,
          borderWidth:     1,
          borderColor:     colors.cardBorder,
          overflow:        "hidden",
          marginBottom:    20,
        }}
      >
        {/* Table header */}
        <View
          style={{
            flexDirection:     "row",
            backgroundColor:   colors.primary,
            paddingVertical:   14,
            paddingHorizontal: 16,
          }}
        >
          {[t("month"), t("gross"), t("net"), t("days")].map((h, i) => (
            <Text
              key={h}
              style={{
                flex:       i === 0 ? 2 : 1,
                color:      "#fff",
                fontSize:   fs.xs,
                fontWeight: "700",
                textAlign:  i === 0 ? "left" : "right",
              }}
            >
              {h}
            </Text>
          ))}
        </View>

        {historyArray.length > 0 ? (
          <>
            {historyArray.map((m, i) => (
              <View
                key={m?.key || i}
                style={{
                  flexDirection:     "row",
                  alignItems:        "center",
                  paddingVertical:   14,
                  paddingHorizontal: 16,
                  borderBottomWidth: i < historyArray.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                  backgroundColor:
                    i % 2 === 1 ? colors.surface + "60" : "transparent",
                }}
              >
                <Text
                  style={{
                    flex:       2,
                    color:      colors.text,
                    fontSize:   fs.sm,
                    fontWeight: "600",
                  }}
                >
                  {m?.label ?? "-"}
                </Text>
                <Text
                  style={{
                    flex:      1,
                    color:     colors.textSecondary,
                    fontSize:  fs.sm,
                    textAlign: "right",
                  }}
                >
                  {Math.round(m?.totalGross ?? 0).toLocaleString()}
                </Text>
                <Text
                  style={{
                    flex:       1,
                    color:      colors.primary,
                    fontSize:   fs.sm,
                    fontWeight: "700",
                    textAlign:  "right",
                  }}
                >
                  {Math.round(m?.totalNet ?? 0).toLocaleString()}
                </Text>
                <Text
                  style={{
                    flex:      1,
                    color:     colors.textSecondary,
                    fontSize:  fs.sm,
                    textAlign: "right",
                  }}
                >
                  {m?.days ?? 0}
                </Text>
              </View>
            ))}

            {/* Totals row */}
            <View
              style={{
                flexDirection:     "row",
                paddingVertical:   14,
                paddingHorizontal: 16,
                backgroundColor:   colors.primary + "15",
                borderTopWidth:    2,
                borderTopColor:    colors.primary,
              }}
            >
              <Text style={{ flex: 2, color: colors.primary, fontSize: fs.sm, fontWeight: "800" }}>
                {t("total")}
              </Text>
              <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                {Math.round(historyArray.reduce((s, m) => s + (m?.totalGross ?? 0), 0)).toLocaleString()}
              </Text>
              <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                {Math.round(historyArray.reduce((s, m) => s + (m?.totalNet ?? 0), 0)).toLocaleString()}
              </Text>
              <Text style={{ flex: 1, color: colors.primary, fontSize: fs.sm, fontWeight: "800", textAlign: "right" }}>
                {historyArray.reduce((s, m) => s + (m?.days ?? 0), 0)}
              </Text>
            </View>
          </>
        ) : (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontSize: fs.sm }}>
              {t("noDataForPeriod")}
            </Text>
          </View>
        )}
      </View>

      {/* PDF download */}
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius:    16,
          padding:         18,
          borderWidth:     1,
          borderColor:     colors.cardBorder,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems:    "center",
            gap:           14,
            marginBottom:  16,
          }}
        >
          <View
            style={{
              width:           48,
              height:          48,
              borderRadius:    14,
              backgroundColor: colors.primary + "15",
              alignItems:      "center",
              justifyContent:  "center",
            }}
          >
            <Ionicons name="document-text" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: fs.md, fontWeight: "700" }}>
              {leafPeriod === "6m" ? t("sixMonthLeafStatement") : t("annualLeafStatement")}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 2 }}>
              {leafPeriod === "6m" ? t("downloadSixMonth") : t("downloadAnnual")}
            </Text>
          </View>
        </View>
        <Button
          title={leafPeriod === "6m" ? t("downloadSixMonthBtn") : t("downloadAnnualBtn")}
          onPress={onDownloadPdf}
          loading={pdfLoading}
          icon="download"
        />
      </View>
    </>
  );
}
