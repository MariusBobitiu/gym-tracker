import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type TokenType,
} from '../storage';

const TOKEN = STORAGE_KEYS.token;

export const getToken = () => getStorageItem(TOKEN);
export const removeToken = () => removeStorageItem(TOKEN);
export const setToken = (value: TokenType) => setStorageItem(TOKEN, value);
