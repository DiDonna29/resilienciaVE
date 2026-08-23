"""
Missing persons model for RESILIENCIA VZLA.
"""
import uuid
import hashlib
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


def missing_person_photo_path(instance, filename):
    """Custom upload path for missing person photos."""
    ext = filename.rsplit('.', 1)[-1].lower()
    return f'missing_people/{instance.id}/{uuid.uuid4()}.{ext}'


class MissingPerson(models.Model):
    """
    Registry entry for a missing person during a disaster event.
    Tracks status from initial report through location/resolution.
    """

    STATUS_CHOICES = [
        ('missing', 'Desaparecido'),
        ('found', 'Localizado'),
        ('deceased', 'Fallecido'),
    ]

    FOUND_CONDITION_CHOICES = [
        ('safe', 'Ileso'),
        ('injured', 'Herido'),
        ('deceased', 'Fallecido'),
        ('unknown', 'Desconocido'),
    ]

    FOUND_LOCATION_TYPE_CHOICES = [
        ('hospital', 'Hospital'),
        ('shelter', 'Refugio'),
        ('risk_zone', 'Zona de Riesgo'),
        ('home', 'Domicilio'),
        ('other', 'Otro'),
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

    # Person identity
    full_name = models.CharField(
        max_length=200,
        verbose_name=_('Nombre completo'),
        db_index=True,
    )
    age = models.IntegerField(
        verbose_name=_('Edad'),
    )
    cedula = models.CharField(
        max_length=15,
        null=True,
        blank=True,
        verbose_name=_('Cédula'),
        db_index=True,
    )
    photo = models.ImageField(
        upload_to=missing_person_photo_path,
        null=True,
        blank=True,
        verbose_name=_('Foto'),
    )

    # Last known location
    last_known_latitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name=_('Latitud última ubicación'),
    )
    last_known_longitude = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name=_('Longitud última ubicación'),
    )
    last_known_location_description = models.TextField(
        verbose_name=_('Descripción de última ubicación conocida'),
    )
    state_ve = models.CharField(
        max_length=100,
        verbose_name=_('Estado venezolano'),
        db_index=True,
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='missing',
        verbose_name=_('Estado'),
        db_index=True,
    )

    # Reporter information
    reported_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reported_missing',
        verbose_name=_('Reportado por'),
    )
    reporter_phone = models.CharField(
        max_length=20,
        verbose_name=_('Teléfono del reportante'),
    )

    # Found/located information (filled when status changes from 'missing')
    located_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='located_persons',
        verbose_name=_('Localizado por'),
    )
    located_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Fecha de localización'),
    )
    found_condition = models.CharField(
        max_length=20,
        choices=FOUND_CONDITION_CHOICES,
        null=True,
        blank=True,
        verbose_name=_('Condición al encontrar'),
    )
    found_location_type = models.CharField(
        max_length=20,
        choices=FOUND_LOCATION_TYPE_CHOICES,
        null=True,
        blank=True,
        verbose_name=_('Tipo de lugar donde fue encontrado'),
    )
    found_location_description = models.TextField(
        null=True,
        blank=True,
        verbose_name=_('Descripción del lugar donde fue encontrado'),
    )
    locator_phone = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name=_('Teléfono del localizador'),
    )

    # Duplicate detection
    duplicate_hash = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name=_('Hash de duplicado'),
        help_text=_('SHA256 hash de nombre normalizado + edad para detección de duplicados.'),
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
        verbose_name = _('Persona Desaparecida')
        verbose_name_plural = _('Personas Desaparecidas')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['state_ve']),
            models.Index(fields=['duplicate_hash']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['cedula']),
        ]

    def __str__(self):
        return f'{self.full_name} ({self.age} años) — {self.get_status_display()}'

    def save(self, *args, **kwargs):
        """Auto-compute duplicate_hash before saving."""
        if not self.duplicate_hash:
            self.duplicate_hash = self._compute_hash()
        super().save(*args, **kwargs)

    def _compute_hash(self) -> str:
        """SHA256 hash of normalized name + age for fast duplicate detection."""
        import unicodedata
        normalized = unicodedata.normalize('NFKD', self.full_name.lower().strip())
        normalized = ''.join(c for c in normalized if not unicodedata.combining(c))
        key = f'{normalized}|{self.age}'
        return hashlib.sha256(key.encode('utf-8')).hexdigest()

    @property
    def reporter_whatsapp_link(self) -> str | None:
        """Generate WhatsApp link for the reporter's phone number."""
        if not self.reporter_phone:
            return None
        clean = ''.join(filter(str.isdigit, self.reporter_phone))
        if not clean:
            return None
        if not clean.startswith('58'):
            clean = '58' + clean
        return f'https://wa.me/{clean}'
