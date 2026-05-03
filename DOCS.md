# SYNQUID Dashboard — Documentación Técnica

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Autenticación y Autorización](#4-autenticación-y-autorización)
5. [Roles y Permisos](#5-roles-y-permisos)
6. [Arquitectura de la API](#6-arquitectura-de-la-api)
7. [Endpoints del Backend (C# API)](#7-endpoints-del-backend-c-api)
8. [Rutas Proxy de Next.js](#8-rutas-proxy-de-nextjs)
9. [Sistema de Asistencia](#9-sistema-de-asistencia)
10. [Componentes Principales](#10-componentes-principales)
11. [Utilidades (lib/)](#11-utilidades-lib)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Sistema de Diseño](#13-sistema-de-diseño)

---

## 1. Descripción General

SYNQUID Dashboard es un sistema de gestión de asistencia escolar construido con **Next.js 15 (App Router)**. Sirve a tres tipos de usuarios — Administradores, Profesores y Estudiantes — cada uno con su propia vista y conjunto de permisos.

El frontend actúa como una **capa proxy** entre el navegador y un backend en C# ASP.NET Core. Todas las operaciones sensibles (token JWT, llamadas al backend) ocurren del lado del servidor; el cliente nunca se comunica directamente con el backend.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 15.x (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Estilos | TailwindCSS v4 + tema personalizado OKLCH |
| Componentes UI | Shadcn/UI (estilo base-nova) |
| Iconos | Lucide React |
| Animaciones | GSAP 3.x + @gsap/react |
| Tablas de datos | TanStack React Table v8 |
| Gráficos | Recharts v3 |
| Validación de formularios | Zod v4 |
| Notificaciones | Sonner |
| Arrastrar y soltar | @dnd-kit |
| Tema claro/oscuro | next-themes |
| Fuentes | DM Sans (sans), DM Mono (mono) |

---

## 3. Estructura del Proyecto

```
SYNQUID-DASHBOARD-WEB/
├── app/                    # Next.js App Router (páginas + rutas API)
│   ├── api/                # Rutas proxy del servidor
│   ├── dashboard/          # Páginas protegidas del dashboard
│   ├── login/              # Página de login (pública)
│   └── unauthorized/       # Página 403
├── components/             # Componentes React
│   └── ui/                 # Primitivos de Shadcn/UI
├── hooks/                  # Custom React hooks
├── lib/                    # Utilidades de servidor y cliente
├── middleware.ts           # Middleware JWT (protección de rutas)
├── .env.local              # Variables de entorno (no se sube al repo)
└── components.json         # Configuración de Shadcn/UI
```

### Páginas del Dashboard

| Ruta | Descripción | Quién la ve |
|---|---|---|
| `/dashboard` | Vista principal según rol | Todos los roles |
| `/dashboard/attendance` | Gestión de asistencia | Admin |
| `/dashboard/calendar` | Calendario del profesor | Profesor |
| `/dashboard/groups` | Gestión de grupos/clases | Admin |
| `/dashboard/institutions` | Gestión de instituciones | Admin |
| `/dashboard/nfc` | Gestión de tarjetas NFC | Admin |
| `/dashboard/readers` | Gestión de dispositivos | Admin |
| `/dashboard/users` | Gestión de usuarios | Admin |
| `/dashboard/settings` | Configuración | Todos los roles |

---

## 4. Autenticación y Autorización

### Flujo de Login

```
Navegador → POST /api/auth/login
          → Ruta Next.js hace proxy al backend
          → Backend devuelve JWT
          → Next.js establece cookie HttpOnly
          → Redirige a /dashboard
```

En cada petición posterior:

```
Navegador → Petición con cookie
          → middleware.ts intercepta
          → Decodifica JWT, verifica claim exp
          → Expirado → redirige a /login?from=[ruta]
          → Válido → continúa
```

### Cookie

| Propiedad | Valor |
|---|---|
| Nombre | `synquid_token` |
| Tipo | HttpOnly |
| SameSite | Lax |
| Max-Age | 604800 (7 días) |
| Secure | En producción |

### Guards del Lado del Servidor

```typescript
// Proteger una página para cualquier usuario autenticado
await requireAuth()

// Proteger una página para roles específicos
await requireRole([Role.Admin, Role.SuperAdmin])
```

Ambas funciones están en `lib/auth.ts` y se usan en Server Components y layouts.

### Hook del Lado del Cliente

```typescript
const { login, logout, loading, error } = useAuth()

await login(email, password) // → POST /api/auth/login
await logout()               // → POST /api/auth/logout → limpia la cookie
```

---

## 5. Roles y Permisos

Los roles están definidos en `lib/roles.ts` como constantes numéricas:

| Rol | Valor | Acceso |
|---|---|---|
| `SuperAdmin` | 0 | Todo |
| `Admin` | 1 | Todas las páginas del dashboard |
| `Professor` | 2 | Dashboard + Calendario |
| `Student` | 3 | Dashboard (solo sus propios datos) |

El middleware y `requireRole()` normalizan tanto el formato numérico (`2`) como el de texto (`"professor"`) provenientes del JWT.

### Vistas por Rol

- **Admin** — resumen con estadísticas, lectores activos, tabla de asistencia reciente
- **Profesor** — selector de grupo + calendario de asistencia (vista día/mes) de sus grupos
- **Estudiante** — pestañas: "Faltas", "Clases", "Calendario" con datos personales

---

## 6. Arquitectura de la API

El frontend usa un **patrón proxy**: todas las llamadas `fetch()` del cliente van a rutas API de Next.js (`/api/*`), que luego llaman a `backendFetch()` del lado del servidor. El JWT nunca sale del servidor.

```
Cliente (navegador)
    │  fetch('/api/attendance')
    ▼
Ruta API Next.js  (app/api/attendance/route.ts)
    │  backendFetch(BACKEND.attendance.list)
    ▼
Backend C# ASP.NET Core  (BACKEND_URL)
    │  Authorization: Bearer <jwt>
    ▼
Respuesta reenviada al cliente
```

### `backendFetch()` — `lib/api.ts`

```typescript
backendFetch(path: string, init?: RequestInit): Promise<Response>
```

- Solo para el servidor (lee la cookie via `next/headers`)
- Adjunta automáticamente el JWT como `Authorization: Bearer <token>`
- Siempre usa `cache: 'no-store'`
- Antepone `BACKEND_BASE_URL` (de `process.env.BACKEND_URL`)

### Mapas de Endpoints — `lib/endpoints.ts`

```typescript
BACKEND.*   // Rutas del backend C# — se usan con backendFetch() en el servidor
API.*       // Rutas proxy de Next.js — se usan con fetch() en el cliente
```

---

## 7. Endpoints del Backend (C# API)

Todas las rutas están bajo `BACKEND_BASE_URL`.

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/Auth/Register` | Registrar usuario |
| POST | `/api/Auth/login` | Login, devuelve JWT |
| POST | `/api/Auth/logout` | Logout |
| POST | `/api/Auth/refresh` | Refrescar token |
| GET | `/api/User/me` | Info del usuario actual |

### Usuarios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/User` | Listar usuarios |
| POST | `/api/User` | Crear usuario |
| GET | `/api/User/{id}` | Detalle de usuario |
| PUT | `/api/User/{id}` | Actualizar usuario |
| DELETE | `/api/User/{id}` | Eliminar usuario |
| PUT | `/api/User/{id}/role` | Asignar rol |
| GET | `/api/User/{id}/groups` | Grupos del usuario |

### Asistencia

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Attendance/All` | Historial completo paginado |
| GET | `/api/Attendance/history` | Historial |
| GET | `/api/Attendance/myHistory` | Historial del usuario actual |
| GET | `/api/Attendance/today` | Registros de hoy |
| GET | `/api/Attendance/stats` | Estadísticas agregadas |
| POST | `/api/Attendance/Register` | Registrar via NFC |
| POST | `/api/Attendance/manual` | Registro manual |
| **PUT** | **`/api/Attendance/daily`** | **Upsert DailyAttendance** |
| GET | `/api/Attendance/daily/group/{groupId}` | Roster diario de un grupo |
| GET/PUT | `/api/Attendance/{id}` | Detalle/actualización de registro |

### Grupos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Group` | Listar grupos |
| POST | `/api/Group` | Crear grupo |
| GET/PUT/DELETE | `/api/Group/{id}` | CRUD de grupo |
| GET | `/api/Group/{id}/members` | Miembros del grupo |
| DELETE | `/api/Group/{id}/members/{userId}` | Eliminar miembro |
| GET | `/api/Group/{id}/schedules` | Horarios del grupo |

### Profesor

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Teacher/myGroups` | Grupos asignados al profesor |
| GET | `/api/Teacher/groups/{groupId}/students` | Alumnos de un grupo |

### Instituciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Institutions` | Listar |
| POST | `/api/Institutions` | Crear |
| GET/PUT/DELETE | `/api/Institutions/{id}` | CRUD de institución |
| GET | `/api/Institutions/{id}/users` | Usuarios de la institución |
| GET | `/api/Institutions/{id}/devices` | Dispositivos de la institución |

### Dispositivos (Lectores)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Devices` | Listar |
| POST | `/api/Devices` | Crear |
| GET/PUT/DELETE | `/api/Devices/{id}` | CRUD de dispositivo |
| POST | `/api/Devices/{id}/regenerateKey` | Regenerar clave API |
| GET | `/api/Devices/{id}/status` | Estado del dispositivo |

### NFC

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/Nfc` | Listar tarjetas |
| POST | `/api/Nfc/register` | Registrar tarjeta |
| POST | `/api/Nfc/AssignCard` | Asignar tarjeta a usuario |
| GET/PUT | `/api/Nfc/{uid}` | Detalle de tarjeta |
| DELETE | `/api/Nfc?id={id}` | Eliminar tarjeta |

---

## 8. Rutas Proxy de Next.js

El código del cliente usa estas rutas mediante `fetch(API.*)`.

| Constante API | Ruta | Redirige a |
|---|---|---|
| `API.auth.login` | `/api/auth/login` | `BACKEND.auth.login` |
| `API.auth.logout` | `/api/auth/logout` | `BACKEND.auth.logout` |
| `API.auth.me` | `/api/auth/me` | `BACKEND.auth.me` |
| `API.attendance` | `/api/attendance` | `BACKEND.attendance.list` |
| `API.attendanceAll` | `/api/attendance/all` | `BACKEND.attendance.all` |
| `API.attendanceDaily` | `/api/attendance/daily` | `BACKEND.attendance.dailyUpsert` |
| `API.attendanceDailyGroup(id)` | `/api/attendance/daily/group/{groupId}` | `BACKEND.attendance.dailyGroup(id)` |
| `API.groups` | `/api/groups` | `BACKEND.groups.list` |
| `API.groupsSchedules(id)` | `/api/groups/{id}/schedules` | `BACKEND.groups.schedules(id)` |
| `API.users` | `/api/users` | `BACKEND.users.list` |
| `API.institutions` | `/api/institutions` | `BACKEND.institutions.list` |
| `API.readers` | `/api/readers` | `BACKEND.devices.list` |
| `API.nfc` | `/api/nfc` | `BACKEND.nfc.list` |
| `API.nfcAssign` | `/api/nfc/assign` | `BACKEND.nfc.assignCard` |
| `API.dashboard` | `/api/dashboard/summary` | `BACKEND.dashboard.summary` |
| `API.student.myGroups` | `/api/student/myGroups` | `BACKEND.groups.list` |

---

## 9. Sistema de Asistencia

Existen **dos tablas separadas** en el backend para la asistencia:

### AttendanceRecord (registro de auditoría inmutable)

Se crea automáticamente por los lectores NFC cuando se escanea una tarjeta. No puede ser editado por el frontend. Se usa para historial y auditoría.

Campos: `id`, `userId`, `deviceId`, `timestamp`, `action`

### DailyAttendance (estado oficial editable)

La asistencia oficial por alumno por día. Los profesores la crean y actualizan a través del calendario.

Campos: `id`, `userId`, `groupId`, `date`, `status`, `modifiedById`

**Valores de estado:**

| Valor | Etiqueta |
|---|---|
| 0 | Presente |
| 1 | Ausente (valor por defecto si no hay registro) |
| 2 | Justificado |
| 3 | Tarde |

### Lógica del Roster del Profesor

Cuando un profesor abre la vista de día:

1. Obtener alumnos: `GET /api/teacher/groups/{groupId}/students`
2. Obtener registros diarios: `GET /api/attendance/daily/group/{groupId}?date=YYYY-MM-DD`
3. Combinar: los alumnos sin registro `DailyAttendance` se marcan como **Ausente (1)** por defecto

### Endpoint Upsert

```
PUT /api/attendance/daily
{
  "userId": "...",
  "groupId": "...",
  "date": "YYYY-MM-DD",
  "status": 0 | 1 | 2 | 3
}
```

El backend gestiona automáticamente tanto la creación como la actualización (busca el registro existente por `userId + groupId + date`).

### Formateo de Fechas

Siempre usar las partes locales de la fecha para evitar el desfase de zona horaria UTC:

```typescript
function toLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

**No usar** `d.toISOString().slice(0, 10)` — esto convierte a UTC y desplaza la fecha para usuarios en zonas horarias UTC-.

---

## 10. Componentes Principales

### `app-sidebar.tsx`
Barra lateral principal. Filtra los elementos de navegación según el rol. Incluye el menú de usuario (perfil, confirmación de logout).

### `teacher-calendar.tsx`
Calendario para profesores con dos vistas:
- **Vista mes** — cuadrícula de días, cada celda coloreada según la tasa de asistencia (teal ≥80%, ámbar ≥50%, rojo <50%), muestra la proporción `presentes/total`
- **Vista día** — roster completo del día seleccionado, estado por alumno (modificable), barra de resumen con conteos por estado, badge de modificación manual

Regla de edición: **solo días pasados y el día de hoy** son editables. Las fechas futuras son de solo lectura.

### `student-dashboard.tsx`
Dashboard personal del estudiante con tres pestañas:
- **Faltas** — resumen de ausencias
- **Clases** — lista de grupos/clases
- **Calendario** — calendario mensual coloreado por el peor estado de asistencia del día

### `attendance-table.tsx`
Tabla de datos para la vista administrativa de todos los registros de asistencia. Usa TanStack React Table con paginación, ordenamiento y filtros.

### `data-table.tsx`
Wrapper genérico y reutilizable de TanStack React Table usado en todo el proyecto para usuarios, grupos, tarjetas NFC, lectores e instituciones.

---

## 11. Utilidades (lib/)

### `lib/api.ts` — `backendFetch()`
Wrapper de fetch solo para el servidor. Lee el JWT de la cookie, establece el header Authorization y antepone la URL base.

### `lib/auth.ts`
- `getCurrentUser()` — lee y devuelve el usuario actual desde `/api/User/me`
- `requireAuth()` — redirige a `/login` si no está autenticado
- `requireRole(roles[])` — redirige a `/unauthorized` si el rol no coincide
- `getAuthToken()` — lee el JWT de la cookie (solo servidor)
- `setAuthCookie(token)` / `clearAuthCookie()` — gestión de la cookie HttpOnly

### `lib/roles.ts`
Constantes de roles usadas en todo el proyecto:
```typescript
export const Role = {
  SuperAdmin: 0,
  Admin: 1,
  Professor: 2,
  Student: 3,
}
```

### `lib/endpoints.ts`
Mapa central de todos los endpoints. Ver secciones 7 y 8.

### `lib/client-cache.ts`
Caché basada en localStorage con TTL. Se usa para evitar llamadas API repetidas en el cliente (ej. lista de grupos del profesor). TTL por defecto: 5 minutos.

### `lib/animations.ts`
Constantes de animación GSAP (duración, stagger, easing). Incluye `prefersReducedMotion()` para accesibilidad.

### `lib/utils.ts`
`cn(...classes)` — combina `clsx` + `tailwind-merge` para nombres de clase condicionales seguros.

---

## 12. Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
BACKEND_URL=https://url-del-backend.com
```

| Variable | Requerida | Descripción |
|---|---|---|
| `BACKEND_URL` | Sí | URL base del backend C# ASP.NET Core |

---

## 13. Sistema de Diseño

### Colores
Paleta personalizada en espacio de color OKLCH definida en `app/globals.css`:

| Token | Descripción |
|---|---|
| `--color-forest` | Verde primario de la marca |
| `--color-cream` | Fondo blanco cálido |
| `--color-sage` | Verde secundario |
| `--color-teal` | Acento (estado presente/bueno) |
| `--color-ink` | Color de texto principal |

### Colores de Estado de Asistencia (Calendario)

| Estado | Color |
|---|---|
| Presente | Teal |
| Tarde | Ámbar |
| Ausente | Rojo |
| Justificado | Gris azulado |

### Colores de Tasa Mensual (Vista Mes)

| Tasa de asistencia | Color |
|---|---|
| >= 80% | Teal |
| >= 50% | Ámbar |
| < 50% | Rojo |

### Tipografía
- **Sans**: DM Sans — texto de UI, etiquetas, cuerpo
- **Mono**: DM Mono — código, IDs, timestamps

### Animaciones
GSAP se usa para animaciones de entrada (navegación de la barra lateral, tarjetas del dashboard). Todas las animaciones respetan `prefers-reduced-motion`.
