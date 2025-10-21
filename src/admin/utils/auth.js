const API_KEY_STORAGE_KEY = 'admin_api_key'

export function setApiKey(apiKey) {
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
}

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
}

export function isAuthenticated() {
  return !!getApiKey()
}
