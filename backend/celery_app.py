import os
import django
from celery import Celery
from decouple import config

os.environ.setdefault('DJANGO_SETTINGS_MODULE', config('DJANGO_SETTINGS_MODULE', default='config.settings.development'))

django.setup()

app = Celery('resiliencia_vzla')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks([
    'apps.seismology',
])

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
