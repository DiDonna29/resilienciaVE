from django.urls import path
from .views import (
    ShelterListView,
    ShelterDetailView,
    ShelterSuppliesUpdateView,
)

app_name = 'shelters'

urlpatterns = [
    path('', ShelterListView.as_view(), name='list_create'),
    path('<uuid:pk>/', ShelterDetailView.as_view(), name='detail_update'),
    path('<uuid:pk>/supplies/', ShelterSuppliesUpdateView.as_view(), name='supplies_update'),
]
