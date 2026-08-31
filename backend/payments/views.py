import json
import hmac
import hashlib
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from finance.models import Transaction
from finance.utils import generate_receipt_pdf
from .utils import initialize_paystack_payment, generate_reference

class InitiatePaymentView(APIView):
    def post(self, request):
        amount = request.data.get('amount')
        phone = request.data.get('phone')
        # Paystack strictly requires an email. If members don't have one, 
        # generate a placeholder based on their phone number for the system.
        email = request.data.get('email', f"{phone}@nyamiraconference.org")
        
        if not amount or not phone:
            return Response({'error': 'Amount and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)

        reference = generate_reference()

        # 1. Call Paystack API
        paystack_response = initialize_paystack_payment(email, float(amount), reference)

        if paystack_response.get('status'):
            # 2. Save Pending Transaction to Database
            Transaction.objects.create(
                # user=request.user, # Uncomment when authentication is wired up
                total_amount=amount,
                phone_number=phone,
                paystack_reference=reference,
                email=email,
                status='PENDING'
            )

            # 3. Return the Paystack Checkout URL to the frontend
            return Response({
                'authorization_url': paystack_response['data']['authorization_url'],
                'reference': reference
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Paystack initialization failed'}, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch') # Webhooks don't use CSRF tokens
class PaystackWebhookView(APIView):
    # We don't require standard authentication for this endpoint since Paystack is calling it
    authentication_classes = [] 
    permission_classes = []

    def post(self, request, *args, **kwargs):
        # 1. Get the signature from Paystack headers
        paystack_signature = request.headers.get('x-paystack-signature')
        if not paystack_signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Verify the signature using your Secret Key
        secret = settings.PAYSTACK_SECRET_KEY.encode('utf-8')
        body = request.body
        expected_hash = hmac.new(secret, body, hashlib.sha512).hexdigest()

        if expected_hash != paystack_signature:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Parse the event
        try:
            payload = json.loads(body)
            event = payload.get('event')

            # 4. Handle a successful payment
            if event == 'charge.success':
                data = payload.get('data', {})
                reference = data.get('reference')
                
                if reference:
                    try:
                        # Update the transaction in the database
                        transaction = Transaction.objects.get(paystack_reference=reference)
                        transaction.status = 'COMPLETED'
                        transaction.save()
                        generate_receipt_pdf(transaction.id)
                        print(f"Transaction {reference} marked as COMPLETED.")
                    except Transaction.DoesNotExist:
                        print(f"Transaction {reference} not found in database.")

            # Always return 200 OK immediately so Paystack knows you received it
            return Response(status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response(status=status.HTTP_400_BAD_REQUEST)