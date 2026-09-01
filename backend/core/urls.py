from django.contrib import admin
from django.urls import path

from congregations.views import LocalChurchListCreateView, LocalChurchDetailView
from finance.views import OfferingCategoryListView, TransactionHistoryView
from payments.views import InitiatePaymentView, PaystackWebhookView, AnalyticsAPIView, TransactionListView, TransactionExportCSVView, CategoryListCreateView, CategoryDetailView, TransactionStatusView
from congregations.views import StationListView, DistrictListView, RequestOTPView, VerifyOTPView, StaffLoginView, MemberProfileView, UpdateProfileView, UpdateMemberChurchView, StaffUserManagementView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth Endpoints
    path('api/auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('api/auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('api/auth/profile/', MemberProfileView.as_view(), name='member-profile'),
    path('api/auth/update-profile/', UpdateProfileView.as_view(), name='update-profile'),
    path('api/auth/update-church/', UpdateMemberChurchView.as_view(), name='update-church'),
    
    # App Endpoints
    path('api/stations/', StationListView.as_view(), name='station-list'),
    path('api/districts/', DistrictListView.as_view(), name='district-list'),
    path('api/churches/', LocalChurchListCreateView.as_view(), name='church-list'),
    path('api/churches/<int:pk>/', LocalChurchDetailView.as_view(), name='church-detail'),

    path('api/transactions/history/', TransactionHistoryView.as_view(), name='transaction-history'),
    path('api/payments/initiate/', InitiatePaymentView.as_view(), name='initiate-payment'),
    path('api/payments/status/<str:reference>/', TransactionStatusView.as_view(), name='payment-status'),
    path('api/payments/webhook/', PaystackWebhookView.as_view(), name='paystack-webhook'),
    path('api/auth/staff-login/', StaffLoginView.as_view(), name='staff-login'),
    path('api/analytics/', AnalyticsAPIView.as_view(), name='dashboard-analytics'),
    path('api/transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('api/transactions/export/', TransactionExportCSVView.as_view(), name='transaction-export'),
    path('api/categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('api/categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('api/staff/', StaffUserManagementView.as_view(), name='staff-management'),
]