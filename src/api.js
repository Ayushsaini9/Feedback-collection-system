const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(body.message || `Request failed with ${response.status}`);
  }
  return body.data;
}

export function apiLogin(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function apiRegister(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export function apiSubmitPublicResponse(publicId, answers) {
  return request(`/public/forms/${publicId}/responses`, {
    method: 'POST',
    body: JSON.stringify({ isAnonymous: true, answers })
  });
}
