import uuid
from django.db import models
from django.conf import settings

class CrisisResource(models.Model):
    CATEGORY_CHOICES = [
        ('app', 'Aplicación Móvil / PWA'),
        ('website', 'Sitio Web de Ayuda'),
        ('social', 'Red Social / Canal de Difusión'),
        ('ngo', 'Organización No Gubernamental (ONG)'),
        ('other', 'Otro Recurso'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, verbose_name='Nombre del Recurso')
    url = models.URLField(max_length=500, verbose_name='Enlace / URL')
    social_network = models.CharField(max_length=100, blank=True, null=True, verbose_name='Red Social o Usuario (ej. @resilienciave)')
    description = models.CharField(max_length=140, verbose_name='Descripción Corta (máx 140 caracteres)')
    
    screenshot = models.ImageField(upload_to='crisis_screenshots/', blank=True, null=True, verbose_name='Captura de Pantalla / Imagen de Referencia')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='website', verbose_name='Categoría')
    
    is_approved = models.BooleanField(default=False, verbose_name='¿Está Aprobado por Moderación?')
    
    # JSON list of flags/reasons if any inappropriate words detected
    moderation_flags = models.JSONField(default=list, blank=True, verbose_name='Banderas de Moderación')

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_resources',
        verbose_name='Enviado por'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Recurso de Crisis'
        verbose_name_plural = 'Recursos de Crisis'

    def __str__(self):
        return f"{self.name} - {self.get_category_display()}"
