import { createContext, useContext, useState, useEffect } from "react";
import { LANGUAGES, translations } from "../translations/languages";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("girirakshak_lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("girirakshak_lang", lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
