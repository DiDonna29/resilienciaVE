from django.urls import path
from .views import (
    AdminHealthCheckDetailView,
    SecurityHeadersCheckView,
    CORSConfigView,
    DNSCheckerView,
    OpenPortCheckerView,
    SSLLabsCheckView,
    SQLInjectionProbeView,
    PendingVerificationsView,
    ToggleUserVerificationFlagsView,
    ModerationQueueView,
    ApproveCrisisResourceView,
)

app_name = 'superadmin'

urlpatterns = [
    path('health/', AdminHealthCheckDetailView.as_view(), name='health_detail'),
    path('security-headers/', SecurityHeadersCheckView.as_view(), name='security_headers'),
    path('cors/', CORSConfigView.as_view(), name='cors_config'),
    path('dns-checker/', DNSCheckerView.as_view(), name='dns_checker'),
    path('port-scanner/', OpenPortCheckerView.as_view(), name='port_scanner'),
    path('ssl-labs/', SSLLabsCheckView.as_view(), name='ssl_labs'),
    path('sql-injection-probe/', SQLInjectionProbeView.as_view(), name='sql_injection_probe'),
    
    # User Verification Flags
    path('verifications/', PendingVerificationsView.as_view(), name='verifications_list'),
    path('verifications/<uuid:user_id>/', ToggleUserVerificationFlagsView.as_view(), name='verification_toggle'),
    
    # Crisis Directory Moderation
    path('moderation-queue/', ModerationQueueView.as_view(), name='moderation_queue'),
    path('approve-resource/<uuid:pk>/', ApproveCrisisResourceView.as_view(), name='approve_resource'),
    
    # System Modules
    path('modules/', __import__('apps.superadmin.views', fromlist=['SystemModuleListView']).SystemModuleListView.as_view(), name='modules'),
]
