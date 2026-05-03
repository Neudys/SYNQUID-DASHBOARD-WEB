export const BACKEND_BASE_URL = process.env.BACKEND_URL!

/**
 * BACKEND — real server paths (PascalCase, C# API).
 * Used server-side via `backendFetch(BACKEND.*)`.
 */
export const BACKEND = {
  auth: {
    register:       '/api/Auth/Register',
    login:          '/api/Auth/login',
    logout:         '/api/Auth/logout',
    refresh:        '/api/Auth/refresh',
    forgotPassword: '/api/Auth/forgotPassword',
    resetPassword:  '/api/Auth/resetPassword',
    validateToken:  '/api/Auth/validateToken',
    verifyEmail:    '/api/Auth/verifyEmail',
    /** /me lives under /api/User, but exposed here for convenience */
    me:             '/api/User/me',
  },
  users: {
    me:       '/api/User/me',
    list:     '/api/User',
    create:   '/api/User',
    detail:   (id: string) => `/api/User/${id}`,
    update:   (id: string) => `/api/User/${id}`,
    delete:   (id: string) => `/api/User/${id}`,
    setRole:  (id: string) => `/api/User/${id}/role`,
    nfc:      (id: string) => `/api/User/${id}/nfc`,
    groups:   (id: string) => `/api/User/${id}/groups`,
  },
  attendance: {
    /** Primary paged history — used as the list endpoint */
    all:        '/api/Attendance/All',
    list:       '/api/Attendance/history',
    history:    '/api/Attendance/history',
    myHistory:  '/api/Attendance/myHistory',
    today:      '/api/Attendance/today',
    stats:      '/api/Attendance/stats',
    export:     '/api/Attendance/export',
    check:      '/api/Attendance/check',
    register:   '/api/Attendance/Register',
    sync:       '/api/Attendance/sync',
    manual:      '/api/Attendance/manual',
    detail:      (id: string) => `/api/Attendance/${id}`,
    update:      (id: string) => `/api/Attendance/${id}`,
    /** Backend currently exposes no DELETE for attendance — kept for legacy route */
    delete:      (id: string) => `/api/Attendance/${id}`,
    /** DailyAttendance — upsert único (crea o actualiza según userId+scheduleId+date) */
    dailyUpsert: '/api/Attendance/daily',
    dailyGroup:  (groupId: string) => `/api/Attendance/daily/group/${groupId}`,
  },
  devices: {
    list:          '/api/Devices',
    create:        '/api/Devices',
    detail:        (id: string) => `/api/Devices/${id}`,
    update:        (id: string) => `/api/Devices/${id}`,
    delete:        (id: string) => `/api/Devices/${id}`,
    regenerateKey: (id: string) => `/api/Devices/${id}/regenerateKey`,
    heartbeat:     (id: string) => `/api/Devices/${id}/heartbeat`,
    status:        (id: string) => `/api/Devices/${id}/status`,
    logs:          (id: string) => `/api/Devices/${id}/logs`,
    byInstitution: (institutionId: string) =>
      `/api/Devices/byInstitution/${institutionId}`,
  },
  /** Alias kept so legacy references to BACKEND.readers continue to resolve */
  readers: {
    list:          '/api/Devices',
    create:        '/api/Devices',
    detail:        (id: string) => `/api/Devices/${id}`,
    update:        (id: string) => `/api/Devices/${id}`,
    delete:        (id: string) => `/api/Devices/${id}`,
    regenerateKey: (id: string) => `/api/Devices/${id}/regenerateKey`,
  },
  institutions: {
    list:           '/api/Institutions',
    create:         '/api/Institutions',
    detail:         (id: string) => `/api/Institutions/${id}`,
    update:         (id: string) => `/api/Institutions/${id}`,
    delete:         (id: string) => `/api/Institutions/${id}`,
    users:          (id: string) => `/api/Institutions/${id}/users`,
    removeUser:     (id: string, userId: string) =>
      `/api/Institutions/${id}/users/${userId}`,
    devices:        (id: string) => `/api/Institutions/${id}/devices`,
    attendance:     (id: string) => `/api/Institutions/${id}/attendance`,
  },
  nfc: {
    list:        '/api/Nfc',
    register:    '/api/Nfc/register',
    assignCard:  '/api/Nfc/AssignCard',
    byUid:       (uid: string) => `/api/Nfc/${uid}`,
    update:      (id: string) => `/api/Nfc/${id}`,
    delete:      (id: string) => `/api/Nfc?id=${encodeURIComponent(id)}`,
  },
  groups: {
    list:          '/api/Group',
    create:        '/api/Group',
    detail:        (id: string) => `/api/Group/${id}`,
    update:        (id: string) => `/api/Group/${id}`,
    delete:        (id: string) => `/api/Group/${id}`,
    members:       (id: string) => `/api/Group/${id}/members`,
    removeMember:  (id: string, userId: string) => `/api/Group/${id}/members/${userId}`,
    schedules:     (id: string) => `/api/Group/${id}/schedules`,
  },
  teacher: {
    myGroups:      '/api/Teacher/myGroups',
    groupStudents: (groupId: string) => `/api/Teacher/groups/${groupId}/students`,
  },
  dashboard: {
    /** No backend endpoint — the Next.js route aggregates stats + today */
    summary: '/api/Attendance/stats',
  },
} as const

/**
 * API — Next.js internal proxy routes under /app/api/*.
 * Used client-side via fetch(API.*). These paths are local, not the backend.
 */
export const API = {
  auth: {
    login:  '/api/auth/login',
    logout: '/api/auth/logout',
    me:     '/api/auth/me',
  },
  attendance: '/api/attendance',
  attendanceAll: '/api/attendance/all',
  readers:       '/api/readers',
  users:         '/api/users',
  institutions:  '/api/institutions',
  groups:        '/api/groups',
  dashboard:  '/api/dashboard/summary',
  nfc:        '/api/nfc',
  nfcAssign:  '/api/nfc/assign',
  student: {
    myGroups: '/api/student/myGroups',
  },
  groupsSchedules:       (id: string) => `/api/groups/${id}/schedules`,
  attendanceDailyGroup: (groupId: string) => `/api/attendance/daily/group/${groupId}`,
  attendanceDaily:      '/api/attendance/daily',
} as const
