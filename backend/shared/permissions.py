"""
Custom permission classes for RESILIENCIA VZLA API.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    """Allows access only to users with role='SUPERADMIN'."""

    message = 'Se requieren privilegios de SuperAdmin para realizar esta acción.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SUPERADMIN'
        )

class IsAdminOrSuperAdmin(BasePermission):
    """Allows access to users with role='SUPERADMIN' or 'ADMIN'."""

    message = 'Se requieren privilegios de Administrador para realizar esta acción.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ['SUPERADMIN', 'ADMIN']
        )


class IsVerifiedHealthWorker(BasePermission):
    """Allows access only to users with is_verified_health_worker=True."""

    message = 'Esta acción requiere verificación como trabajador de salud.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_verified_health_worker
                or request.user.role == 'SUPERADMIN'
            )
        )


class IsVerifiedShelterManager(BasePermission):
    """Allows access only to users with is_verified_shelter_manager=True."""

    message = 'Esta acción requiere verificación como administrador de refugios.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_verified_shelter_manager
                or request.user.role == 'SUPERADMIN'
            )
        )


class IsVerifiedOrgDonor(BasePermission):
    """Allows access only to users with is_verified_org_donor=True."""

    message = 'Esta acción requiere verificación como organización donante.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_verified_org_donor
                or request.user.role == 'SUPERADMIN'
            )
        )


class IsOwnerOrSuperAdmin(BasePermission):
    """
    Object-level permission: allows access if the user owns the object
    or is a SuperAdmin. Assumes the object has a 'reported_by',
    'registered_by', or 'submitted_by' attribute referencing the owner.
    """

    message = 'Solo el propietario o un SuperAdmin puede realizar esta acción.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'SUPERADMIN':
            return True

        # Check various owner field patterns
        owner = (
            getattr(obj, 'reported_by', None)
            or getattr(obj, 'registered_by', None)
            or getattr(obj, 'submitted_by', None)
            or getattr(obj, 'user', None)
        )
        return owner == request.user


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Custom version: read access for all, write access for authenticated only.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class IsSuperAdminOrReadOnly(BasePermission):
    """Read access for all; write access for SuperAdmin only."""

    message = 'Solo los SuperAdmin pueden modificar este recurso.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SUPERADMIN'
        )
