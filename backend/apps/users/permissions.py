"""
Custom permissions for the users app (mirrors shared/permissions.py, imported for convenience).
"""
from shared.permissions import (  # noqa: F401
    IsSuperAdmin,
    IsAdminOrSuperAdmin,
    IsVerifiedHealthWorker,
    IsVerifiedShelterManager,
    IsVerifiedOrgDonor,
    IsOwnerOrSuperAdmin,
    IsAuthenticatedOrReadOnly,
    IsSuperAdminOrReadOnly,
)
