import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Input, ScreenHeader, Toast } from "../../components/ui";
import { useTheme } from "../../hooks/useTheme";
import { useApp } from "../../context/AppContext";
import { authApi, tokenStorage } from "../../utils/api";

export default function ProfileScreen() {
  const { colors, fs, t } = useTheme();
  const { currentUser, updateProfile } = useApp();
  const router = useRouter();

  const [image, setImage] = useState(currentUser?.image || null);
  const [address, setAddress] = useState(currentUser?.address || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access to change your profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill all password fields", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    setPwLoading(true);
    try {
      const token = await tokenStorage.get();
      await authApi.changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully!");
    } catch (err) {
      showToast(err.message || "Failed to change password", "error");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSave = async () => {
    if (!address.trim() || !phone.trim()) {
      showToast("Please fill all fields", "error");
      return;
    }
    if (!/^0\d{9}$/.test(phone.trim())) {
      showToast("Enter a valid 10-digit phone number", "error");
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ image, address, phone });
      showToast("Profile updated successfully!");
    } catch (_) {
      showToast("Failed to update profile. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={t.profile} onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 8}
      >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Profile Image */}
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: colors.primary,
              overflow: "hidden",
            }}>
              {image ? (
                <Image source={{ uri: image }} style={{ width: 110, height: 110 }} />
              ) : (
                <Ionicons name="person" size={52} color={colors.primary} />
              )}
            </View>
            <View style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.bg,
            }}>
              <Ionicons name="camera" size={fs.base} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={{ color: colors.textSecondary, fontSize: fs.xs, marginTop: 8 }}>{t.changeProfileImage}</Text>
        </View>

        {/* Read-only info */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Account Information
          </Text>
          <View style={{ gap: 10 }}>
            {[
              { label: "Full Name", value: currentUser?.name, icon: "person-outline" },
              { label: "Supplier ID", value: currentUser?.id, icon: "card-outline" },
              { label: "Username", value: currentUser?.username, icon: "at-outline" },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name={item.icon} size={fs.lg} color={colors.textMuted} />
                <View>
                  <Text style={{ color: colors.textMuted, fontSize: fs.xs }}>{item.label}</Text>
                  <Text style={{ color: colors.text, fontSize: fs.sm, fontWeight: "600" }}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Editable fields */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Edit Profile
          </Text>

          <Input
            label={t.address}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
          />

          <Input
            label={t.phoneNumber}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 0771234567"
            keyboardType="phone-pad"
          />

          <Button title={t.save} onPress={handleSave} loading={loading} icon="checkmark-circle" />
        </Card>

        {/* Change Password */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: fs.md, fontWeight: "700", color: colors.text, marginBottom: 16 }}>
            Change Password
          </Text>

          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secureTextEntry={!showCurrentPw}
            right={
              <TouchableOpacity onPress={() => setShowCurrentPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 6 characters"
            secureTextEntry={!showNewPw}
            right={
              <TouchableOpacity onPress={() => setShowNewPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secureTextEntry={!showConfirmPw}
            right={
              <TouchableOpacity onPress={() => setShowConfirmPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showConfirmPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <Button title="Change Password" onPress={handleChangePassword} loading={pwLoading} icon="lock-closed-outline" />
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
}
