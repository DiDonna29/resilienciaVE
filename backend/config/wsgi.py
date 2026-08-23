"""
WSGI config for RESILIENCIA VZLA.
"""
import os
from decouple import config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', config('DJANGO_SETTINGS_MODULE', default='config.settings.development'))

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
