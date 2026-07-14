import { useRef } from "react";
import { Animated, Dimensions, Text, TouchableOpacity, View } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");

// Creative Period Selector (animated sliding pill)
export function PeriodSelector({ leafPeriod, setLeafPeriod, colors, fs, t }) {
  const slideAnim = useRef(new Animated.Value(leafPeriod === "6m" ? 0 : 1)).current;

  const handleSelect = (val) => {
    Animated.spring(slideAnim, {
      toValue:         val === "6m" ? 0 : 1,
      useNativeDriver: false,
      speed:           20,
      bounciness:      6,
    }).start();
    setLeafPeriod(val);
  };

  const TRACK_H = 52;
  const PILL_W  = (SCREEN_W - 32 - 8) / 2;

  const pillLeft = slideAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [4, PILL_W + 4],
  });

  const options = [
    { value: "6m",  label: t("sixMonths"),    icon: "📆", sub: t("halfYear") },
    { value: "12m", label: t("twelveMonths"), icon: "🗓️", sub: t("fullYear") },
  ];

  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize:      fs.xs,
          fontWeight:    "600",
          color:         colors.textSecondary,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom:  10,
        }}
      >
        {t("reportingPeriod")}
      </Text>

      {/* Track */}
      <View
        style={{
          height:          TRACK_H,
          borderRadius:    16,
          backgroundColor: colors.surface,
          borderWidth:     1.5,
          borderColor:     colors.border,
          flexDirection:   "row",
          alignItems:      "center",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Animated sliding pill */}
        <Animated.View
          style={{
            position:        "absolute",
            left:            pillLeft,
            top:             4,
            bottom:          4,
            width:           PILL_W - 8,
            borderRadius:    12,
            backgroundColor: colors.primary,
            shadowColor:     colors.primary,
            shadowOffset:    { width: 0, height: 4 },
            shadowOpacity:   0.35,
            shadowRadius:    8,
            elevation:       6,
          }}
        />

        {options.map((o) => {
          const active = leafPeriod === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => handleSelect(o.value)}
              activeOpacity={0.8}
              style={{
                flex:           1,
                height:         TRACK_H,
                flexDirection:  "row",
                alignItems:     "center",
                justifyContent: "center",
                gap:            8,
                zIndex:         1,
              }}
            >
              <Text style={{ fontSize: 16 }}>{o.icon}</Text>
              <View>
                <Text
                  style={{
                    fontSize:   fs.sm,
                    fontWeight: "700",
                    color:      active ? "#fff" : colors.text,
                    lineHeight: 18,
                  }}
                >
                  {o.label}
                </Text>
                <Text
                  style={{
                    fontSize:   10,
                    color:      active ? "rgba(255,255,255,0.72)" : colors.textMuted,
                    lineHeight: 13,
                  }}
                >
                  {o.sub}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tick marks */}
      <View
        style={{
          flexDirection:  "row",
          justifyContent: "space-around",
          marginTop:      6,
        }}
      >
        {[...Array(13)].map((_, i) => {
          const isAnchor = i === 0 || i === 6 || i === 12;
          const filled   =
            (leafPeriod === "6m"  && i <= 6) ||
            (leafPeriod === "12m" && i <= 12);
          return (
            <View
              key={i}
              style={{
                width:           isAnchor ? 2 : 1,
                height:          isAnchor ? 6 : 4,
                borderRadius:    1,
                backgroundColor: filled ? colors.primary + "90" : colors.border,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
