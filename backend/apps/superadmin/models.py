from django.db import models
from django.utils.translation import gettext_lazy as _

class SystemModule(models.Model):
    """
    Configuración dinámica de módulos de la plataforma.
    Permite encender y apagar características como Sismología, Desaparecidos, etc.
    """
    name = models.CharField(max_length=100, verbose_name=_('Nombre del Módulo'))
    slug = models.CharField(max_length=50, unique=True, verbose_name=_('Slug (identificador)'))
    is_active = models.BooleanField(default=True, verbose_name=_('¿Está activo?'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Última actualización'))

    class Meta:
        verbose_name = _('Módulo del Sistema')
        verbose_name_plural = _('Módulos del Sistema')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({'Activo' if self.is_active else 'Inactivo'})"
