import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "./config";

// Equivalent of the web app's getAuthHeaders() helper, but using
// AsyncStorage instead of localStorage (RN has no localStorage/DOM).
const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("TOKEN");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

// Central place to react to 401/403 the way the original JS files did
// (redirect to login + clear token). Screens catch AUTH_EXPIRED to navigate.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return Promise.reject({ ...error, isAuthExpired: true });
    }
    return Promise.reject(error);
  }
);

export default client;
