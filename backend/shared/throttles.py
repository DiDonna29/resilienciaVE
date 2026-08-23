"""
Custom throttle classes for RESILIENCIA VZLA API.
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class StandardAnonThrottle(AnonRateThrottle):
    """Anonymous throttle reading rate from settings scope 'anon'."""
    scope = 'anon'


class StandardUserThrottle(UserRateThrottle):
    """Authenticated user throttle reading rate from settings scope 'user'."""
    scope = 'user'


class OpenApiThrottle(AnonRateThrottle):
    """1000 requests per day for OpenAPI schema access."""
    scope = 'openapi'
    rate = '1000/day'


class AuthThrottle(AnonRateThrottle):
    """Stricter throttle for authentication endpoints: 10/minute."""
    scope = 'auth'
    rate = '10/minute'


class SensitiveOpThrottle(UserRateThrottle):
    """Throttle for sensitive operations like flag verification: 30/hour."""
    scope = 'sensitive'
    rate = '30/hour'
