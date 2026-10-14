const BASE_URL = 'http://localhost:5000/api';

/**
 * Universal API Client with automatic JWT injection
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('hrms_token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type if sending FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle PDF or CSV blob downloads
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    if (!response.ok) {
      throw new Error(`File download failed with status ${response.status}`);
    }
    return response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, body) =>
    apiRequest(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: (url, body) =>
    apiRequest(url, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: (url, body = {}) =>
    apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
  download: (url) => apiRequest(url, { method: 'GET' }),
};
