import {
  getSecureItem,
  getStorageItem,
  removeSecureItem,
  removeStorageItem,
  secureStorage,
  setSecureItem,
  setStorageItem,
  SECURE_STORAGE_KEYS,
  STORAGE_KEYS,
  type TokenType,
} from '../storage';

const TOKEN = STORAGE_KEYS.token;
const SECURE_TOKEN = SECURE_STORAGE_KEYS.authToken;

export const getToken = () =>
  secureStorage ? getSecureItem(SECURE_TOKEN) : getStorageItem(TOKEN);
export const removeToken = () => {
  removeStorageItem(TOKEN);
  if (secureStorage) {
    removeSecureItem(SECURE_TOKEN);
  }
};
export const setToken = (value: TokenType) => {
  if (secureStorage) {
    setSecureItem(SECURE_TOKEN, value);
    return;
  }
  setStorageItem(TOKEN, value);
};
