import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ListingStatus } from "../types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const burmeseDigits = "၀၁၂၃၄၅၆၇၈၉";
const toBurmeseDigits = (value: string) => value.replace(/\d/g, (digit) => burmeseDigits[Number(digit)]);

export const formatPrice = (amountMinor: number, currency: "USD" | "MMK") => {
  const burmese = document.documentElement.lang === "my";
  if (currency === "MMK") {
    return burmese ? `${toBurmeseDigits(String(amountMinor))}ကျပ်` : `${amountMinor} Ks`;
  }
  const dollars = amountMinor / 100;
  if (!burmese) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(dollars);
  const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(dollars);
  return `USD ${toBurmeseDigits(amount)}`;
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

export const formatCount = (value: number) => {
  const text = String(value);
  if (document.documentElement.lang !== "my") return text;
  return toBurmeseDigits(text);
};

export const formatDate = (value: string) => {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  if (document.documentElement.lang !== "my") return `${day}/${month}/${year}`;
  return `${toBurmeseDigits(day)}ရက် ${toBurmeseDigits(month)}လ ${toBurmeseDigits(year)}`;
};

export const formatListingStatus = (status: ListingStatus) => status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const listingStatusTone = (status: ListingStatus): "default" | "green" | "amber" | "pink" => status === "ACTIVE" ? "green" : status === "DRAFT" ? "amber" : status === "SOLD" ? "pink" : "default";
