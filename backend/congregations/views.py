from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from rest_framework.authtoken.models import Token
from .models import MemberProfile, Station, District, LocalChurch
from .serializers import StationSerializer, DistrictSerializer, LocalChurchSerializer

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
    
class StationListView(generics.ListAPIView):
    queryset = Station.objects.all()
    serializer_class = StationSerializer

class DistrictListView(generics.ListAPIView):
    serializer_class = DistrictSerializer
    
    def get_queryset(self):
        queryset = District.objects.all()
        # Allow the frontend to filter: /api/districts/?station_id=1
        station_id = self.request.query_params.get('station_id')
        if station_id:
            queryset = queryset.filter(station_id=station_id)
        return queryset

class LocalChurchListView(generics.ListAPIView):
    serializer_class = LocalChurchSerializer
    
    def get_queryset(self):
        queryset = LocalChurch.objects.filter(is_active=True)
        # Allow the frontend to filter: /api/churches/?district_id=1
        district_id = self.request.query_params.get('district_id')
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        return queryset

class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated] # Secure the endpoint

    def post(self, request):
        amount = request.data.get('amount')
        phone = request.data.get('phone')
        email = request.data.get('email', f"{phone}@nyamiraconference.org")
        
        if not amount or not phone:
            return Response({'error': 'Amount and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)

        reference = generate_reference()
        paystack_response = initialize_paystack_payment(email, float(amount), reference)

        if paystack_response.get('status'):
            # Get the user's church if they have a profile
            church = request.user.profile.local_church if hasattr(request.user, 'profile') else None

            Transaction.objects.create(
                user=request.user, # THIS CAPTURES THE USER IN THE DB
                local_church=church, # Links payment to their church
                total_amount=amount,
                phone_number=phone,
                paystack_reference=reference,
                email=email,
                status='PENDING'
            )

            return Response({
                'authorization_url': paystack_response['data']['authorization_url'],
                'reference': reference
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Paystack initialization failed'}, status=status.HTTP_400_BAD_REQUEST)

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