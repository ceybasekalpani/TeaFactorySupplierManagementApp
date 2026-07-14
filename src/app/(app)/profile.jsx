import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardView from "../../components/KeyboardView";
import { Button, Card, Input, ScreenHeader, Toast } from "../../components/ui";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../hooks/useTheme";
import { authApi, tokenStorage } from "../../utils/api";
import { buildChangePasswordSchema, buildProfileSchema } from "../../schemas/profileSchema";

export default function ProfileScreen() {
  const { colors, fs, t } = useTheme();
  const { currentUser, updateProfile, pauseSessionLock } = useApp();
  const router = useRouter();

  const [imageAsset, setImageAsset] = useState(null);
  const [imageKey, setImageKey] = useState(0);
  const prevImage = useRef(null);

  useEffect(() => {
    if (currentUser?.image && currentUser.image !== prevImage.current) {
      prevImage.current = currentUser.image;
      setImageKey(k => k + 1);
    }
  }, [currentUser?.image]);

  const displayImage = imageAsset?.uri || currentUser?.image || null;

  const [name, setName] = useState(currentUser?.name || "");
  const [address, setAddress] = useState(currentUser?.address || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [phone2, setPhone2] = useState(currentUser?.phone2 || "");
  const [phone3, setPhone3] = useState(currentUser?.phone3 || "");
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

  const getProfileUpdateError = (err) => {
    const message = err?.message || "";
    if (
      err?.status >= 500 &&
      (message.includes("supabase.co") ||
        message.includes("No such host") ||
        message.includes("HttpRequestException"))
    ) {
      return t.imageStorageUnreachable;
    }
    return message || (t.updateFailed || "Update failed");
  };

  const pickImage = async () => {
    // Suspend indefinitely for the whole native picker/crop flow — its
    // duration is user-controlled (browsing the gallery, cropping) and can't
    // be bounded by a fixed timer without racing slower interactions.
    pauseSessionLock?.(Infinity);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t.permissionNeeded || "Permission needed",
                    t.allowPhotoAccess || "Please allow photo library access to change your profile picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        exif: false,
        base64: true,
      });
      if (!result.canceled) {
        setImageAsset(result.assets[0]);
      }
    } catch (err) {
      showToast(err.message || t.selectImageFailed, "error");
    } finally {
      // Back to a normal timed grace window covering review + Save.
      pauseSessionLock?.();
    }
  };

  const handleChangePassword = async () => {
    const validation = buildChangePasswordSchema(t).safeParse({ currentPassword, newPassword, confirmPassword });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
    }
    setPwLoading(true);
    try {
      const token = await tokenStorage.get();
      await authApi.changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t.passwordChangedSuccess || "Password changed successfully!");
    } catch (err) {
      showToast(err.message || (t.passwordChangeFailed || "Failed to change password"), "error");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSave = async () => {
    const validation = buildProfileSchema(t).safeParse({ name, address, phone });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
    }

    setLoading(true);
    pauseSessionLock?.();
    try {
      await updateProfile({
        imageAsset, 
        name, 
        address, 
        phone, 
        phone2, 
        phone3 
      });
      setImageAsset(null);
      showToast(t.profileUpdatedSuccess || "Profile updated successfully!");
    } catch (err) {
      showToast(getProfileUpdateError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1ea] dark:bg-[#121212]">
      <ScreenHeader title={t.profile} onBack={() => router.back()} />

      <KeyboardView>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="px-4 pt-4 pb-[60px]">
            <View className="mb-6 items-center">
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                <View className="h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#2e7d32] bg-[#f5f5f5] dark:border-[#66bb6a] dark:bg-[#1e1e1e]">
                  {displayImage ? (
                    <Image
                      source={{ uri: displayImage }}
                      className="h-[110px] w-[110px]"
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      key={imageKey}
                    />
                  ) : (
                    <Ionicons name="person" size={52} color={colors.primary} />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-[#f5f1ea] bg-[#2e7d32] dark:border-[#121212] dark:bg-[#66bb6a]">
                  <Ionicons name="camera" size={fs.base} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text className="mt-2 text-[11px] text-[#757575] dark:text-[#b0b0b0]">
                {t.changeProfileImage}
              </Text>
            </View>

            <Card className="mb-4">
              <Text className="mb-4 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.accountDetails}
              </Text>
              <View className="gap-2.5">
                {[
                  { label: t.fullName || "Full Name", value: currentUser?.name, icon: "person-outline" },
                  { label: t.supplierID || "Supplier ID", value: currentUser?.id, icon: "card-outline" },
                ].map((item) => (
                  <View key={item.label} className="flex-row items-center gap-2.5">
                    <Ionicons name={item.icon} size={fs.lg} color={colors.textMuted} />
                    <View>
                      <Text className="text-[11px] text-[#9e9e9e]">{item.label}</Text>
                      <Text className="text-[13px] font-semibold text-[#212121] dark:text-white">{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            <Card className="mb-4">
              <Text className="mb-4 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.editProfile || "Edit Profile"}
              </Text>

              <Input
                label={t.fullName || "Full Name"}
                value={name}
                onChangeText={setName}
                placeholder={t.enterFullName || "Enter your full name"}
              />

              <Input
                label={t.address}
                value={address}
                onChangeText={setAddress}
                placeholder={t.enterAddress || "Enter your address"}
              />

              <Input
                label={t.primaryPhone || "Primary Phone"}
                value={phone}
                onChangeText={setPhone}
                placeholder={t.phoneExample || "e.g. 0771234567"}
                keyboardType="phone-pad"
              />

              <Input
                label={t.secondaryPhone || "Secondary Phone (Optional)"}
                value={phone2}
                onChangeText={setPhone2}
                placeholder={t.phoneExample || "e.g. 0771112223"}
                keyboardType="phone-pad"
              />

              <Input
                label={t.additionalPhone || "Additional Phone (Optional)"}
                value={phone3}
                onChangeText={setPhone3}
                placeholder={t.phoneExample || "e.g. 0112223334"}
                keyboardType="phone-pad"
              />

              <Button title={t.save} onPress={handleSave} loading={loading} icon="checkmark-circle" />
            </Card>

            <Card className="mb-4">
              <Text className="mb-4 text-[17px] font-bold text-[#212121] dark:text-white">
                {t.changePassword || "Change Password"}
              </Text>

            <Input
              label={t.currentPassword || "Current Password"}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder={t.enterCurrentPassword || "Enter current password"}
              secureTextEntry={!showCurrentPw}
              right={
                <TouchableOpacity onPress={() => setShowCurrentPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showCurrentPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />

            <Input
              label={t.newPassword || "New Password"}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t.enterNewPassword || "Enter new password"}
              secureTextEntry={!showNewPw}
              right={
                <TouchableOpacity onPress={() => setShowNewPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showNewPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />

            <Input
              label={t.confirmNewPassword || "Confirm New Password"}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t.reEnterNewPassword || "Re-enter new password"}
              secureTextEntry={!showConfirmPw}
              right={
                <TouchableOpacity onPress={() => setShowConfirmPw(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showConfirmPw ? "eye-off-outline" : "eye-outline"} size={fs.lg} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />

              <Button 
                title={t.changePassword || "Change Password"} 
                onPress={handleChangePassword} 
                loading={pwLoading} 
                icon="lock-closed-outline" 
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardView>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onDismiss={() => setToast({ ...toast, visible: false })} />
    </SafeAreaView>
  );
}
