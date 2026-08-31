from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

User = get_user_model()

class RequestOTPView(APIView):
    def post(self, request):
        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({"error": "Phone number is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user if they don't exist yet
        user, created = User.objects.get_or_create(phone_number=phone_number)
        
        # TODO: Trigger SMS API here
        print(f"Mock SMS: Your Nyamira Conference OTP is 1234") 
        
        return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)

class VerifyOTPView(APIView):
    def post(self, request):
        phone_number = request.data.get('phone_number')
        otp = request.data.get('otp')
        
        # Hardcoded for testing
        if otp == "1234": 
            try:
                user = User.objects.get(phone_number=phone_number)
                user.is_verified = True
                user.save()
                
                # Generate or retrieve the access token
                token, _ = Token.objects.get_or_create(user=user)
                return Response({"token": token.key, "message": "Login successful"}, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)