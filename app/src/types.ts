export type Currency = "USD" | "MMK";
export type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
export type ListingStatus = "DRAFT" | "ACTIVE" | "SOLD" | "RESERVED" | "ARCHIVED";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl: string | null;
  phone?: string | null;
  bio?: string | null;
  location: string | null;
  role?: "USER" | "ADMIN";
  createdAt: string;
  listingCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: Category[];
}

export interface ListingImage {
  id: string;
  url: string;
  sortOrder: number;
  altText: string | null;
}

export interface Listing {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  priceMinor: number;
  currency: Currency;
  condition: ListingCondition;
  status: ListingStatus;
  location: string;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  seller: User;
  category: Category;
  images: ListingImage[];
  isFavorite?: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
