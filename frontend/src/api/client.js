import axios from 'axios';

export const baseURL = import.meta.env.VITE_API_URL || '/api';
export const assetUrl = (path) => {
  if (!path) return '';
  if (!import.meta.env.VITE_API_URL) return path;
  return new URL(import.meta.env.VITE_API_URL).origin + path;
};

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken = null;
export const setToken = (t) => { accessToken = t; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;
const SKIP_REFRESH = /\/auth\/(login|register|refresh)/;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !SKIP_REFRESH.test(original.url)) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true }).finally(() => { refreshing = null; });
        const { data } = await refreshing;
        setToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        setToken(null);
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

export async function download(url, params, fallbackName) {
  const res = await api.get(url, { params, responseType: 'blob' });
  const name = /filename="(.+)"/.exec(res.headers['content-disposition'] || '')?.[1] || fallbackName;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(res.data);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
