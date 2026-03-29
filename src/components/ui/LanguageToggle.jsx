import React from "react";

export default function LanguageToggle() {
  const [lang, setLang] = React.useState(() => localStorage.getItem("gh_lang") || "de");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-lang", lang);
    localStorage.setItem("gh_lang", lang);
  }, [lang]);

  return (
    <div className="glass-surface px-1 py-1 rounded-full flex items-center gap-1">
      <button
        aria-label="Sprache Deutsch"
        onClick={() => setLang("de")}
        className={`px-2 py-1 text-xs rounded-full transition ${
          lang === "de" ? "bg-green-500/20 text-green-400" : "text-zinc-300 hover:text-white"
        }`}
      >
        DE
      </button>
      <button
        aria-label="Language English"
        onClick={() => setLang("en")}
        className={`px-2 py-1 text-xs rounded-full transition ${
          lang === "en" ? "bg-green-500/20 text-green-400" : "text-zinc-300 hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}