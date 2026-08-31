from rest_framework import serializers
from .models import LocalChurch, District

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name']

class LocalChurchSerializer(serializers.ModelSerializer):
    district = DistrictSerializer(read_only=True)
    
    class Meta:
        model = LocalChurch
        fields = ['id', 'name', 'district']