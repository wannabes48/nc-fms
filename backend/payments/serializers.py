from rest_framework import serializers
from finance.models import Transaction, TransactionAllocation

class TransactionAllocationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = TransactionAllocation
        fields = ['category_name', 'amount', 'custom_description']

class TransactionSerializer(serializers.ModelSerializer):
    allocations = TransactionAllocationSerializer(many=True, read_only=True)
    member_name = serializers.SerializerMethodField()
    church_name = serializers.CharField(source='local_church.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'paystack_reference', 'phone_number', 'member_name', 'church_name', 'total_amount', 'status', 'created_at', 'allocations']

    def get_member_name(self, obj):
        if hasattr(obj.user, 'profile'):
            return f"{obj.user.profile.first_name} {obj.user.profile.last_name}".strip()
        return "Guest"