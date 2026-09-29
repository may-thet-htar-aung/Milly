import type { AdminUser, AuthResponse, Category, Listing, Paginated, Report, ReportStatus, User } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const ACCESS_KEY = "milly_access_token";
const REFRESH_KEY = "milly_refresh_token";

export const tokenStore = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set(tokens: Pick<AuthResponse, "accessToken" | "refreshToken">) {
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const refreshAccessToken = async () => {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: tokenStore.refresh }),
  });
  if (!response.ok) throw new Error("Session expired");
  const result = await response.json() as AuthResponse;
  tokenStore.set(result);
  return result.accessToken;
};

async function request<T>(path: string, options: RequestOptions = {}, canRefresh = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (tokenStore.access) headers.set("Authorization", `Bearer ${tokenStore.access}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include", body: options.body === undefined ? undefined : JSON.stringify(options.body) });
  if (response.status === 401 && canRefresh && tokenStore.refresh && !path.includes("/auth/refresh")) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, false);
    } catch {
      tokenStore.clear();
    }
  }

  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) throw new Error((payload as { error?: { message?: string } } | null)?.error?.message ?? "Something went wrong.");
  return payload as T;
}

export const api = {
  register: (body: { name: string; email: string; password: string }) => request<AuthResponse>("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) => request<AuthResponse>("/auth/login", { method: "POST", body }),
  logout: () => request<void>("/auth/logout", { method: "POST", body: { refreshToken: tokenStore.refresh } }, false),
  me: () => request<{ user: User }>("/auth/me"),
  updateProfile: (body: { phone?: string | null; location?: string | null; email?: string; currentPassword?: string; newPassword?: string }) => request<{ data: User }>("/users/me", { method: "PATCH", body }),
  user: (id: string) => request<{ data: User }>(`/users/${id}`),
  categories: () => request<{ data: Category[] }>("/categories"),
  listings: (params: URLSearchParams) => request<Paginated<Listing>>(`/listings?${params.toString()}`),
  listing: (id: string) => request<{ data: Listing }>(`/listings/${id}`),
  favorites: () => request<{ data: Listing[] }>("/users/me/favorites"),
  myListings: () => request<{ data: Listing[] }>("/users/me/listings"),
  createListing: (body: unknown) => request<{ data: Listing }>("/listings", { method: "POST", body }),
  updateListing: (id: string, body: unknown) => request<{ data: Listing }>(`/listings/${id}`, { method: "PATCH", body }),
  publishListing: (id: string) => request<{ data: Listing }>(`/listings/${id}/publish`, { method: "POST" }),
  reserveListing: (id: string) => request<{ data: Listing }>(`/listings/${id}/reserve`, { method: "POST" }),
  markListingSold: (id: string) => request<{ data: Listing }>(`/listings/${id}/mark-sold`, { method: "POST" }),
  archiveListing: (id: string) => request<void>(`/listings/${id}`, { method: "DELETE" }),
  favorite: (id: string) => request<void>(`/listings/${id}/favorite`, { method: "POST" }),
  unfavorite: (id: string) => request<void>(`/listings/${id}/favorite`, { method: "DELETE" }),
  adminListings: (params: URLSearchParams) => request<Paginated<Listing>>(`/admin/listings?${params.toString()}`),
  adminReports: () => request<{ data: Report[] }>("/admin/reports"),
  updateReport: (id: string, status: ReportStatus) => request<{ data: Report }>(`/admin/reports/${id}`, { method: "PATCH", body: { status } }),
  updateListingStatus: (id: string, status: Listing["status"]) => request<{ data: Listing }>(`/admin/listings/${id}/status`, { method: "PATCH", body: { status } }),
  setListingVisibility: (id: string, hidden: boolean) => request<{ data: Listing }>(`/admin/listings/${id}/visibility`, { method: "PATCH", body: { hidden } }),
  adminUsers: () => request<{ data: AdminUser[] }>("/admin/users"),
  adminUser: (id: string) => request<{ data: AdminUser }>(`/admin/users/${id}`),
  updateUserStatus: (id: string, isActive: boolean) => request<{ data: { id: string; isActive: boolean } }>(`/admin/users/${id}/status`, { method: "PATCH", body: { isActive } }),
};
