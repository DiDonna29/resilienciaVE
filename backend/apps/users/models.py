"""
Custom User model for RESILIENCIA VZLA.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """Custom manager for User model using email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user."""
        if not email:
            raise ValueError(_('El correo electrónico es obligatorio.'))
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'CITIZEN')
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a SuperAdmin user."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPERADMIN')
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('SuperAdmin debe tener is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('SuperAdmin debe tener is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

    def get_by_natural_key(self, email):
        return self.get(email=self.normalize_email(email))


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for RESILIENCIA VZLA platform.
    Uses email instead of username. Supports Google OAuth and manual registration.
    """

    ROLE_CHOICES = [
        ('SUPERADMIN', 'SuperAdmin'),
        ('ADMIN', 'Administrador'),
        ('CITIZEN', 'Ciudadano'),
    ]

    AUTH_PROVIDER_CHOICES = [
        ('google', 'Google'),
        ('manual', 'Manual'),
    ]

    # Primary key
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_('ID'),
    )

    # Identity
    email = models.EmailField(
        unique=True,
        verbose_name=_('Correo electrónico'),
        help_text=_('Correo electrónico único del usuario.'),
    )
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('Nombre'),
    )
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Apellido'),
    )
    cedula = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        verbose_name=_('Cédula'),
        help_text=_('Formato: V-12345678 o E-12345678'),
    )
    phone_number = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name=_('Teléfono'),
    )

    # Role
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='CITIZEN',
        verbose_name=_('Rol'),
        db_index=True,
    )

    # Verification flags
    is_verified_health_worker = models.BooleanField(
        default=False,
        verbose_name=_('Trabajador de Salud Verificado'),
    )
    is_verified_shelter_manager = models.BooleanField(
        default=False,
        verbose_name=_('Gestor de Refugio Verificado'),
    )
    is_verified_org_donor = models.BooleanField(
        default=False,
        verbose_name=_('Organización / Donante Verificado'),
    )
    is_verified_web_collaborator = models.BooleanField(
        default=False,
        verbose_name=_('Colaborador Web Verificado'),
    )

    # Auth provider
    auth_provider = models.CharField(
        max_length=20,
        choices=AUTH_PROVIDER_CHOICES,
        default='manual',
        verbose_name=_('Proveedor de autenticación'),
    )
    google_id = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        verbose_name=_('Google ID'),
        db_index=True,
    )

    # Standard Django fields
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Activo'),
    )
    is_staff = models.BooleanField(
        default=False,
        verbose_name=_('Staff'),
    )
    date_joined = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Fecha de registro'),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Última actualización'),
    )

    # Manager
    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['cedula']),
            models.Index(fields=['google_id']),
        ]

    def __str__(self):
        return f'{self.full_name} <{self.email}>'

    @property
    def full_name(self) -> str:
        """Return the user's full name."""
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def whatsapp_link(self) -> str | None:
        """
        Generate a WhatsApp link for the user's phone number.
        Automatically prepends Venezuelan country code (58) if not present.
        """
        if not self.phone_number:
            return None
        clean = ''.join(filter(str.isdigit, self.phone_number))
        if not clean:
            return None
        if not clean.startswith('58'):
            clean = '58' + clean
        return f'https://wa.me/{clean}'

    @property
    def is_superadmin(self) -> bool:
        """Convenience property to check superadmin role."""
        return self.role == 'SUPERADMIN'

    def get_verification_flags(self) -> dict:
        """Return a dict of the user's verification flags."""
        return {
            'is_verified_health_worker': self.is_verified_health_worker,
            'is_verified_shelter_manager': self.is_verified_shelter_manager,
            'is_verified_org_donor': self.is_verified_org_donor,
        }

class VerificationRequest(models.Model):
    """
    Model to handle manual role verification requests by citizens.
    """
    ROLE_CHOICES = [
        ('health_worker', _('Trabajador de Salud')),
        ('shelter_manager', _('Gestor de Refugio')),
        ('org_donor', _('Organización Donante')),
    ]
    STATUS_CHOICES = [
        ('pending', _('Pendiente')),
        ('approved', _('Aprobado')),
        ('rejected', _('Rechazado')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_requests')
    role_requested = models.CharField(max_length=50, choices=ROLE_CHOICES, verbose_name=_('Rol Solicitado'))
    document = models.ImageField(upload_to='verifications/', verbose_name=_('Documento de Identidad/Credencial'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name=_('Estado'))
    admin_notes = models.TextField(blank=True, verbose_name=_('Notas del Administrador'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Fecha de Solicitud'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Última actualización'))

    class Meta:
        verbose_name = _('Solicitud de Verificación')
        verbose_name_plural = _('Solicitudes de Verificación')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.full_name} - {self.get_role_requested_display()} ({self.get_status_display()})'
