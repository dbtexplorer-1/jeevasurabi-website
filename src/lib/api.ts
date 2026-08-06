const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_BASE_URL = configuredApiBaseUrl
  ? configuredApiBaseUrl.replace(/\/$/, "")
  : typeof window === "undefined"
    ? "http://localhost:8000"
    : `http://${window.location.hostname}:8000`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean } = {},
) {
  const headers = new Headers(init.headers);
  if (options.authenticated) {
    const token = getAuthToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.detail || "Something went wrong. Please try again.", response.status);
  }
  return response;
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  options: { authenticated?: boolean } = {},
) {
  const response = await apiFetch(path, init, options);
  return response.json() as Promise<T>;
}
