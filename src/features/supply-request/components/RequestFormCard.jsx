import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { Button, Card, Input, Picker } from "../../../components/ui";
import { CategoryToggle } from "./CategoryToggle";

const titleText = "text-[19px] font-bold text-[#212121] dark:text-white";
const labelText = "text-[13px] font-semibold text-[#757575] dark:text-[#b0b0b0]";
const mutedText = "text-[11px] text-[#757575] dark:text-[#b0b0b0]";

export function RequestFormCard({
  colors, t,
  currentUser, activeReg,
  category, setCategory, currentMonth,
  selectedType, setSelectedType, currentTypes, supplyTypesLoading,
  unit, setUnit,
  quantity, setQuantity, quantityLabel, quantityPlaceholder,
  loading, onSubmit,
}) {
  return (
    <Card className="mb-6">
      <View className="mb-5 flex-row items-center gap-2.5">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${category === "fertilizer" ? "bg-[#dcfce7]" : "bg-[#fef3c7]"}`}>
          <Ionicons
            name={category === "fertilizer" ? "leaf-outline" : "cube-outline"}
            size={24}
            color={category === "fertilizer" ? "#16a34a" : "#d97706"}
          />
        </View>
        <View>
          <Text className={titleText}>
            {t.newFertilizerItemRequest}
          </Text>
          <Text className={mutedText}>
            {currentUser?.name || t.guest} - {activeReg?.regNo || t.noRegistration}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <Text className={`${labelText} mb-2`}>
          {t.requestType}
        </Text>
        <CategoryToggle colors={colors} t={t} category={category} onSelect={setCategory} />
      </View>

      <View className="mb-4">
        <Text className={`${labelText} mb-1.5`}>
          {t.month}
        </Text>
        <View className="flex-row items-center gap-2 rounded-[10px] border border-[#e0e0e0] bg-[#f5f5f5] px-3.5 py-3 dark:border-[#333333] dark:bg-[#1e1e1e]">
          <Ionicons name="calendar-outline" size={19} color={colors.primary} />
          <Text className="text-[15px] font-semibold text-[#212121] dark:text-white">{currentMonth}</Text>
        </View>
      </View>

      <Picker
        label={category === "fertilizer" ? t.fertilizerType : t.itemType}
        value={selectedType}
        options={currentTypes}
        onSelect={setSelectedType}
        placeholder={
          supplyTypesLoading
            ? t.loadingTypes
            : currentTypes.length === 0
              ? t.noTypesAvailable
              : category === "fertilizer"
                ? t.selectFertilizerType
                : t.selectItemType
        }
      />

      {category === "fertilizer" && (
        <View className="mb-4">
          <Text className={`${labelText} mb-2`}>
            {t.unit}
          </Text>
          <View className="flex-row gap-2.5">
            {[
              { key: "kg", label: t.unitKg },
              { key: "Nos", label: t.unitNos },
            ].map((u) => {
              const isActive = unit === u.key;
              return (
                <TouchableOpacity
                  key={u.key}
                  onPress={() => setUnit(u.key)}
                  className={`flex-1 items-center rounded-[10px] border-2 py-2.5 ${isActive ? "border-[#2e7d32] bg-[#2e7d32]/15 dark:border-[#66bb6a] dark:bg-[#66bb6a]/15" : "border-[#e0e0e0] bg-[#f5f5f5] dark:border-[#333333] dark:bg-[#1e1e1e]"}`}
                >
                  <Text className={`text-[13px] ${isActive ? "font-bold text-[#2e7d32] dark:text-[#66bb6a]" : "font-medium text-[#212121] dark:text-white"}`}>
                    {u.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <Input
        label={quantityLabel}
        value={quantity}
        onChangeText={setQuantity}
        placeholder={quantityPlaceholder}
        keyboardType="numeric"
      />

      <View className="mb-5 flex-row items-start gap-2 rounded-[10px] bg-[#dbeafe] p-3">
        <Ionicons name="information-circle" size={19} color="#2563eb" />
        <Text className="flex-1 text-[11px] text-[#1e40af]">
          {category === "fertilizer" ? t.fertilizerInfoNote : t.itemInfoNote}
        </Text>
      </View>

      <Button
        title={t.submitRequest}
        onPress={onSubmit}
        loading={loading}
        icon="send-outline"
      />
    </Card>
  );
}
