# RESILIENCIA VZLA — Contexto del Agente Backend

> **IMPORTANTE**: Este archivo debe ser actualizado por cualquier agente de IA o desarrollador que modifique la lógica, los modelos, los serializadores, las tareas de Celery o los esquemas de la base de datos del backend.

---

## 1. Arquitectura & Stack Técnico
El backend está construido con:
* **Django 5.0.6 & Django REST Framework 3.15.2**
* **Base de Datos**: PostgreSQL 15+ con extensión PostGIS para coordenadas geográficas.
* **Canales en tiempo real**: Django Channels 4.1.0 para WebSockets. Usa fallback en memoria (`InMemoryChannelLayer`) en desarrollo.
* **Cola de Tareas**: Celery 5.4.0 + Redis 7 como Broker. En desarrollo se configuran tareas en modo eager (síncronas en el mismo hilo, `CELERY_TASK_ALWAYS_EAGER = True`) para no requerir un servidor de Redis.
* **Autenticación**: `dj-rest-auth` con soporte JWT (SimpleJWT) y Google OAuth2.
* **Almacenamiento de archivos**: Cloudinary / Django-storages (en producción) y almacenamiento local (en desarrollo).
* **Caché**: Redis en producción y caché en memoria local (`LocMemCache`) en desarrollo (requerido para el funcionamiento del throttling de DRF).

---

## 2. Base de Datos & Configuración Local
* **Host**: `localhost`
* **Puerto**: `5433` (PostgreSQL 15 local de Windows)
* **Nombre de la base de datos**: `resiliencia_ve`
* **Usuario**: `postgres`
* **Contraseña**: `3024442`
* **Superusuario administrativo**:
  * **Email**: `admin@resilienciavzla.com`
  * **Contraseña**: `admin123`

---

## 3. Estructura de Aplicaciones (Apps)
* **`users`**: Modelo de usuario personalizado (`User`), registro manual (con validación de cédula venezolana `^[VvEe]-\d{6,9}$`), login JWT, inicio de sesión de Google, flags de verificación (`is_verified_health_worker`, etc.).
* **`seismology`**: Gestión de eventos sísmicos. Cuenta con un servicio automático (`USGSSeismologyService`) y tarea de Celery programada para consultar sismos mediante una búsqueda radial (círculo de 1000 km) centrada en Venezuela (`[Lat 8.0, Lon -66.0]`).
* **`missing_people`**: Registro y búsqueda de personas desaparecidas con deduplicación fonética y de Levenshtein (similitud > 85% y edad ±2 años).
* **`rescue_zones`**: Gestión de zonas de rescate activas, necesidades técnicas y registro de voluntarios.
* **`health_network`**: Directorio de centros de salud (hospitales, clínicas, puestos médicos) con reporte de suministros faltantes.
* **`shelters`**: Control de refugios temporales y capacidad de ocupación.
* **`allies`**: Directorio de empresas y ONGs aliadas.
* **`crisis_directory`**: Recursos web/móviles y canales verificados con filtrado de moderación.
* **`superadmin`**: Panel administrativo y diagnóstico de seguridad/CORS/Throttles.

---

## 4. Comandos de Inicialización (Backend)
1. **Activar el entorno virtual**:
   ```powershell
   .venv\Scripts\Activate.ps1
   ```
2. **Generar y aplicar migraciones**:
   ```powershell
   python manage.py makemigrations
   python manage.py migrate
   ```
3. **Iniciar el servidor de desarrollo**:
   ```powershell
   python manage.py runserver
   ```
4. **Iniciar Celery (Worker & Beat - Opcionales en desarrollo)**:
   *Dado que `CELERY_TASK_ALWAYS_EAGER = True` está activado en desarrollo, las tareas se ejecutan inmediatamente en el mismo hilo, por lo que estos procesos no son estrictamente necesarios a menos que desees probar la cola asíncrona real (con Redis corriendo).*
   ```powershell
   # Ejecutar en terminales separadas con Redis corriendo:
   celery -A celery_app worker --loglevel=info --concurrency=4
   celery -A celery_app beat --loglevel=info
   ```

---

## 5. Endpoints Principales (API v1)
* **Auth / Perfiles**:
  * `POST /api/v1/auth/register/` - Registro manual de ciudadanos.
  * `POST /api/v1/auth/login/` - Autenticación JWT.
  * `POST /api/v1/auth/google/` - Autenticación con Google OAuth2.
  * `GET/PUT /api/v1/auth/user/` - Ver y actualizar perfil propio.
* **Sismología**:
  * `GET /api/v1/seismology/` - Listar sismos paginados y filtrados.
  * `GET /api/v1/seismology/stats/` - Estadísticas y último sismo registrado.
* **Desaparecidos**:
  * `GET/POST /api/v1/missing-people/` - Listar o reportar desaparecidos.
  * `POST /api/v1/missing-people/check-duplicate/` - Pre-chequeo de duplicados.
  * `PUT /api/v1/missing-people/<id>/found/` - Marcar persona como localizada.
* **Zonas de Rescate**:
  * `GET/POST /api/v1/rescue-zones/` - Listar/crear zonas de rescate.
  * `POST /api/v1/rescue-zones/<id>/volunteer/` - Registrarse como voluntario en la zona.
* **Refugios & Red de Salud**:
  * `PUT /api/v1/shelters/<id>/supplies/` - Actualizar insumos requeridos en refugio.
  * `PUT /api/v1/health-network/<id>/supplies/` - Actualizar insumos requeridos en hospital.
