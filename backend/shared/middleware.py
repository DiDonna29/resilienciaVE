"""
Security headers middleware for RESILIENCIA VZLA.
Adds Content-Security-Policy, Referrer-Policy, Permissions-Policy,
and other protective HTTP headers to every response.
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Injects security-related HTTP response headers.
    Works in both development (relaxed CSP) and production (strict CSP).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        self._apply_headers(response)
        return response

    def _apply_headers(self, response):
        # Content-Security-Policy
        if settings.DEBUG:
            csp = (
                "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "img-src 'self' data: blob: https://res.cloudinary.com; "
                "connect-src 'self' ws: wss: http: https:; "
                "font-src 'self' data: https://fonts.gstatic.com;"
            )
        else:
            csp = getattr(
                settings,
                'CSP_HEADER',
                (
                    "default-src 'self'; "
                    "script-src 'self' https://accounts.google.com; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data: https://res.cloudinary.com; "
                    "connect-src 'self' wss:; "
                    "frame-src 'none'; "
                    "object-src 'none';"
                )
            )
        response['Content-Security-Policy'] = csp

        # Referrer-Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # Permissions-Policy
        response['Permissions-Policy'] = (
            'camera=(), microphone=(), geolocation=(self), '
            'payment=(), usb=(), fullscreen=(self)'
        )

        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'

        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'

        # X-XSS-Protection (legacy browsers)
        response['X-XSS-Protection'] = '1; mode=block'

        # Cache-Control for API responses
        if '/api/' in response.get('Content-Type', '') or hasattr(response, 'data'):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'

        # Remove server information leakage
        if response.has_header('Server'):
            del response['Server']
        if response.has_header('X-Powered-By'):
            del response['X-Powered-By']

        return response
