import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en, { type MessageKey } from "./en";
import my from "./my";

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

export function conditionLabel(t: I18nContextValue["t"], condition: string) {
  const key = ({ NEW: "conditionNew", LIKE_NEW: "conditionLikeNew", GOOD: "conditionGood", FAIR: "conditionFair", POOR: "conditionPoor" } as const)[condition];
  return key ? t(key) : condition;
}
