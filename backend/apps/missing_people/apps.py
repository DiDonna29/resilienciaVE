from django.apps import AppConfig


class MissingPeopleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.missing_people'
    verbose_name = 'Personas Desaparecidas'
