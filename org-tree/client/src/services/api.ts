const BASE = '/api';

async function request(url: string, options?: RequestInit) {
  const res = await fetch(BASE + url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Employees
  getEmployees: () => request('/employees'),
  getEmployee: (id: number) => request(`/employees/${id}`),
  createEmployee: (data: any) =>
    request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: any) =>
    request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  moveEmployee: (id: number, managerId: number | null) =>
    request(`/employees/${id}/move`, { method: 'PATCH', body: JSON.stringify({ managerId }) }),
  deleteEmployee: (id: number) =>
    request(`/employees/${id}`, { method: 'DELETE' }),
  deleteBranch: (id: number) =>
    request(`/employees/${id}/branch`, { method: 'DELETE' }),

  // Users
  getUsers: () => request('/users'),
  createUser: (data: any) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  changeRole: (id: number, role: string) =>
    request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  deactivateUser: (id: number) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  // Audit
  getAudit: (page = 1) => request(`/audit?page=${page}`),
};
