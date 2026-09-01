import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from congregations.models import LocalChurch

class OfferingCategory(models.Model):
    name = models.CharField(_('category name'), max_length=100, unique=True)
    description = models.TextField(_('description'), blank=True, null=True)
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Offering Category')
        verbose_name_plural = _('Offering Categories')
        ordering = ['name']

    def __str__(self):
        return self.name

class Transaction(models.Model):
    class TransactionStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        COMPLETED = 'COMPLETED', _('Completed')
        FAILED = 'FAILED', _('Failed')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions',
        verbose_name=_('user')
    )
    # We save the church at the time of transaction so if a member moves churches later,
    # past funds remain credited to the correct historical church.
    local_church = models.ForeignKey(
        LocalChurch,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions',
        verbose_name=_('local church')
    )
    total_amount = models.DecimalField(_('total amount'), max_digits=10, decimal_places=2)
    phone_number = models.CharField(_('payment phone number'), max_length=15)
    paystack_reference = models.CharField(_('Paystack Reference'), max_length=100, unique=True, default=uuid.uuid4)
    email = models.EmailField(_('email'), blank=True, null=True) # Paystack requires an email
    receipt_file = models.FileField(upload_to='receipts/', null=True, blank=True)
    status = models.CharField(
        _('status'), 
        max_length=20, 
        choices=TransactionStatus.choices, 
        default=TransactionStatus.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Transaction')
        verbose_name_plural = _('Transactions')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.mpesa_receipt_number or 'Pending'} - KES {self.total_amount}"

class TransactionAllocation(models.Model):
    """
    Handles the split of a single M-Pesa transaction into different offering categories.
    """
    transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.CASCADE, 
        related_name='allocations',
        verbose_name=_('transaction')
    )
    category = models.ForeignKey(
        OfferingCategory, 
        on_delete=models.PROTECT, # Prevent deleting a category if money is tied to it
        related_name='allocations',
        verbose_name=_('offering category')
    )
    amount = models.DecimalField(_('amount'), max_digits=10, decimal_places=2)
    custom_description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = _('Transaction Allocation')
        verbose_name_plural = _('Transaction Allocations')

    def __str__(self):
        return f"{self.category.name}: KES {self.amount}"