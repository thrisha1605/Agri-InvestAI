import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { authService } from "@/lib/auth";

function normalizeApiBaseUrl(value: string | undefined) {
  const trimmed = String(value || "").trim();
  return trimmed.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const ENABLE_LOCAL_FALLBACKS =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_LOCAL_FALLBACKS === "true";

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ApiRequestConfig = AxiosRequestConfig & { body?: any };

export function isBackendSessionToken(token: string | null): token is string {
  if (!token) return false;
  
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
    requestConfig.baseURL = API_BASE_URL || undefined;

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

    console.error("API Error details:", axiosError);

    const isNetworkFailure = !axiosError.response;
    const message =
      axiosError.response?.data?.message ||
      (isNetworkFailure
        ? API_BASE_URL
          ? "Unable to reach the backend API. Check that the Render backend is deployed, listening on PORT, and allows your frontend origin."
          : "Unable to reach the backend API. Set VITE_API_URL to your deployed backend URL before building the frontend."
        : undefined) ||
      axiosError.message ||
      "Something went wrong.";

    throw new Error(message);
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
