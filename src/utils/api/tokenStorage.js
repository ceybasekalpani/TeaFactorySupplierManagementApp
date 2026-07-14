import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "authToken";

export const tokenStorage = {
  get: () => AsyncStorage.getItem(TOKEN_KEY),
  set: (token) => AsyncStorage.setItem(TOKEN_KEY, token),
  remove: () => AsyncStorage.removeItem(TOKEN_KEY),
};
