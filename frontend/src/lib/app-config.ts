function normalizeApiBaseUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return '/api/v1';
  }
  return trimmed.replace(/\/+$/, '') || '/api/v1';
}

function normalizeStoragePrefix(value: string | undefined): string {
  const trimmed = value?.trim();
  return trimmed || 'digital-estate';
}

export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || 'Digital Estate',
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  authStoragePrefix: normalizeStoragePrefix(import.meta.env.VITE_AUTH_STORAGE_PREFIX),
} as const;
