"""
Seismic event model for RESILIENCIA VZLA.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _


class SeismicEvent(models.Model):
    """
    Represents a seismic event (earthquake, tremor, or minor shake) in or near Venezuela.
    Data is sourced from USGS or TerraQuake API.
    """

    SOURCE_CHOICES = [
        ('USGS', 'USGS'),
        ('TERRAQUAKE', 'TerraQuake'),
        ('MANUAL', 'Manual'),
    ]

    # Primary key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_('ID'),
    )

    # External event identifier (from API)
    event_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        verbose_name=_('ID del evento externo'),
        help_text=_('Identificador único del evento en la fuente de datos.'),
    )

    # Seismic data
    magnitude = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        verbose_name=_('Magnitud'),
        help_text=_('Magnitud en la escala local o momento.'),
    )
    depth_km = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        verbose_name=_('Profundidad (km)'),
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
    epicenter_name = models.TextField(
        verbose_name=_('Nombre del epicentro'),
        help_text=_('Descripción textual de la ubicación del epicentro.'),
    )
    magnitude_type = models.CharField(
        max_length=10,
        default='ML',
        verbose_name=_('Tipo de magnitud'),
        help_text=_('ML=Local, Mw=Momento, Mb=ondas de cuerpo, etc.'),
    )

    # Data source
    source = models.CharField(
        max_length=50,
        choices=SOURCE_CHOICES,
        default='USGS',
        verbose_name=_('Fuente de datos'),
        db_index=True,
    )
    source_url = models.URLField(
        null=True,
        blank=True,
        verbose_name=_('URL del evento en la fuente'),
    )

    # Timing
    occurred_at = models.DateTimeField(
        db_index=True,
        verbose_name=_('Fecha y hora del evento'),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Registrado en sistema'),
    )

    class Meta:
        verbose_name = _('Evento Sísmico')
        verbose_name_plural = _('Eventos Sísmicos')
        ordering = ['-occurred_at']
        indexes = [
            models.Index(fields=['-occurred_at']),
            models.Index(fields=['magnitude']),
            models.Index(fields=['source']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return f'M{self.magnitude} — {self.epicenter_name} ({self.occurred_at.strftime("%Y-%m-%d %H:%M")} UTC)'

    @property
    def event_type(self) -> str:
        """
        Classify the seismic event in Spanish based on magnitude:
        - < 3.0 → sismo (micro-tremor)
        - 3.0–4.9 → temblor (felt tremor)
        - ≥ 5.0 → terremoto (earthquake)
        """
        mag = float(self.magnitude)
        if mag < 3.0:
            return 'sismo'
        elif mag < 5.0:
            return 'temblor'
        else:
            return 'terremoto'

    @property
    def is_significant(self) -> bool:
        """True if magnitude ≥ 4.0 (potentially felt by population)."""
        return float(self.magnitude) >= 4.0

    @property
    def alert_level(self) -> str:
        """Return an alert level string for frontend color-coding."""
        mag = float(self.magnitude)
        if mag < 3.0:
            return 'green'
        elif mag < 4.0:
            return 'yellow'
        elif mag < 5.0:
            return 'orange'
        else:
            return 'red'
