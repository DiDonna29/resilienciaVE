from django.urls import path
from .views import (
    HealthCenterListView,
    HealthCenterDetailView,
    HealthCenterSuppliesUpdateView,
)

app_name = 'health_network'

urlpatterns = [
    path('', HealthCenterListView.as_view(), name='list_create'),
    path('<uuid:pk>/', HealthCenterDetailView.as_view(), name='detail_update'),
    path('<uuid:pk>/supplies/', HealthCenterSuppliesUpdateView.as_view(), name='supplies_update'),
]
