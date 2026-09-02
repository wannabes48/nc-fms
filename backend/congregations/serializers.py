from rest_framework import serializers
from .models import Station, District, LocalChurch

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = ['id', 'name', 'created_at']

class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'station', 'created_at']

class LocalChurchSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocalChurch
        fields = ['id', 'name', 'district', 'created_at']