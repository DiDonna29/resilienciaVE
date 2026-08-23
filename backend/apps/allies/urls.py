from django.urls import path
from .views import (
    AllyProfileListView,
    AllyProfileDetailView,
)

app_name = 'allies'

urlpatterns = [
    path('', AllyProfileListView.as_view(), name='list_create'),
    path('<uuid:pk>/', AllyProfileDetailView.as_view(), name='detail_update'),
]
