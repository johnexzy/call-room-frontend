import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5200/api/v1";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = Cookies.get('token');
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401) {
    const refreshToken = Cookies.get('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
          Cookies.set('token', accessToken, { 
            secure: true,
            sameSite: 'strict'
          });
          Cookies.set('refreshToken', newRefreshToken, {
            secure: true,
            sameSite: 'strict'
          });
          return fetchWithAuth(endpoint, options);
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }
    // Clear cookies and redirect to login
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    window.location.href = '/login';
  }

  return response;
}

export const apiClient = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  post: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) =>
    fetchWithAuth(endpoint, {
      method: "DELETE",
    }),
}; 