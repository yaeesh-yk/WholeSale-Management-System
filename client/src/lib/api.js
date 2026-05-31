import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('ws_token');

const parseTokenExpiry = (token) => {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

const clearSession = () => {
  useAuthStore.getState().logout();
  window.location.replace('/login');
};

const request = async (path, options = {}, timeoutMs = 15000) => {
  const token = getToken();
  const expiresAt = parseTokenExpiry(token);
  if (token && expiresAt && Date.now() >= expiresAt) {
    clearSession();
    throw new Error('Session expired. Redirecting to login.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out', { cause: err });
    throw err;
  } finally {
    clearTimeout(id);
  }

  const text = await res.text();

  if (res.status === 401) {
    clearSession();
    throw new Error('Session expired. Redirecting to login.');
  }

  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    // Provide clearer error when server returns HTML or non-JSON
    const snippet = text ? text.slice(0, 500) : '<empty response>';
    throw new Error(`Expected JSON response but received: ${snippet}`, { cause: err });
  }

  if (!res.ok) throw new Error(data?.message || data?.errors?.[0]?.msg || 'Request failed');
  return data;
};

export const api = {
  // Auth
  health: () => request('/health', {}, 45000),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }, 60000),

  // Dashboard
  dashboard: () => request('/dashboard'),

  // Shopkeepers
  getShopkeepers: (search = '') => request(`/shopkeepers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createShopkeeper: (body) => request('/shopkeepers', { method: 'POST', body: JSON.stringify(body) }),
  updateShopkeeper: (id, body) => request(`/shopkeepers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteShopkeeper: (id) => request(`/shopkeepers/${id}`, { method: 'DELETE' }),
  getShopkeeperHistory: (id) => request(`/shopkeepers/${id}/history`),

  // Products
  getProducts: (search = '', lowStock = false) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (lowStock) params.set('lowStock', 'true');
    const q = params.toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  createProduct: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/orders${q ? `?${q}` : ''}`);
  },
  createOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getOrder: (id) => request(`/orders/${id}`),
  updateOrder: (id, body) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Payments
  createPayment: (body) => request('/payments', { method: 'POST', body: JSON.stringify(body) }),
  getPaymentsByShopkeeper: (shopkeeperId) => request(`/payments/shopkeeper/${shopkeeperId}`),
  getPayments: () => request('/payments'),
  // Backup / Restore
  backup: () => request('/backup'),
  restore: (data) => request('/restore', { method: 'POST', body: JSON.stringify(data) }),
};
