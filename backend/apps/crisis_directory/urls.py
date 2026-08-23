from django.urls import path
from .views import (
    CrisisResourceListView,
    CrisisResourceDetailView,
)

app_name = 'crisis_directory'

urlpatterns = [
    path('', CrisisResourceListView.as_view(), name='list_create'),
    path('<uuid:pk>/', CrisisResourceDetailView.as_view(), name='detail'),
]
