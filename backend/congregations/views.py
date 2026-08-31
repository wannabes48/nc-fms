from rest_framework import generics
from .models import LocalChurch
from .serializers import LocalChurchSerializer

class LocalChurchListView(generics.ListAPIView):
    queryset = LocalChurch.objects.filter(is_active=True)
    serializer_class = LocalChurchSerializer