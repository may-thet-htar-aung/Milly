import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ListingStatus } from "../types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatPrice = (amountMinor: number, currency: "USD" | "MMK") => {
  if (currency === "MMK") {
    return `${amountMinor} Ks`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amountMinor / 100);
};

export const formatCondition = (condition: string) => condition.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export const formatListingStatus = (status: ListingStatus) => status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const listingStatusTone = (status: ListingStatus): "default" | "green" | "amber" | "pink" => status === "ACTIVE" ? "green" : status === "DRAFT" ? "amber" : status === "SOLD" ? "pink" : "default";
