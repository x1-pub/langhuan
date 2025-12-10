/**
 * 语言
 */
export const LANG_KEY = 'LANGHUANGE_LANG';

/**
 * 主题
 */
export const THTME_KEY = 'LANGHUANGE_THEME';

const storage = {
  get(key: string) {
    return localStorage.getItem(key);
  },

  set(key: string, value: string) {
    return localStorage.setItem(key, value);
  },

  remove(key: string) {
    return localStorage.removeItem(key);
  },
};

export default storage;
