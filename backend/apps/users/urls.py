"""
URL configuration for the users app.
"""
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    GoogleAuthView,
    UserProfileView,
    SuperAdminUserListView,
    VerifyUserFlagView,
    DeactivateUserView,
    ToggleAdminRoleView,
    VerificationRequestView,
    PasswordRecoveryView,
    VerificationRequestAdminListView,
    ReviewVerificationRequestView,
)

app_name = 'users'

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
    path('password-recovery/', PasswordRecoveryView.as_view(), name='password-recovery'),

    # User profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('verification-request/', VerificationRequestView.as_view(), name='verification-request'),

    # SuperAdmin endpoints
    path('users/', SuperAdminUserListView.as_view(), name='user-list'),
    path('users/<uuid:user_id>/verify/', VerifyUserFlagView.as_view(), name='verify-flag'),
    path('users/<uuid:user_id>/deactivate/', DeactivateUserView.as_view(), name='deactivate-user'),
    path('users/<uuid:user_id>/toggle-admin/', ToggleAdminRoleView.as_view(), name='toggle-admin'),
    path('admin/verification-requests/', VerificationRequestAdminListView.as_view(), name='admin-verification-requests'),
    path('admin/verification-requests/<uuid:request_id>/review/', ReviewVerificationRequestView.as_view(), name='admin-review-verification'),
]
