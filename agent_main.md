# RESILIENCIA VZLA — Contexto General del Proyecto (Agente Principal)

> **IMPORTANTE**: Este archivo sirve como la fuente de la verdad para cualquier agente de IA o desarrollador que trabaje en esta plataforma. Cada vez que se realicen cambios de arquitectura, diseño, endpoints o lógica del negocio, este archivo (y sus complementarios en `frontend-next` y `backend`) deben ser actualizados de forma mandatoria.

---

## 1. Contexto de la Aplicación
**RESILIENCIA VZLA** es una plataforma tecnológica de respuesta y gestión de catástrofes a nivel nacional en Venezuela, con un enfoque inicial y principal en sismología (temblores y terremotos) y crisis derivadas de desastres naturales. 

La plataforma busca proporcionar herramientas rápidas y de libre acceso para mitigar los efectos de eventos catastróficos, permitiendo:
* El registro y búsqueda rápida de **personas desaparecidas** (con algoritmos de deduplicación fonética y de Levenshtein para evitar duplicados).
* La visualización y registro de **zonas de rescate/apoyo** que requieran voluntarios o insumos.
* Un directorio de la **red hospitalaria nacional** mostrando estados críticos u operativos y faltantes de insumos médicos.
* Una base de datos e indicadores de ocupación de **refugios temporales**.
* Un directorio verificado de **aliados y organizaciones de apoyo** (empresas, ONGs, etc.).
* Un **directorio de crisis** de recursos digitales (sitios web oficiales, canales de WhatsApp/Telegram, etc.) con moderación automática de palabras inadecuadas.
* Monitoreo sísmico en tiempo real de eventos a través de la API de la USGS utilizando una búsqueda radial (círculo de 1000 km) centrada en Venezuela para mayor precisión, y la API de TerraQuake (INGV italiana) como fuente secundaria.

---

## 2. Identidad Visual y Datos Clave
* **Paleta de Colores (Inspirada en la Bandera Nacional)**:
  * **Amarillo**: `#FCE300` (Destacados, advertencias, sismos moderados).
  * **Azul**: `#003DA5` (Navbar, títulos, paneles informativos, sismos leves).
  * **Rojo**: `#EF3340` (Botones de acción, llamadas de emergencia, alertas críticas).
  * **Blanco**: `#FFFFFF` (Fondo modo claro).
  * **Negro**: `#0A0A0A` (Fondo modo oscuro / premium).
* **Desarrollador y Contacto (John Di Donna)**:
  * **WhatsApp**: [+58 412 507 2134](https://wa.me/584125072134) (04125072134)
  * **TikTok**: [john.didonna](https://www.tiktok.com/@john.didonna)
  * **Instagram**: [@john.didonna](https://www.instagram.com/john.didonna/)

---

## 3. Arquitectura del Sistema
El proyecto está dividido en un monorepositorio con dos carpetas principales:

1. **`backend/`**:
   * Desarrollado en **Python 3.13 / Django 5 + Django REST Framework (DRF)**.
   * Base de datos: **PostgreSQL 15+ (con soporte para PostGIS)**.
   * Cache y Broker: **Redis 7** en producción. En desarrollo local se utiliza una caché en memoria (`LocMemCache`) para evitar dependencias externas.
   * Cola de tareas en segundo plano: **Celery** (sincroniza sismos). En desarrollo local corre en modo eager (`CELERY_TASK_ALWAYS_EAGER = True`) para ejecutarse síncronamente.
   * WebSockets: **Django Channels** (notificaciones de sismos). Usa un canal en memoria (`InMemoryChannelLayer`) en desarrollo.
   * Almacenamiento de archivos: **Cloudinary** para producción y almacenamiento local para desarrollo.

2. **`frontend-next/`**:
   * Desarrollado en **TypeScript + Next.js 16 (App Router)**.
   * Gestión de Estado: **Zustand** para el estado de autenticación.
   * Consumo de API: **Axios** con interceptores automáticos de JWT.
   * Estilo: **CSS nativo** con diseño responsivo premium, glassmorphism y animaciones.

---

## 4. Estado de Implementación y Logros
* **Compilación y TypeScript**: Resuelto al 100% en el frontend (`pnpm run build` compila con cero errores y advertencias de tipado).
* **Entorno Virtual del Backend**: Creado y verificado. Migraciones de base de datos ejecutadas correctamente.
* **Base de Datos**: PostgreSQL local configurado en el puerto `5433` con contraseña `3024442` y base de datos `resiliencia_ve` creada.
* **Superusuario inicial**: Creado con email `admin@resilienciavzla.com` y contraseña `admin123`.

---

## 5. Archivos de Contexto
Para más detalles sobre los componentes del sistema, consulta los siguientes archivos:
* [Agent Principal (Este archivo)](file:///c:/Users/Usuario/Desktop/Developments/resilienciaVE/agent_main.md)
* [Agent Backend](file:///c:/Users/Usuario/Desktop/Developments/resilienciaVE/backend/agent_backend.md)
* [README Backend](file:///c:/Users/Usuario/Desktop/Developments/resilienciaVE/backend/README.md)
* [Agent Frontend](file:///c:/Users/Usuario/Desktop/Developments/resilienciaVE/frontend-next/agent_frontend.md)
* [README Frontend](file:///c:/Users/Usuario/Desktop/Developments/resilienciaVE/frontend-next/README.md)
