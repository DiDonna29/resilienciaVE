from django.urls import re_path
from .consumers import SeismicEventConsumer

websocket_urlpatterns = [
    re_path(r'^ws/seismology/$', SeismicEventConsumer.as_asgi()),
]
