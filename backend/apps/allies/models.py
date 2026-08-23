import uuid
from django.db import models
from django.conf import settings

class AllyProfile(models.Model):
    TYPE_CHOICES = [
        ('company', 'Empresa / Comercio'),
        ('brand', 'Marca'),
        ('donor', 'Donador Particular'),
        ('individual', 'Persona Natural / Voluntario Técnico'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='Nombre Comercial o Razón Social')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='company', verbose_name='Tipo de Colaborador')
    
    description = models.TextField(verbose_name='Descripción de la Ayuda u Ofrecimiento')
    
    # JSON for contact details: {"phone": "+58...", "email": "...", "website": "...", "instagram": "..."}
    contact_info = models.JSONField(default=dict, verbose_name='Información de Contacto')
    
    # JSON list of services/supplies offered (e.g. ["transporte", "maquinaria pesada", "primeros auxilios"])
    services_offered = models.JSONField(default=list, blank=True, verbose_name='Servicios o Insumos Ofrecidos')

    logo = models.ImageField(upload_to='allies_logos/', blank=True, null=True, verbose_name='Logo o Imagen de Referencia')

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_allies',
        verbose_name='Registrado por'
    )
    
    active_from = models.DateTimeField(auto_now_add=True, verbose_name='Activo Desde')
    active_until = models.DateTimeField(blank=True, null=True, verbose_name='Activo Hasta')
    is_active = models.BooleanField(default=True, verbose_name='¿Está Activo Actualmente?')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Perfil de Aliado'
        verbose_name_plural = 'Perfiles de Aliados'

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
