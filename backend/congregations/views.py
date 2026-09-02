from rest_framework import generics, permissions, status, serializers, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from rest_framework.authtoken.models import Token
from .models import MemberProfile, Station, District, LocalChurch
from .serializers import StationSerializer, DistrictSerializer, LocalChurchSerializer
from django.db import transaction

# Custom permission: Anyone can read, only superusers can write
class IsSuperUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_superuser

class RequestOTPView(APIView):
    permission_classes = [] # Allow anonymous access
    authentication_classes = []

    def post(self, request):
        phone = request.data.get('phone_number')
        if not phone:
            return Response({'error': 'Phone number required'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        # FIX: Use phone_number instead of username
        user, created = User.objects.get_or_create(phone_number=phone)
        if created:
            user.set_unusable_password()
            user.save()
        
        # In production, you would trigger an SMS API here.
        print(f"DEVELOPMENT: OTP for {phone} is 1234")
        
        return Response({'message': 'OTP Sent successfully'}, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        phone = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        # Accept '1234' as the universal testing OTP
        if otp == '1234':
            try:
                User = get_user_model()
                user = User.objects.get(phone_number=phone)
                # Generate or retrieve the user's permanent API token
                token, _ = Token.objects.get_or_create(user=user)
                return Response({'token': token.key}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
    
class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all().order_by('name')
    serializer_class = StationSerializer
    permission_classes = [IsSuperUserOrReadOnly]

class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.all().order_by('name')
    serializer_class = DistrictSerializer
    permission_classes = [IsSuperUserOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Allow the frontend to filter: /api/districts/?station_id=1
        station_id = self.request.query_params.get('station_id')
        if station_id:
            queryset = queryset.filter(station_id=station_id)
        return queryset

class LocalChurchViewSet(viewsets.ModelViewSet):
    queryset = LocalChurch.objects.all().order_by('name')
    serializer_class = LocalChurchSerializer
    permission_classes = [IsSuperUserOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Allow the frontend to filter: /api/churches/?district_id=1
        district_id = self.request.query_params.get('district_id')
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        return queryset



class StaffLoginView(APIView):
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user and user.check_password(password) and user.is_staff:
            token, _ = Token.objects.get_or_create(user=user)
            
            # Determine role for Next.js RBAC
            role = 'CONFERENCE_ADMIN' if user.is_superuser else 'LOCAL_CLERK'
            
            try:
                church_name = user.profile.local_church.name if user.profile.local_church else None
            except Exception:
                church_name = None

            return Response({
                'token': token.key,
                'role': role,
                'name': user.get_full_name() or user.phone_number,
                'church': church_name
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid credentials or not a staff member'}, status=status.HTTP_401_UNAUTHORIZED)

class MemberProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = MemberProfile.objects.get_or_create(user = request.user)
        return Response({
            'first_name': profile.first_name,
            'last_name': profile.last_name,
            'local_church_name': profile.local_church.name if profile.local_church else None,
            'phone_number': profile.user.phone_number,
            'local_church_id': profile.local_church.id if profile.local_church else 'Not assigned',
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        
        if first_name is not None:
            profile.first_name = first_name
        if last_name is not None:
            profile.last_name = last_name
        profile.save()

        return Response({'message': 'Profile updated successfully'}, status=status.HTTP_200_OK)

class UpdateProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        local_church_id = request.data.get('local_church_id')
        
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        
        from .models import MemberProfile
        profile, created = MemberProfile.objects.get_or_create(user=user)
        
        if first_name:
            profile.first_name = first_name
        if last_name:
            profile.last_name = last_name
        if first_name and last_name:
            profile.full_name = f"{first_name} {last_name}"
            
        if local_church_id:
            profile.local_church_id = local_church_id
            
        profile.save()
        
        return Response({'message': 'Profile updated successfully'})

class UpdateMemberChurchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        church_id = request.data.get('local_church_id')
        if not church_id:
            return Response({'error': 'Local church ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            church = LocalChurch.objects.get(id=church_id, is_active=True)
            from .models import MemberProfile
            profile, _ = MemberProfile.objects.get_or_create(user=request.user)
            profile.local_church = church
            profile.save()

            return Response({
                'message': 'Local church updated successfully',
                'church_name': church.name
            }, status=status.HTTP_200_OK)
        except LocalChurch.DoesNotExist:
            return Response({'error': 'Church not found'}, status=status.HTTP_404_NOT_FOUND)


class LocalChurchSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source='district.name', read_only=True)
    station_name = serializers.CharField(source='district.station.name', read_only=True)
    
    class Meta:
        model = LocalChurch
        fields = ['id', 'name', 'district', 'district_name', 'station_name', 'is_active']

User = get_user_model()

class StaffUserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        staff = User.objects.filter(is_staff=True).select_related('profile__local_church')
        data = []
        for s in staff:
            profile = getattr(s, 'profile', None)
            data.append({
                'id': s.id,
                'phone_number': s.phone_number,
                'email': s.email,
                'first_name': profile.first_name if profile else '',
                'last_name': profile.last_name if profile else '',
                'role': 'CONFERENCE_ADMIN' if s.is_superuser else 'LOCAL_CLERK',
                'church_name': profile.local_church.name if profile and profile.local_church else 'Conference HQ',
                'is_active': s.is_active
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        try:
            with transaction.atomic():
                phone = data.get('phone_number')
                user, created = User.objects.get_or_create(
                    phone_number=phone,
                    defaults={
                        'email': data.get('email', ''),
                        'is_staff': True,
                        'is_superuser': (data.get('role') == 'CONFERENCE_ADMIN')
                    }
                )
                
                if not created:
                    # Update existing user to staff
                    user.is_staff = True
                    user.is_superuser = (data.get('role') == 'CONFERENCE_ADMIN')
                    if data.get('email'):
                        user.email = data.get('email')
                
                user.set_password(data.get('password'))
                user.save()

                church_id = data.get('church_id')
                church = LocalChurch.objects.filter(id=church_id).first() if church_id else None
                
                MemberProfile.objects.create(
                    user=user,
                    first_name=data.get('first_name', ''),
                    last_name=data.get('last_name', ''),
                    local_church=church
                )
            return Response({'message': 'Staff created successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)