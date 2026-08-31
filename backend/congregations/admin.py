from django.contrib import admin
from .models import District, LocalChurch, MemberProfile

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(LocalChurch)
class LocalChurchAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'is_active')
    list_filter = ('district', 'is_active')
    search_fields = ('name', 'district__name')

@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'local_church')
    list_filter = ('local_church__district', 'local_church')
    search_fields = ('full_name', 'user__phone_number')