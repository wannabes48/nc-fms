from rest_framework import serializers
from .models import OfferingCategory, Transaction, TransactionAllocation

class OfferingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferingCategory
        fields = ['id', 'name', 'description']

class TransactionAllocationSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = TransactionAllocation
        fields = ['category_name', 'amount']

class TransactionSerializer(serializers.ModelSerializer):
    allocations = TransactionAllocationSerializer(many=True, read_only=True)
    member_name = serializers.SerializerMethodField()
    church_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = ['paystack_reference', 'total_amount', 'status', 'created_at', 'allocations', 'member_name', 'church_name']

    def get_member_name(self, obj):
        if hasattr(obj.user, 'profile'):
            return f"{obj.user.profile.first_name} {obj.user.profile.last_name}".strip()
        return "Member"

    def get_church_name(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.local_church:
            return obj.user.profile.local_church.name
        return "Church"