import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { router } from "expo-router";
import { Platform } from "react-native";
import { API_BASE_URL } from "../constants/config";

const DEVICE_ID_KEY = "pushDeviceId";

let notificationHandlerConfigured = false;

function canUseNativePush() {
  return Platform.OS !== "web" && Constants.appOwnership !== "expo";
}

function getNotificationsModule() {
  if (!canUseNativePush()) return null;

  const Notifications = require("expo-notifications");

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

async function getDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated =
    Constants.sessionId ||
    `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await AsyncStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

async function saveFcmToken(authToken, fcmToken) {
  if (!authToken || !fcmToken) return;

  const response = await fetch(`${API_BASE_URL}/api/mobile/device-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fcmToken,
      platform: Platform.OS === "android" ? "Android" : "iOS",
      deviceId: await getDeviceId(),
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Device token save failed (${response.status})`);
  }
}

export async function registerForPushNotificationsAsync(authToken) {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return null;
  }

  if (!authToken) return null;

  if (!Device.isDevice) {
    console.log("[push] Use a real device or Play Services emulator for FCM push testing.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16a34a",
      sound: "default",
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;

  if (finalStatus !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== "granted") {
    console.log("[push] Notification permission was not granted.");
    return null;
  }

  const devicePushToken = await Notifications.getDevicePushTokenAsync();
  const fcmToken = devicePushToken?.data;

  await saveFcmToken(authToken, fcmToken);
  return fcmToken;
}

export function listenForPushTokenChanges(authToken) {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return { remove: () => {} };
  }

  return Notifications.addPushTokenListener((token) => {
    saveFcmToken(authToken, token?.data).catch((error) => {
      console.log("[push] Failed to refresh FCM token:", error?.message || error);
    });
  });
}

export function setupNotificationListeners({
  refreshNotifications,
  refreshNews,
  refreshRequests,
  refreshConfiguration,
  onRequestStatusChanged,
} = {}) {
  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return () => {};
  }

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data || {};
    const type = String(data.type ?? data.Type ?? "").toLowerCase();

    if (type === "request_status_changed" || type === "disbursement_status_changed") {
      onRequestStatusChanged?.(data);
      refreshRequests?.();
      refreshNotifications?.();
      return;
    }

    if (type === "configuration_changed") {
      refreshConfiguration?.(data);
      return;
    }

    if (type === "news") {
      refreshNews?.();
      return;
    }

    if (type === "notification") {
      refreshNotifications?.();
      return;
    }

    refreshNotifications?.();
    refreshNews?.();
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data || {};
    const type = String(data.type ?? data.Type ?? "").toLowerCase();

    if (type === "request_status_changed" || type === "disbursement_status_changed") {
      onRequestStatusChanged?.(data);
      refreshRequests?.();
      refreshNotifications?.();
      const requestType = String(data.requestType ?? data.RequestType ?? "").toLowerCase();
      router.push(requestType === "advance" ? "/(app)/cash-request" : "/(app)/fertilizerItem-request");
      return;
    }

    if (type === "configuration_changed") {
      refreshConfiguration?.(data);
      router.push("/(app)/fertilizerItem-request");
      return;
    }

    if (type === "news") {
      refreshNews?.();
      router.push("/(app)/home");
      return;
    }

    if (type === "notification") {
      refreshNotifications?.();
      router.push("/(app)/notifications");
      return;
    }

    refreshNotifications?.();
    refreshNews?.();
    router.push("/(app)/notifications");
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
