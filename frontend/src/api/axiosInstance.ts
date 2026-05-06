// src/api/axiosInstance.ts
import axios from "axios";

// 개발: VITE_API_BASE_URL=http://localhost:8000
// 프로덕션 (Vercel): 빈 문자열 → 같은 도메인의 /api/* 사용
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("[Request Error]", error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API Error] ${error.response.status} ${error.config?.url}`,
        error.response.data
      );
    } else if (error.request) {
      console.error("[Network Error] 서버에 연결할 수 없습니다.", error.message);
    } else {
      console.error("[Unknown Error]", error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
