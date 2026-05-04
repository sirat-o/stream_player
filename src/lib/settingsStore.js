export const SETTINGS_KEY = "msp_app_settings";

export const defaultSettings = {
  theme: "dark",
  playMuted: false,
};

export const normalizeSettings = (value = {}) => ({
  ...defaultSettings,
  ...value,
  theme: value?.theme === "light" ? "light" : "dark",
  playMuted: Boolean(value?.playMuted),
});

export const getSettings = () => {
  if (typeof localStorage === "undefined") return { ...defaultSettings };

  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch (error) {
    return { ...defaultSettings };
  }
};

export const applyTheme = (theme = "dark") => {
  if (typeof document === "undefined") return;
  const safeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = safeTheme;
  document.documentElement.style.colorScheme = safeTheme;
};

export const saveSettings = (settings) => {
  if (typeof localStorage === "undefined") return normalizeSettings(settings);

  const next = normalizeSettings(settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applyTheme(next.theme);
  window.dispatchEvent(new CustomEvent("msp-settings-changed", { detail: next }));
  return next;
};
