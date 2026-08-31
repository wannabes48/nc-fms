from django.contrib import admin
from .models import OfferingCategory, Transaction, TransactionAllocation

@admin.register(OfferingCategory)
class OfferingCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

class TransactionAllocationInline(admin.TabularInline):
    model = TransactionAllocation
    extra = 0
    readonly_fields = ('category', 'amount')
    can_delete = False

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('paystack_reference', 'user', 'local_church', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'local_church__district', 'local_church')
    search_fields = ('paystack_reference', 'phone_number', 'user__phone_number', 'email')
    readonly_fields = ('paystack_reference', 'email', 'total_amount', 'status', 'phone_number')
    inlines = [TransactionAllocationInline]
    
    # Prevent manual creation/deletion of financial records from the admin panel to ensure audit integrity
    def has_add_permission(self, request):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False