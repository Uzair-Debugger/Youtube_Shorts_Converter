import "dotenv/config"
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  success: boolean;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'access_token';
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'refresh_token';

// what decodeJwtPayload do?
// The decodeJwtPayload function takes a JWT token as input and decodes its payload (the middle part of the token).
// It extracts the base64url-encoded payload, converts it to standard base64, decodes it from base64 to a UTF-8 string,
// and then parses the resulting JSON string into a JavaScript object.
// If any step fails (e.g., invalid token format), it returns null.
export function decodeJwtPayload(token: string): { exp: number; id: string; email: string } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const decoded = decodeJwtPayload(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.message || 'Request failed');
  }
  return data as T;
}

export interface CreateJobResponse {
  jobId: string;
  message: string;
  youtubeUrl: string;
  noOfShorts: number;
}

export interface JobStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  shorts?: any[];
}

export const authApi = {
  register: async (name: string, email: string, password: string): Promise<RegisterResponse> => {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    return parseResponse<RegisterResponse>(response);
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    return parseResponse<LoginResponse>(response);
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });
    return parseResponse<RefreshResponse>(response);
  },

  logout: async (refreshToken: string): Promise<LogoutResponse> => {
    const response = await fetch(`${API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      credentials: 'include',
    });
    return parseResponse<LogoutResponse>(response);
  },

  createJob: async (youtubeUrl: string, noOfShorts: number): Promise<CreateJobResponse> => {
    const response = await authenticatedFetch(`${API_URL}/api/v1/job/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl, noOfShorts }),
    });
    return parseResponse<CreateJobResponse>(response);
  },

  getJob: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await authenticatedFetch(`${API_URL}/api/v1/job/status/${jobId}`);
    return parseResponse<JobStatusResponse>(response);
  },
};
// what does tokenStorage function do?
/*
The `tokenStorage` object provides a set of utility functions for managing authentication tokens (access and refresh tokens) in the browser's local storage and cookies. It includes methods to get, set, and clear tokens, as well as to manage the access token cookie. Here's a breakdown of its functionality:
- `getAccessToken`: Retrieves the access token from local storage.
- `getRefreshToken`: Retrieves the refresh token from local storage.
- `setTokens`: Stores both access and refresh tokens in local storage.
- `clearTokens`: Removes both tokens from local storage.
- `setAccessTokenCookie`: Sets the access token in a cookie with an expiration time of 15 minutes.
- `clearAccessTokenCookie`: Clears the access token cookie.
*/

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  setAccessTokenCookie: (token: string): void => {
    if (typeof window === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + 15 * 60 * 1000);
    document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(token)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  },

  clearAccessTokenCookie: (): void => {
    if (typeof window === 'undefined') return;
    document.cookie = `${ACCESS_TOKEN_KEY}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  },
};

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = tokenStorage.getAccessToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refresh = tokenStorage.getRefreshToken();
    if (refresh) {
      try {
        const data = await authApi.refresh(refresh);
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        tokenStorage.setAccessTokenCookie(data.accessToken);
        const newHeaders = new Headers(options.headers);
        newHeaders.set('Authorization', `Bearer ${data.accessToken}`);
        response = await fetch(url, {
          ...options,
          headers: newHeaders,
        });
        return response;
      } catch {
        tokenStorage.clearTokens();
        tokenStorage.clearAccessTokenCookie();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    tokenStorage.clearTokens();
    tokenStorage.clearAccessTokenCookie();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}
