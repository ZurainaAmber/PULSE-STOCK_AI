/**
 * PulseStock AI - API Client Layer
 * 
 * Base fetch client configured strictly according to contracts/api-spec.md:
 * - Base URL: Configurable via import.meta.env.VITE_API_BASE_URL (defaults to http://localhost:8000/api/v1)
 * - Standard JSON headers
 * - RFC 7807 compliant error handling
 * - Clean separation between live backend and mock mode
 */

import { API_BASE_URL } from '../constants/contracts';

// Configuration mode: 'mock' or 'live'.
// Default is 'mock' in Phase 1 for frontend independence until live backend is fully seeded.
let currentMode = 'mock';

export function setDataSourceMode(mode) {
  if (mode === 'live' || mode === 'mock') {
    currentMode = mode;
  }
}

export function getDataSourceMode() {
  return currentMode;
}

export function getAuthToken() {
  try {
    return localStorage.getItem('pulsestock_token') || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem('pulsestock_token', token);
    } else {
      localStorage.removeItem('pulsestock_token');
    }
  } catch (e) {
    console.error('Failed to access localStorage:', e);
  }
}

/**
 * Standard RFC 7807 Error Wrapper
 */
export class ApiError extends Error {
  constructor(code, message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint, params = {}) {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const url = new URL(`${API_BASE_URL}${normalizedEndpoint}`, base);
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      url.searchParams.append(key, val);
    }
  });
  return url.toString();
}

/**
 * Make an HTTP request to the live backend
 */
export async function apiClient(endpoint, options = {}) {
  const { method = 'GET', params = {}, body = null, headers = {} } = options;
  const url = buildUrl(endpoint, params);

  const token = getAuthToken();
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeader,
      ...headers,
    },
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestOptions);

    // Parse JSON response body
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check for HTTP errors or embedded RFC 7807 errors
    if (!response.ok || (data && data.error && !data.alert_id && !data.alerts)) {
      const errPayload = data && data.error ? data.error : {};
      const message =
        errPayload.message ||
        (data && data.detail) ||
        response.statusText ||
        'Unknown API Error';
      throw new ApiError(
        errPayload.code || `HTTP_${response.status}`,
        message,
        response.status,
        errPayload.details || data
      );
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network failure / Connection refused (e.g. backend server is not running)
    throw new ApiError(
      'NETWORK_ERROR',
      `Failed to connect to backend at ${API_BASE_URL}. Ensure FastAPI is running. (${err.message})`,
      0,
      { originalError: err.message }
    );
  }
}
