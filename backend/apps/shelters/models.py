import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Shelter(models.Model):
    TYPE_CHOICES = [
        ('hotel', 'Hotel / Hospedaje'),
        ('camp', 'Campamento Temporal'),
        ('open_area', 'Zona Abierta / Polideportivo'),
        ('community_center', 'Centro Comunitario'),
        ('other', 'Otro'),
    ]
    STATUS_CHOICES = [
        ('open', 'Abierto (Con Cupos)'),
        ('full', 'Lleno (Capacidad Máxima)'),
        ('closed', 'Cerrado / No Operativo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='Nombre del Refugio')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other', verbose_name='Tipo de Refugio')
    
    latitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Latitud')
    longitude = models.DecimalField(max_digits=10, decimal_places=6, verbose_name='Longitud')
    address = models.TextField(verbose_name='Dirección Detallada')
    state_ve = models.CharField(max_length=100, verbose_name='Estado')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', verbose_name='Estado del Refugio')
    
    current_capacity = models.IntegerField(default=0, verbose_name='Capacidad Actual')
    max_capacity = models.IntegerField(default=0, verbose_name='Capacidad Máxima')
    
    # JSON list of supplies needed (e.g. ["agua potable", "mantas", "leche de formula"])
    missing_supplies = models.JSONField(default=list, blank=True, verbose_name='Insumos Críticos Faltantes')

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_shelters',
        verbose_name='Registrado por'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Refugio'
        verbose_name_plural = 'Refugios'

    def clean(self):
        super().clean()
        if self.state_ve not in settings.VENEZUELAN_STATES:
            raise ValidationError({'state_ve': f'Estado inválido. Debe ser uno de: {", ".join(settings.VENEZUELAN_STATES)}'})
        if self.current_capacity < 0:
            raise ValidationError({'current_capacity': 'La capacidad actual no puede ser menor a 0.'})
        if self.max_capacity < 0:
            raise ValidationError({'max_capacity': 'La capacidad máxima no puede ser menor a 0.'})
        if self.current_capacity > self.max_capacity:
            raise ValidationError({'current_capacity': 'La capacidad actual no puede exceder la capacidad máxima.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - Capacidad: {self.current_capacity}/{self.max_capacity}"
