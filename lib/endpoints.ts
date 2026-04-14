export const BACKEND_BASE_URL = process.env.BACKEND_URL!

export const BACKEND = {
  auth: {
    login:         '/api/auth/login',
    logout:        '/api/auth/logout',
    me:            '/api/auth/me',
    validateToken: '/api/auth/validate-token',
  },
  attendance: {
    list:   '/api/attendance',
    stats:  '/api/attendance/stats',
    delete: (id: string) => `/api/attendance/${id}`,
  },
  readers: {
    list:          '/api/readers',
    create:        '/api/readers',
    detail:        (id: string) => `/api/readers/${id}`,
    update:        (id: string) => `/api/readers/${id}`,
    delete:        (id: string) => `/api/readers/${id}`,
    regenerateKey: (id: string) => `/api/readers/${id}/regenerate-key`,
  },
  users: {
    list:           '/api/users',
    create:         '/api/users',
    detail:         (id: string) => `/api/users/${id}`,
    update:         (id: string) => `/api/users/${id}`,
    delete:         (id: string) => `/api/users/${id}`,
    forgotPassword: '/api/users/forgot-password',
    resetPassword:  '/api/users/reset-password',
  },
  dashboard: {
    summary: '/api/dashboard/summary',
  },
}

export const API = {
  auth: {
    login:  '/api/auth/login',
    logout: '/api/auth/logout',
  },
  attendance: '/api/attendance',
  readers:    '/api/readers',
  users:      '/api/users',
}
