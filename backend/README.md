# RESILIENCIA VZLA — Django REST Framework Backend

Este es el backend de la plataforma **RESILIENCIA VZLA**, construido con Django 5 y Django REST Framework, diseñado para coordinar la respuesta nacional ante desastres naturales.

---

## Requisitos Previos
* **Python 3.13** o superior.
* **PostgreSQL 15** o superior con la extensión **PostGIS**.
* **Redis** (Opcional en desarrollo. Requerido en producción para Django Channels y Celery. En desarrollo se habilitan automáticamente fallbacks en memoria).

---

## Configuración del Entorno Local

### 1. Clonar y Configurar Entorno Virtual
Activar el entorno virtual desde la raíz del backend:
```powershell
# En Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 2. Archivo de Configuración de Entorno (`.env`)
Asegúrate de que tu archivo `.env` en la raíz de `backend/` contenga las siguientes variables de configuración (el puerto de PostgreSQL local en Windows es `5433` con contraseña `3024442`):
```env
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://postgres:3024442@localhost:5433/resiliencia_ve
DB_NAME=resiliencia_ve
DB_USER=postgres
DB_PASSWORD=3024442
DB_HOST=localhost
DB_PORT=5433
REDIS_URL=redis://localhost:6379/0
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:3000
TERRAQUAKE_API_BASE=https://api.terraquakeapi.com/v1/earthquakes
USGS_API_BASE=https://earthquake.usgs.gov/fdsnws/event/1/query
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
DJANGO_SETTINGS_MODULE=config.settings.development
```

### 3. Base de Datos e Inicialización
El script de inicialización creará la base de datos `resiliencia_ve` en tu PostgreSQL local. Para aplicar las tablas y modelos de Django:
```powershell
python manage.py makemigrations
python manage.py migrate
```

### 4. Crear Superusuario Administrativo
```powershell
python manage.py createsuperuser
```
*(Ya hay uno creado por defecto para desarrollo con email `admin@resilienciavzla.com` y contraseña `admin123`)*

---

## Ejecución del Backend

Para ejecutar el servidor de desarrollo y todos los servicios de apoyo:

### 1. Servidor Django REST Framework (API)
```powershell
python manage.py runserver 8000
```
La API estará disponible en: [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/)
La documentación de Swagger estará disponible en: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/)

### 2. Celery Worker & Beat (Opcionales en desarrollo)
En desarrollo local, Celery está configurado en modo **eager** (`CELERY_TASK_ALWAYS_EAGER = True`). Esto significa que las tareas se ejecutan inmediatamente en el mismo hilo sin necesidad de iniciar procesos adicionales ni un servidor de Redis. 

Si deseas probar la ejecución asíncrona real y la sincronización periódica simulando producción:
1. Asegúrate de tener un servidor de Redis corriendo localmente en el puerto `6379`.
2. Inicia el Worker en una terminal:
   ```powershell
   celery -A celery_app worker --loglevel=info --concurrency=4
   ```
3. Inicia el Beat en otra terminal:
   ```powershell
   celery -A celery_app beat --loglevel=info
   ```
