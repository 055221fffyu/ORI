import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://ori-4a2l.onrender.com",
});

api.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

// 每次請求自動帶上 localStorage 裡的 Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;