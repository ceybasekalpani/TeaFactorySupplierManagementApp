import { request } from "./client";

export const settingsApi = {
  get:            (token) => request("GET", "/api/settings", undefined, token),
  updateTheme:    (token, theme) => request("PUT", "/api/settings/theme", { theme }, token),
  updateLanguage: (token, language) => request("PUT", "/api/settings/language", { language }, token),
  updateFontSize: (token, fontSize) => request("PUT", "/api/settings/font-size", { fontSize }, token),

  updateProfileImage: (token, asset) => {
    let mimeType = asset.mimeType;
    if (!mimeType || mimeType === "image") {
      const uriExt = asset.uri?.split(".").pop()?.toLowerCase().split("?")[0];
      if (uriExt === "png") mimeType = "image/png";
      else if (uriExt === "webp") mimeType = "image/webp";
      else mimeType = "image/jpeg";
    }
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const fileName = asset.fileName || `profile.${ext}`;

    if (!asset.base64) {
      return Promise.reject(new Error("Image base64 data is missing. Ensure ImagePicker has base64: true"));
    }

    return request("PUT", "/api/settings/profile-image-base64", {
      imageBase64: asset.base64,
      fileName,
      mimeType,
    }, token);
  },

  updateSettings:       (token, data) => request("PUT", "/api/settings", data, token),
  updateAccountDetails: (token, data) => request("PUT", "/api/settings/account-details", data, token),
};
