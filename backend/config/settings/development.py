"""
Development settings for RESILIENCIA VZLA.
Extends base settings with development-specific overrides.
"""
from .base import *  # noqa: F401, F403
from decouple import config

DEBUG = True

ALLOWED_HOSTS = ['*']

# Use local file storage for development (no Cloudinary required)
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Relax CORS for local development
CORS_ALLOW_ALL_ORIGINS = True

# Disable HTTPS enforcement in dev
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Show emails in console during development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Django Debug Toolbar (optional)
INSTALLED_APPS = INSTALLED_APPS + []  # noqa: F405

# Verbose logging in development
import logging
logging.getLogger('apps').setLevel(logging.DEBUG)
logging.getLogger('django.db.backends').setLevel(logging.WARNING)

# In-memory settings to run the app without a running Redis server in local development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'resiliencia-dev-cache',
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Run Celery tasks synchronously in-process (no broker required)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Relax throttle rates in development to prevent 429 errors during testing
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/hour',
        'user': '50000/hour',
        'openapi': '100000/day',
    }
}

