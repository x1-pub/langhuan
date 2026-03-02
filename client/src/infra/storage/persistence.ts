export const LANGUAGE_STORAGE_KEY = 'LANGHUAN_LANGUAGE';
export const THEME_STORAGE_KEY = 'LANGHUAN_THEME';

const LEGACY_LANGUAGE_STORAGE_KEY = 'LANGHUANGE_LANG';
const LEGACY_THEME_STORAGE_KEY = 'LANGHUANGE_THEME';

// Backward compatibility aliases for existing imports.
export const LANG_KEY = LANGUAGE_STORAGE_KEY;
export const THTME_KEY = THEME_STORAGE_KEY;

const resolveLocalStorage = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const storage = {
  get(key: string) {
    try {
      return resolveLocalStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },

  set(key: string, value: string) {
    try {
      resolveLocalStorage()?.setItem(key, value);
    } catch {
      return;
    }
  },

  remove(key: string) {
    try {
      resolveLocalStorage()?.removeItem(key);
    } catch {
      return;
    }
  },

  getWithFallback(primaryKey: string, fallbackKeys: readonly string[]) {
    const primaryValue = storage.get(primaryKey);
    if (primaryValue !== null) {
      return primaryValue;
    }

    for (const fallbackKey of fallbackKeys) {
      const fallbackValue = storage.get(fallbackKey);
      if (fallbackValue === null) {
        continue;
      }
      storage.set(primaryKey, fallbackValue);
      storage.remove(fallbackKey);
      return fallbackValue;
    }

    return null;
  },
};

export const getPersistedLanguage = () =>
  storage.getWithFallback(LANGUAGE_STORAGE_KEY, [LEGACY_LANGUAGE_STORAGE_KEY]);

export const setPersistedLanguage = (language: string) => {
  storage.set(LANGUAGE_STORAGE_KEY, language);
};

export const getPersistedTheme = () =>
  storage.getWithFallback(THEME_STORAGE_KEY, [LEGACY_THEME_STORAGE_KEY]);

export const setPersistedTheme = (theme: string) => {
  storage.set(THEME_STORAGE_KEY, theme);
};

export default storage;
