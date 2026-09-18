import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

const STORAGE_KEY = "language";

function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // ignore
  }
  return "fr";
}

i18next.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: "fr" | "en") {
  i18next.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

export default i18next;
