from django.contrib import admin
from .models import Station, District, LocalChurch, MemberProfile

@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'station', 'created_at')
    list_filter = ('station',)
    search_fields = ('name', 'station__name')

@admin.register(LocalChurch)
class LocalChurchAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'is_active')
    list_filter = ('district', 'is_active')
    search_fields = ('name', 'district__name')

@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'user', 'local_church', 'created_at')
    list_filter = ('local_church__district', 'local_church')
    search_fields = ('first_name', 'last_name', 'user__phone_number')