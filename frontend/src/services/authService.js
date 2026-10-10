import { apiClient, setAuthToken, getAuthToken, setDataSourceMode } from '../api/client';

const USER_STORAGE_KEY = 'pulsestock_user';

export async function login(username, password) {
  const result = await apiClient('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  if (result?.token && result?.user) {
    setAuthToken(result.token);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
    } catch (e) {
      console.error('Failed to save user to localStorage:', e);
    }
    setDataSourceMode('live');
  }

  return result;
}

export async function logout() {
  try {
    await apiClient('/auth/logout', { method: 'POST' });
  } catch (e) {
    console.warn('Logout API call failed, proceeding with local cleanup:', e);
  } finally {
    setAuthToken(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear user from localStorage:', e);
    }
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const result = await apiClient('/auth/me');
    if (result?.user) {
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
      } catch (e) {
        console.error('Failed to update user in localStorage:', e);
      }
      return result.user;
    }
  } catch (err) {
    if (err.status === 401) {
      setAuthToken(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    return null;
  }
  return null;
}

export async function getDemoAccounts() {
  try {
    const result = await apiClient('/auth/demo-accounts');
    return result?.accounts || [];
  } catch {
    return [
      { username: 'mgr_store7', manager_name: 'Koramangala Manager', store_id: 'STORE_007', store_name: 'Store 7 - Koramangala Tech Park' },
      { username: 'mgr_store3', manager_name: 'Indiranagar Manager', store_id: 'STORE_003', store_name: 'Store 3 - Domlur Hub' },
      { username: 'mgr_store12', manager_name: 'HSR Layout Manager', store_id: 'STORE_012', store_name: 'Store 12 - Marathahalli Bridge' },
    ];
  }
}
