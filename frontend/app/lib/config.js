const DEFAULT_WAGTAIL_BASE_URL = "http://127.0.0.1:8000";

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_WAGTAIL_BASE_URL).trim().replace(/\/+$/, "");
}

export function getWagtailBackendBaseUrl() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_WAGTAIL_BASE_URL);
}

export function getWagtailPagesApiUrl() {
  return `${getWagtailBackendBaseUrl()}/api/v2/pages/`;
}
