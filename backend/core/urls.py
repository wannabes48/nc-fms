from django.contrib import admin
from django.urls import path

# Import the views we just created
from users.views import RequestOTPView, VerifyOTPView
from congregations.views import LocalChurchListView
from finance.views import OfferingCategoryListView, TransactionHistoryView
from payments.views import InitiatePaymentView, PaystackWebhookView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Endpoints
    path('api/auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    
    # App Endpoints
    path('api/churches/', LocalChurchListView.as_view(), name='church-list'),
    path('api/categories/', OfferingCategoryListView.as_view(), name='category-list'),
    path('api/transactions/history/', TransactionHistoryView.as_view(), name='transaction-history'),
    path('api/payments/initiate/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('api/payments/webhook/', PaystackWebhookView.as_view(), name='paystack-webhook'),
]