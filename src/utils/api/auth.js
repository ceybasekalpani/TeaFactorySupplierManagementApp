import { request } from "./client";

export const authApi = {
  login: (username, password) =>
    request("POST", "/api/auth/login", { username, password }),
  me: (token) =>
    request("GET", "/api/auth/me", undefined, token),
  registrations: (token) =>
    request("GET", "/api/auth/registrations", undefined, token),
  selectRegistration: (token, regNo) =>
    request("POST", "/api/auth/select-registration", { regNo }, token),
  changePassword: (token, currentPassword, newPassword) =>
    request("POST", "/api/auth/change-password", { currentPassword, newPassword }, token),
  setupPin: (token, pin) =>
    request("POST", "/api/auth/setup-pin", { pin }, token),
  pinLogin: (regNo, pin) =>
    request("POST", "/api/auth/pin-login", { regNo, pin }),
  changePin: (token, currentPin, newPin) =>
    request("POST", "/api/auth/change-pin", { currentPin, newPin }, token),
};
