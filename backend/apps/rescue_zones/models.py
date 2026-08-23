"""
Rescue zone models for RESILIENCIA VZLA.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class RescueZone(models.Model):
    """
    Represents an active zone requiring rescue operations during a disaster event.
    Citizens and verified users can report zones; status is managed by coordinators.
    """

    RISK_CHOICES = [
        ('collapse', 'Derrumbe'),
        ('landslide', 'Deslizamiento'),
        ('flood', 'Inundación'),
        ('fire', 'Incendio'),
        ('other', 'Otro'),
    ]

    STATUS_CHOICES = [
        ('active', 'Activa'),
        ('attended', 'Atendida'),
        ('closed', 'Cerrada'),
    ]

    VENEZUELAN_STATES = [
        'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
        'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
        'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
        'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia',
    ]

    # Primary key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_('ID'),
    )

    # Zone details
    name = models.CharField(
        max_length=200,
        verbose_name=_('Nombre de la zona'),
    )
    description = models.TextField(
        verbose_name=_('Descripción'),
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        verbose_name=_('Latitud'),
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        verbose_name=_('Longitud'),
    )
    state_ve = models.CharField(
        max_length=100,
        verbose_name=_('Estado venezolano'),
        db_index=True,
    )

    # Risk classification
    risk_type = models.CharField(
        max_length=20,
        choices=RISK_CHOICES,
        verbose_name=_('Tipo de riesgo'),
        db_index=True,
    )

    # Needs
    technical_needs = models.JSONField(
        default=list,
        verbose_name=_('Necesidades técnicas'),
        help_text=_('Lista de equipamiento/personal técnico requerido. Ej: ["Retroexcavadora", "Apuntaladores"]'),
    )
    missing_supplies = models.JSONField(
        default=list,
        verbose_name=_('Suministros faltantes'),
        help_text=_('Suministros de emergencia requeridos en la zona.'),
    )
    volunteers_needed = models.IntegerField(
        default=0,
        verbose_name=_('Voluntarios requeridos'),
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name=_('Estado'),
        db_index=True,
    )

    # Ownership
    reported_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reported_rescue_zones',
        verbose_name=_('Reportado por'),
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Fecha de reporte'),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Última actualización'),
    )

    class Meta:
        verbose_name = _('Zona de Rescate')
        verbose_name_plural = _('Zonas de Rescate')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['risk_type']),
            models.Index(fields=['state_ve']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_risk_type_display()}) — {self.get_status_display()}'


class VolunteerRequest(models.Model):
    """
    A volunteer offering to assist at a specific rescue zone.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    zone = models.ForeignKey(
        RescueZone,
        on_delete=models.CASCADE,
        related_name='volunteer_requests',
        verbose_name=_('Zona de rescate'),
    )
    volunteer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='volunteer_requests',
        verbose_name=_('Voluntario'),
    )
    message = models.TextField(
        blank=True,
        verbose_name=_('Mensaje'),
        help_text=_('Descripción de habilidades o disponibilidad del voluntario.'),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Fecha de solicitud'),
    )

    class Meta:
        verbose_name = _('Solicitud de Voluntario')
        verbose_name_plural = _('Solicitudes de Voluntarios')
        unique_together = [('zone', 'volunteer')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.volunteer.full_name} → {self.zone.name}'
