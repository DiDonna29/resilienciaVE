"""
URL configuration for the seismology app.
"""
from django.urls import path
from .views import (
    SeismicEventListView,
    SeismicEventDetailView,
    SeismicEventStatsView,
    SeismicEventSyncView,
)

app_name = 'seismology'

urlpatterns = [
    path('events/', SeismicEventListView.as_view(), name='event-list'),
    path('events/<uuid:pk>/', SeismicEventDetailView.as_view(), name='event-detail'),
    path('stats/', SeismicEventStatsView.as_view(), name='stats'),
    path('sync/', SeismicEventSyncView.as_view(), name='sync'),
]
