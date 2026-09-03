/**
 * i18n.js
 * Handles language detection, switching and persistence.
 * Exposes a small global `I18N` object used by main.js.
 */

const I18N = (() => {
  const SUPPORTED_LANGS = ["en", "es", "de"];
  const DEFAULT_LANG = "en";
  const STORAGE_KEY = "claudia-site-lang";

  let translations = null;
  let content = null;
  let currentLang = DEFAULT_LANG;

  function detectInitialLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;

    const browserLangs = navigator.languages || [navigator.language || DEFAULT_LANG];
    for (const bl of browserLangs) {
      const short = bl.slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.includes(short)) return short;
    }
    return DEFAULT_LANG;
  }

async function loadData() {
  const [tRes, cRes, sRes] = await Promise.all([
    fetch("data/translations.json"),
    fetch("data/content.json"),
    fetch("data/schedule.json"),
  ]);
  translations = await tRes.json();
  content = await cRes.json();
  const scheduleData = await sRes.json();
  content.schedule = scheduleData.schedule;
}

  /** Resolve a dotted path like "sections.bio" against an object */
  function resolvePath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
  }

  function t(path) {
    const value = resolvePath(translations[currentLang], path);
    if (value !== undefined) return value;
    // fallback to default language
    return resolvePath(translations[DEFAULT_LANG], path) ?? "";
  }

  function c(path) {
    const node = resolvePath(content, path);
    if (node && typeof node === "object" && !Array.isArray(node)) {
      return node[currentLang] ?? node[DEFAULT_LANG] ?? "";
    }
    return node;
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute("lang", lang);
    applyStaticTranslations();
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
  }

  /** Applies translations to every element with a data-i18n attribute
   *  that is NOT sourced from content.json (those are handled in main.js
   *  since they need multi-paragraph / list rendering). */
  function applyStaticTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const source = el.getAttribute("data-i18n-source");
      if (source === "content") return; // handled separately in main.js
      const value = t(key);
      if (value) el.textContent = value;
    });

    document.querySelectorAll(".lang-switch__btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === currentLang);
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === currentLang ? "true" : "false");
    });
  }

  function getLang() {
    return currentLang;
  }

  async function init() {
    await loadData();
    currentLang = detectInitialLang();
    document.documentElement.setAttribute("lang", currentLang);
    return { translations, content, lang: currentLang };
  }

  return { init, setLang, getLang, t, c, get content() { return content; } };
})();
