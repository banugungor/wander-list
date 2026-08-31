import { translations } from "@/constants/translations";
import { APP_LANGUAGE_KEY } from "@/data/storageKeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Language = "tr" | "en";

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslateFn;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolvePath(key: string, language: Language): string | undefined {
  const parts = key.split(".");
  let node: unknown = translations[language];
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : "",
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Renders with the "tr" default immediately (no blocking on the
  // AsyncStorage read) — that read never resolves during static/SSR
  // rendering, which would otherwise blank the entire app. If the user
  // previously chose "en", this flips right after mount.
  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    AsyncStorage.getItem(APP_LANGUAGE_KEY).then((stored) => {
      if (stored === "tr" || stored === "en") setLanguageState(stored);
    });
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(APP_LANGUAGE_KEY, next);
  };

  const t = useMemo<TranslateFn>(
    () => (key, params) =>
      interpolate(resolvePath(key, language) ?? resolvePath(key, "en") ?? key, params),
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
