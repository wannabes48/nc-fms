from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class District(models.Model):
    name = models.CharField(_('district name'), max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('District')
        verbose_name_plural = _('Districts')
        ordering = ['name']

    def __str__(self):
        return self.name

class LocalChurch(models.Model):
    name = models.CharField(_('church name'), max_length=100)
    district = models.ForeignKey(
        District, 
        on_delete=models.CASCADE, 
        related_name='churches',
        verbose_name=_('district')
    )
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Local Church')
        verbose_name_plural = _('Local Churches')
        # Prevents creating two churches with the exact same name in the same district
        unique_together = ['name', 'district'] 
        ordering = ['district__name', 'name']

    def __str__(self):
        return f"{self.name} - {self.district.name}"

class MemberProfile(models.Model):
    """
    Links the CustomUser (phone number) to their specific local church
    and stores additional personal details.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name=_('user')
    )
    local_church = models.ForeignKey(
        LocalChurch, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='members',
        verbose_name=_('local church')
    )
    full_name = models.CharField(_('full name'), max_length=150)
    is_clerk = models.BooleanField(_('is local clerk'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Member Profile')
        verbose_name_plural = _('Member Profiles')

    def __str__(self):
        return f"{self.full_name} ({self.local_church})"