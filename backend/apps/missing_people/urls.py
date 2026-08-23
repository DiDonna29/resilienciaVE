"""
URL configuration for the missing_people app.
"""
from django.urls import path
from .views import (
    MissingPersonListView,
    MissingPersonDetailView,
    MissingPersonStatsView,
    MarkAsFoundView,
    DuplicateCheckView,
)

app_name = 'missing_people'

urlpatterns = [
    path('', MissingPersonListView.as_view(), name='list'),
    path('stats/', MissingPersonStatsView.as_view(), name='stats'),
    path('check-duplicate/', DuplicateCheckView.as_view(), name='check-duplicate'),
    path('<uuid:pk>/', MissingPersonDetailView.as_view(), name='detail'),
    path('<uuid:pk>/mark-found/', MarkAsFoundView.as_view(), name='mark-found'),
]
