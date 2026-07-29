const API = '/api';

function getToken() {
  return localStorage.getItem('hoh_token');
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  if (res.status === 401) {
    localStorage.removeItem('hoh_token');
    localStorage.removeItem('hoh_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const auth = {
  login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => api('/auth/me')
};
