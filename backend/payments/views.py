import json
import hmac
import hashlib
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from finance.models import Transaction, TransactionAllocation, OfferingCategory
from finance.utils import generate_receipt_pdf
from .utils import initialize_paystack_payment, generate_reference

class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        phone = request.data.get('phone', getattr(request.user, 'phone_number', None))
        # Paystack strictly requires an email. If members don't have one, 
        # generate a placeholder based on their phone number for the system.
        allocations = request.data.get('allocations', {})

        email = request.data.get('email', f"{phone}@nyamiraconference.org")
        
        if not amount or not phone:
            return Response({'error': 'Amount and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)

        reference = generate_reference()

        # 1. Call Paystack API
        paystack_response = initialize_paystack_payment(email, float(amount), reference)

        if paystack_response.get('status'):
            church = request.user.profile.local_church if hasattr(request.user, 'profile') else None
            #  Save Pending Transaction to Database
            transaction = Transaction.objects.create(
                # user=request.user, # Uncomment when authentication is wired up
                user=request.user, # THIS CAPTURES THE USER IN THE DB
                local_church=church, # Links payment to their church
                total_amount=amount,
                phone_number=phone,
                paystack_reference=reference,
                email=email,
                status='PENDING'
            )

            # Iterate through the split and create Allocation records
            if isinstance(allocations, dict):
                for cat_id, data in allocations.items():
                    amt = data.get('amount') if isinstance(data, dict) else data
                    custom_text = data.get('custom', '') if isinstance(data, dict) else ''

                    if amt and float(amt) > 0:
                        category = OfferingCategory.objects.filter(id=cat_id).first()
                        if category:
                            TransactionAllocation.objects.create(
                                transaction=transaction,
                                category=category,
                                amount=amt,
                                custom_description=custom_text if category.name.lower() == 'other' else None
                            )

            # 3. Return the Paystack Checkout URL to the frontend
            return Response({
                'authorization_url': paystack_response['data']['authorization_url'],
                'reference': reference
            }, status=status.HTTP_200_OK)
        
        return Response({'error': 'Paystack initialization failed', 'details': paystack_response}, status=status.HTTP_400_BAD_REQUEST)

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