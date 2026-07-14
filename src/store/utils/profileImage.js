import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { API_BASE_URL } from "../../constants/config";

export const PROFILE_IMAGE_PATH_KEY = "profileImageLocalPath";
export const PROFILE_IMAGE_DIR = (FileSystem.documentDirectory ?? "") + "profiles/";

export const profileImagePathKey = (regNo) => `profileImageLocalPath_${regNo}`;

export async function getStoredLocalImagePath(regNo) {
  try {
    if (!regNo) return null;
    const stored = await AsyncStorage.getItem(profileImagePathKey(regNo));
    if (!stored) return null;
    const info = await FileSystem.getInfoAsync(stored);
    return info.exists ? stored : null;
  } catch (_) {
    return null;
  }
}

export async function activateLocalImagePath(newPath, regNo) {
  if (!regNo) return;
  try {
    const key = profileImagePathKey(regNo);
    const old = await AsyncStorage.getItem(key);
    if (old && old !== newPath) {
      FileSystem.deleteAsync(old, { idempotent: true }).catch(() => {});
    }
  } catch (_) {}
  await AsyncStorage.setItem(profileImagePathKey(regNo), newPath);
}

function newLocalImagePath() {
  return `${PROFILE_IMAGE_DIR}profile_${Date.now()}.jpg`;
}

export async function copyPickedImageLocally(sourceUri, regNo) {
  try {
    await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, { intermediates: true });
    const dest = newLocalImagePath();
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) {
      await activateLocalImagePath(dest, regNo);
      return dest;
    }
    return null;
  } catch (e) {
    console.log("[profile] copyAsync failed:", e?.message || e);
    return null;
  }
}

export async function downloadProfileImageViaBackend(token, regNo) {
  try {
    await FileSystem.makeDirectoryAsync(PROFILE_IMAGE_DIR, { intermediates: true });
    const dest = newLocalImagePath();
    const dl = await FileSystem.downloadAsync(
      `${API_BASE_URL}/api/settings/profile-image`,
      dest,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (dl.status === 200) {
      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) {
        await activateLocalImagePath(dest, regNo);
        return dest;
      }
    }
    return null;
  } catch (e) {
    console.log("[profile] backend download failed:", e?.message || e);
    return null;
  }
}
