from django.urls import path
from .views import (
    RescueZoneListView,
    RescueZoneDetailView,
    AddSupplyView,
    VolunteerRequestView,
)

app_name = 'rescue_zones'

urlpatterns = [
    path('', RescueZoneListView.as_view(), name='list_create'),
    path('<uuid:pk>/', RescueZoneDetailView.as_view(), name='detail_update'),
    path('<uuid:pk>/supplies/', AddSupplyView.as_view(), name='add_supply'),
    path('<uuid:pk>/volunteer/', VolunteerRequestView.as_view(), name='volunteer_request'),
]
