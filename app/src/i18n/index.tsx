import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en, { type MessageKey } from "./en";
import my from "./my";
import type { ListingStatus } from "../types";

export type { MessageKey };
export type Language = "en" | "my";

const catalogs = { en, my };
const storageKey = "milly.language";

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readLanguage(): Language {
  const stored = localStorage.getItem(storageKey);
  return stored === "my" ? "my" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(storageKey, language);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage: setLanguageState,
    t: (key, vars) => {
      const template = catalogs[language][key] ?? en[key];
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}

const categoryMessageKeyBySlug: Record<string, MessageKey> = {
  electronics: "categoryElectronics",
  "home-furniture": "categoryHomeFurniture",
  fashion: "categoryFashion",
  "vehicles-parts": "categoryVehiclesParts",
  "baby-kids": "categoryBabyKids",
  "books-media": "categoryBooksMedia",
  "sports-outdoors": "categorySportsOutdoors",
  "beauty-personal-care": "categoryBeautyPersonalCare",
  other: "categoryOther",
  "phones-tablets": "categoryPhonesTablets",
  computers: "categoryComputers",
  "shoes-accessories": "categoryShoesAccessories",
};

export function categoryLabel(t: I18nContextValue["t"], category: { slug: string; name: string }) {
  const key = categoryMessageKeyBySlug[category.slug];
  return key ? t(key) : category.name;
}

export function conditionLabel(t: I18nContextValue["t"], condition: string) {
  const key = ({ NEW: "conditionNew", LIKE_NEW: "conditionLikeNew", GOOD: "conditionGood", FAIR: "conditionFair", POOR: "conditionPoor" } as const)[condition];
  return key ? t(key) : condition;
}

export function listingStatusLabel(t: I18nContextValue["t"], status: ListingStatus) {
  const key = ({ ACTIVE: "published", DRAFT: "draft", RESERVED: "pendingReview", SOLD: "sold", ARCHIVED: "archived" } as const)[status];
  return key ? t(key) : status;
}
