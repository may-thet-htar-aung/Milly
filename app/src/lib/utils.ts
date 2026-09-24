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

export const minorToPriceInput = (priceMinor: number, currency: string) => {
  if (currency !== "USD") return String(priceMinor);
  const dollars = priceMinor / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
};

export const priceInputToMinor = (amount: string, currency: string) => {
  const value = Number(amount);
  return currency === "USD" ? Math.round(value * 100) : Math.round(value);
};

export const formatCondition = (condition: string) => condition.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export const formatListingStatus = (status: ListingStatus) => status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const listingStatusTone = (status: ListingStatus): "default" | "green" | "amber" | "pink" => status === "ACTIVE" ? "green" : status === "DRAFT" ? "amber" : status === "SOLD" ? "pink" : "default";
