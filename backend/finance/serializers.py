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
    
    class Meta:
        model = Transaction
        fields = ['paystack_reference', 'total_amount', 'status', 'created_at', 'allocations']