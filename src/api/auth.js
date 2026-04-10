// src/api/auth.js    (create this file or update existing)
import axios from "axios";

const API = axios.create({
  baseURL: "https://remittance-frontend-olive.vercel.app/", // NO trailing slash here
});

// Optional: add token to every request after login
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token; // "Bearer " prefix NOT needed if your middleware expects raw token
  }
  return config;
});

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);