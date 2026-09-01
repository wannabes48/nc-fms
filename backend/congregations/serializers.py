from rest_framework import serializers
from .models import Station, District, LocalChurch

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['id', 'name']

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'station']

class LocalChurchSerializer(serializers.ModelSerializer):
    district = DistrictSerializer(read_only=True)
    
    class Meta:
        model = LocalChurch
        fields = ['id', 'name', 'district']