"""
URL configuration for RESILIENCIA VZLA.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from health_check.views import MainView as HealthCheckView

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # API v1
    path('api/v1/auth/', include('apps.users.urls', namespace='users')),
    path('api/v1/seismology/', include('apps.seismology.urls', namespace='seismology')),
    path('api/v1/missing-people/', include('apps.missing_people.urls', namespace='missing_people')),
    path('api/v1/rescue-zones/', include('apps.rescue_zones.urls', namespace='rescue_zones')),
    path('api/v1/health-network/', include('apps.health_network.urls', namespace='health_network')),
    path('api/v1/shelters/', include('apps.shelters.urls', namespace='shelters')),
    path('api/v1/allies/', include('apps.allies.urls', namespace='allies')),
    path('api/v1/crisis-directory/', include('apps.crisis_directory.urls', namespace='crisis_directory')),
    path('api/v1/admin-panel/', include('apps.superadmin.urls', namespace='superadmin')),

    # Health check
    path('api/v1/healthz/', HealthCheckView.as_view(), name='health_check'),

    # OpenAPI / Docs
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
