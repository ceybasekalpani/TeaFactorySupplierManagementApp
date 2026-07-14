import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";

export function DatePickerModal({ colors, fs, t, visible, onClose, calendarMonth, onMonthChange, selectedDate, onDayPress }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "#00000060", justifyContent: "center", padding: 20 }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1}>
          <View style={{ backgroundColor: colors.bg, borderRadius: 16, overflow: "hidden" }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: fs.lg, fontWeight: "700", color: colors.text, textAlign: "center" }}>
                {t.date ?? "Select Date"}
              </Text>
            </View>
            <Calendar
              current={calendarMonth}
              onMonthChange={onMonthChange}
              onDayPress={onDayPress}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: colors.primary },
              }}
              theme={{
                backgroundColor: colors.bg,
                calendarBackground: colors.bg,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: "#fff",
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.border,
                monthTextColor: colors.text,
                arrowColor: colors.primary,
              }}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
