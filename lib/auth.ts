import Cookies from 'js-cookie';

export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('token', accessToken, { secure: true, sameSite: 'strict' });
  Cookies.set('refreshToken', refreshToken, { secure: true, sameSite: 'strict' });
};

export const clearAuthTokens = () => {
  Cookies.remove('token');
  Cookies.remove('refreshToken');
};

export const getAuthToken = () => {
  return Cookies.get('token');
};

export const getRefreshToken = () => {
  return Cookies.get('refreshToken');
}; 