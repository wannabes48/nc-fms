import json
import hmac
import hashlib
import calendar
import csv
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, F
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics, serializers
from finance.models import Transaction, TransactionAllocation, OfferingCategory
from finance.utils import generate_receipt_pdf
from .utils import trigger_mpesa_stk, generate_reference
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .serializers import TransactionSerializer

class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        phone = request.data.get('phone', getattr(request.user, 'phone_number', None))
        allocations = request.data.get('allocations', {})

        email = request.data.get('email', f"{phone}@nyamiraconference.org")
        
        if not amount or not phone:
            return Response({'error': 'Amount and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)

        reference = generate_reference()
        
        # Trigger the direct STK Push
        paystack_response = trigger_mpesa_stk(email, amount, reference, phone)

        if paystack_response.get('status'):
            church = request.user.profile.local_church if hasattr(request.user, 'profile') else None

            transaction = Transaction.objects.create(
                user=request.user,
                local_church=church,
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

            # Tell the frontend the push was sent
            return Response({
                'message': 'STK Push sent successfully', 
                'reference': reference
            }, status=status.HTTP_200_OK)
        
        # Print the error to your Django console so you know exactly why it failed
        print("Paystack Error:", paystack_response)
        return Response({'error': 'Failed to trigger STK Push'}, status=status.HTTP_400_BAD_REQUEST)

class TransactionStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        try:
            transaction = Transaction.objects.get(paystack_reference=reference, user=request.user)
            
            # Safely build the receipt URL if the PDF has been generated
            receipt_url = None
            if transaction.receipt_file and hasattr(transaction.receipt_file, 'url'):
                receipt_url = request.build_absolute_uri(transaction.receipt_file.url)

            return Response({
                'status': transaction.status,
                'receipt_url': receipt_url
            }, status=status.HTTP_200_OK)
            
        except Transaction.DoesNotExist:
            return Response({'error': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    # We don't require standard authentication since Paystack is calling it
    authentication_classes = [] 
    permission_classes = []

    def post(self, request, *args, **kwargs):
        paystack_signature = request.headers.get('x-paystack-signature')
        
        # 1. Reject if no signature is provided
        if not paystack_signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Verify the signature using your Secret Key
        payload = request.body
        secret = settings.PAYSTACK_SECRET_KEY.encode('utf-8')
        expected_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()

        if expected_signature != paystack_signature:
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Parse the event
        try:
            event_data = json.loads(payload)
            event = event_data.get('event')

            # 4. Handle a successful payment
            if event == 'charge.success':
                reference = event_data.get('data', {}).get('reference')
                
                if reference:
                    try:
                        # Update the transaction in the database
                        transaction = Transaction.objects.get(paystack_reference=reference)
                        
                        # Idempotency check: only process if not already completed
                        if transaction.status != 'COMPLETED':
                            transaction.status = 'COMPLETED'
                            transaction.save()
                            
                            generate_receipt_pdf(transaction.id)
                            print(f"Transaction {reference} marked as COMPLETED.")
                        else:
                            print(f"Transaction {reference} already processed.")
                            
                    except Transaction.DoesNotExist:
                        print(f"Transaction {reference} not found in database.")

            # Always return 200 OK immediately so Paystack knows you received it
            return Response(status=status.HTTP_200_OK)

        except json.JSONDecodeError:
            return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Base Query: Only count successful/completed transactions
        # (If you are still testing and everything is 'PENDING', change this temporarily to 'PENDING')
        transactions = Transaction.objects.filter(status='COMPLETED')

        # 2. Scope by Role (Local Clerk vs Conference Admin)
        if not request.user.is_superuser:
            church = request.user.profile.local_church if hasattr(request.user, 'profile') else None
            transactions = transactions.filter(local_church=church)

        allocations = TransactionAllocation.objects.filter(transaction__in=transactions)

        # 3. Aggregate KPIs
        total_collections = transactions.aggregate(total=Sum('total_amount'))['total'] or 0
        active_givers = transactions.values('user').distinct().count()

        tithe_allocations = allocations.filter(category__name__icontains='Tithe')
        other_allocations = allocations.exclude(category__name__icontains='Tithe')
        
        tithe_total = tithe_allocations.aggregate(t=Sum('amount'))['t'] or 0
        offerings_total = other_allocations.aggregate(t=Sum('amount'))['t'] or 0

        # 4. Fund Breakdown
        # Groups allocations by category name and sums the amount
        fund_breakdown = list(
            allocations.values(name=F('category__name'))
            .annotate(value=Sum('amount'))
            .order_by('-value')
        )

        # 5. Weekly Trends (Last 8 Weeks)
        end_date = timezone.now()
        weekly_data = []
        
        for i in range(8, 0, -1):
            week_start = end_date - timezone.timedelta(weeks=i)
            week_end = end_date - timezone.timedelta(weeks=i-1)
            
            week_txs = transactions.filter(created_at__gte=week_start, created_at__lt=week_end)
            week_allocs = TransactionAllocation.objects.filter(transaction__in=week_txs)
            
            w_tithe = week_allocs.filter(category__name__icontains='Tithe').aggregate(t=Sum('amount'))['t'] or 0
            w_offering = week_allocs.exclude(category__name__icontains='Tithe').aggregate(t=Sum('amount'))['t'] or 0
            
            # e.g., 'W34' for week 34
            week_label = f"W{week_start.isocalendar()[1]}"
            
            weekly_data.append({
                'time': week_label,
                'tithe': float(w_tithe),
                'offering': float(w_offering)
            })

        return Response({
            'kpis': {
                'total': float(total_collections),
                'tithe': float(tithe_total),
                'offerings': float(offerings_total),
                'members': active_givers,
                'growth': 0 # To be calculated against previous year later
            },
            'fund_breakdown': fund_breakdown,
            'weekly_data': weekly_data
        })

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TransactionListView(ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # 1. RBAC Enforcement
        if self.request.user.is_superuser:
            queryset = Transaction.objects.all().order_by('-created_at')
        else:
            church = self.request.user.profile.local_church if hasattr(self.request.user, 'profile') else None
            queryset = Transaction.objects.filter(local_church=church).order_by('-created_at')

        # 2. Search by reference or phone
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(paystack_reference__icontains=search) | 
                Q(phone_number__icontains=search)
            )

        # 3. Filter by Status
        status_param = self.request.query_params.get('status', None)
        if status_param and status_param != 'ALL':
            queryset = queryset.filter(status=status_param)

        return queryset

class TransactionExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. RBAC Enforcement
        if request.user.is_superuser:
            queryset = Transaction.objects.all().order_by('-created_at')
        else:
            church = request.user.profile.local_church if hasattr(request.user, 'profile') else None
            queryset = Transaction.objects.filter(local_church=church).order_by('-created_at')

        # 2. Apply active filters
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(paystack_reference__icontains=search) | 
                Q(phone_number__icontains=search)
            )

        status_param = request.query_params.get('status', None)
        if status_param and status_param != 'ALL':
            queryset = queryset.filter(status=status_param)

        # 3. Setup CSV Response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="treasury_export.csv"'

        writer = csv.writer(response)
        # Write Header Row
        writer.writerow(['Reference', 'Date', 'Member Name', 'Phone Number', 'Church', 'Status', 'Total Amount'])

        # Write Data Rows
        for tx in queryset:
            member_name = f"{tx.user.profile.first_name} {tx.user.profile.last_name}".strip() if hasattr(tx.user, 'profile') else "Guest"
            church_name = tx.local_church.name if tx.local_church else "Conference"
            
            writer.writerow([
                tx.paystack_reference,
                tx.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                member_name,
                tx.phone_number,
                church_name,
                tx.status,
                float(tx.total_amount)
            ])

        return response

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferingCategory
        fields = ['id', 'name', 'description', 'is_active']

class IsSuperUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_superuser

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = OfferingCategory.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserOrReadOnly]

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OfferingCategory.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserOrReadOnly]