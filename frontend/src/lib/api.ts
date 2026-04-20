import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { authService } from "@/lib/auth";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ApiRequestConfig = AxiosRequestConfig & { body?: any };

export function isBackendSessionToken(token: string | null): token is string {
  if (!token) {
    return false;
  }

  // Demo/local sessions are valid for frontend routing, but the backend only accepts
  // tokens that it generated itself.
  if (
    token.startsWith("admin_token_") ||
    token.startsWith("local_admin_session_") ||
    token.startsWith("token_")
  ) {
    return false;
  }

  return true;
}

export async function apiRequest<T = unknown>(config: ApiRequestConfig): Promise<T> {
  try {
    const requestConfig = { ...config };
    if (requestConfig.body !== undefined && requestConfig.data === undefined) {
      requestConfig.data = requestConfig.body;
      delete requestConfig.body;
    }

    const token = authService.getToken();
    if (isBackendSessionToken(token)) {
      requestConfig.headers = {
        ...(requestConfig.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }

    const response: AxiosResponse<T> = await api.request<T>(requestConfig);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const isNetworkFailure = !axiosError.response;
    const message =
      (isNetworkFailure ? "Unable to reach the backend API. Make sure the backend is running and the frontend proxy is configured." : undefined) ||
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Something went wrong while communicating with the server.";
    throw new Error(message);
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
