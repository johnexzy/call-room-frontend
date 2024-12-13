import Cookies from "js-cookie";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    const refreshToken = Cookies.get("refreshToken");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          credentials: "include",
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken: newRefreshToken } =
            await refreshResponse.json();
          Cookies.set("token", accessToken, {
            secure: true,
            sameSite: "strict",
          });
          Cookies.set("refreshToken", newRefreshToken, {
            secure: true,
            sameSite: "strict",
          });
          return fetchWithAuth(endpoint, options);
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }
    // Clear cookies and redirect to login
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    window.location.href = "/login";
  }

  return response;
}

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  responseType?: string;
}

export const apiClient = {
  get: (endpoint: string, options?: FetchOptions) =>
    fetchWithAuth(endpoint, options),

  post: async (endpoint: string, data?: any, options: FetchOptions = {}) => {
    const isFormData = data instanceof FormData;

    const defaultOptions: FetchOptions = {
      method: "POST",
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data),
      headers: {
        ...(isFormData
          ? {} // Let browser set Content-Type for FormData
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    };

    const response = await fetchWithAuth(endpoint, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    return response;
  },

  put: (endpoint: string, data: any, options?: FetchOptions) =>
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    }),

  delete: (endpoint: string, options?: FetchOptions) =>
    fetchWithAuth(endpoint, {
      method: "DELETE",
      ...options,
    }),
};

// Add new axios client
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor for authentication
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = Cookies.get("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          );

          Cookies.set("token", data.accessToken, {
            secure: true,
            sameSite: "strict",
          });
          Cookies.set("refreshToken", data.refreshToken, {
            secure: true,
            sameSite: "strict",
          });

          // Retry the original request
          const config = error.config;
          config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axiosInstance(config);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
        }
      }
      // Clear cookies and redirect to login
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const axiosClient = {
  get: <T>(endpoint: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T>(endpoint, config),

  post: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    axiosInstance.post<T>(endpoint, data, config),

  put: <T>(endpoint: string, data: any, config?: AxiosRequestConfig) =>
    axiosInstance.put<T>(endpoint, data, config),

  delete: <T>(endpoint: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T>(endpoint, config),
};
