from rest_framework import generics, permissions
from .models import OfferingCategory, Transaction
from .serializers import OfferingCategorySerializer, TransactionSerializer

class OfferingCategoryListView(generics.ListAPIView):
    queryset = OfferingCategory.objects.filter(is_active=True)
    serializer_class = OfferingCategorySerializer

class TransactionHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated] # Secures the endpoint

    def get_queryset(self):
        user = self.request.user

        # 1. Conference Admins (Superusers or Staff) can see all transactions
        if user.is_superuser or user.is_staff:
            return Transaction.objects.all().order_by('-created_at')
        
        # 2. Local Clerks can only see transactions tied to their assigned church
        # We check if the user has a linked MemberProfile and a local_church assigned
        if hasattr(user, 'profile') and user.profile.is_clerk:
            return Transaction.objects.filter(
                local_church=user.profile.local_church
            ).order_by('-created_at')
        
        # 3. Regular Members can only see their own personal transactions
        return Transaction.objects.filter(user=user).order_by('-created_at')