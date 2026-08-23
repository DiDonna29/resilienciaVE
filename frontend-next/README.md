# RESILIENCIA VZLA — Next.js Frontend

Este es el frontend de la plataforma **RESILIENCIA VZLA**, construido con Next.js 16 (App Router) y TypeScript, diseñado para ofrecer una interfaz móvil-primero fluida y de alto rendimiento en situaciones de desastres naturales.

---

## Requisitos Previos
* **Node.js 18** o superior.
* **pnpm** (o npm / yarn).

---

## Configuración del Entorno Local

### 1. Instalar Dependencias
Desde la raíz de la carpeta `frontend-next/`, ejecuta:
```bash
pnpm install
```

### 2. Archivo de Configuración de Entorno (`.env.local`)
Crea un archivo `.env.local` en la raíz de `frontend-next/` con las siguientes variables para conectar el frontend con el backend local:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_APP_NAME=RESILIENCIA VZLA
```

### 3. Google OAuth 2.0 (Opcional)
Reemplaza `your-google-client-id` con la credencial generada en tu consola de Google Cloud (tipo: "ID de cliente de OAuth 2.0" para aplicaciones web) para habilitar el inicio de sesión rápido con Google.

---

## Ejecución del Frontend

### Servidor de Desarrollo
Para iniciar la aplicación en modo desarrollo:
```bash
pnpm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver la aplicación ejecutándose.

### Compilar para Producción
Para verificar los tipos de TypeScript y crear una compilación optimizada de producción:
```bash
pnpm run build
```

### Iniciar Servidor de Producción
```bash
pnpm run start
```
