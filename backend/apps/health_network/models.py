import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class HealthCenter(models.Model):
    TYPE_CHOICES = [
        ('hospital', 'Hospital'),
        ('clinic', 'Clínica'),
        ('medical_post', 'Puesto de Atención Médica'),
    ]
    STATUS_CHOICES = [
        ('operational', 'Operativo (Con Capacidad)'),
        ('critical', 'Crítico (Insumos/Personal Limitados)'),
        ('closed', 'Fuera de Servicio / Colapsado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='Nombre del Centro')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='hospital', verbose_name='Tipo de Centro')
    
    latitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Latitud')
    longitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Longitud')
    address = models.TextField(verbose_name='Dirección Detallada')
    state_ve = models.CharField(max_length=100, verbose_name='Estado')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='operational', verbose_name='Estado de Operatividad')
    is_attending = models.BooleanField(default=True, verbose_name='¿Está Atendiendo Emergencias?')
    
    # JSON list of supplies needed (e.g. ["gasa", "jeringas", "solucion fisiologica"])
    missing_supplies = models.JSONField(default=list, blank=True, verbose_name='Insumos Críticos Faltantes')
    
    contact_phone = models.CharField(max_length=50, verbose_name='Teléfono de Contacto')
    contact_email = models.EmailField(blank=True, null=True, verbose_name='Email de Contacto')

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_health_centers',
        verbose_name='Registrado por'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Centro de Salud'
        verbose_name_plural = 'Centros de Salud'

    def clean(self):
        super().clean()
        if self.state_ve not in settings.VENEZUELAN_STATES:
            raise ValidationError({'state_ve': f'Estado inválido. Debe ser uno de: {", ".join(settings.VENEZUELAN_STATES)}'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {self.state_ve}"
