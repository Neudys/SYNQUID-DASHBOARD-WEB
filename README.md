# SYNQUID Dashboard

Sistema de gestión de asistencia escolar con registro por NFC. Permite a administradores, profesores y estudiantes visualizar y controlar la asistencia en tiempo real desde una interfaz web moderna.

---

## ¿Qué hace?

- Los **lectores NFC** registran automáticamente la entrada de los alumnos
- Los **profesores** pueden ver y editar la asistencia diaria de sus grupos desde un calendario
- Los **estudiantes** consultan su historial de asistencia personal
- Los **administradores** gestionan usuarios, grupos, instituciones y dispositivos

---

## Vistas principales

### Administrador
Resumen del sistema: lectores activos, total de usuarios, asistencia del día y tabla de registros recientes.

### Profesor
Calendario mensual con tasa de asistencia por día y vista detallada por alumno. Cada alumno tiene un estado editable: **Presente**, **Ausente**, **Tarde** o **Justificado**.

### Estudiante
Historial personal de asistencia con tres pestañas: faltas acumuladas, clases/grupos, y calendario mensual.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | TailwindCSS v4 |
| UI | Shadcn/UI |
| Backend | C# ASP.NET Core (API separada) |
| Auth | JWT en cookie HttpOnly |

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/SYNQUID-DASHBOARD-WEB.git
cd SYNQUID-DASHBOARD-WEB

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y agregar la URL del backend

# 4. Iniciar en desarrollo
npm run dev
```

### Variables de entorno requeridas

```env
BACKEND_URL=https://url-del-backend.com
```

---

## Roles de usuario

| Rol | Acceso |
|---|---|
| SuperAdmin | Todo |
| Admin | Todas las páginas del dashboard |
| Profesor | Dashboard + Calendario de asistencia |
| Estudiante | Dashboard con sus propios datos |

---

## Seguridad

El frontend actúa como proxy: el cliente nunca se comunica directamente con el backend. El JWT se almacena en una cookie HttpOnly y todas las llamadas al backend se realizan del lado del servidor.

---

## Documentación técnica

Para detalles de arquitectura, endpoints, sistema de asistencia y utilidades ver [DOCS.md](./DOCS.md).
