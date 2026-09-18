import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data;
    const status = err.response?.status;
    if (data?.code === "account_suspended") {
      window.dispatchEvent(new Event("auth:suspended"));
    } else if ((status === 401 || status === 422) && typeof data?.msg === "string") {
      // flask-jwt-extended's own error shape (expired/invalid/missing token) — distinct
      // from our app's {"error": "..."} responses (e.g. wrong login password).
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  },
);
