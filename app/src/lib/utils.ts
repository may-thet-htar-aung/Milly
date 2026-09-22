import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatPrice = (amountMinor: number, currency: "USD" | "MMK") => {
  if (currency === "MMK") {
    const myanmarDigits = "၀၁၂၃၄၅၆၇၈၉";
    const digits = String(amountMinor).replace(/[0-9]/g, (digit) => myanmarDigits[Number(digit)] ?? digit);
    return `${digits} ကျပ်`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amountMinor / 100);
};

export const formatCondition = (condition: string) => condition.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
