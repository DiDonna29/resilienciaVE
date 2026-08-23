from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'
    verbose_name = 'Usuarios'

    def ready(self):
        """Import signal handlers when app is ready."""
        pass  # Signals can be added here if needed
