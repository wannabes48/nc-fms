import requests
from django.conf import settings
import uuid
import re

def generate_reference():
    return f"NC-{uuid.uuid4().hex[:12].upper()}"

def trigger_mpesa_stk(email, amount, reference, phone):
    """
    Calls the Paystack Charge API to trigger a direct M-Pesa STK Push.
    """
    url = "https://api.paystack.co/charge"
    
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    
    # Paystack requires the amount in the lowest denomination (cents for KES)
    amount_in_cents = int(float(amount) * 100)
    # Sanitize phone number to strictly include the '+' prefix (+2547...)
    safe_phone = re.sub(r'\D', '', str(phone))
    if safe_phone.startswith('0'):
        safe_phone = '+254' + safe_phone[1:]
    elif safe_phone.startswith('254') and len(safe_phone) == 12:
        safe_phone = '+' + safe_phone
    elif len(safe_phone) == 9:
        safe_phone = '+254' + safe_phone
    
    payload = {
        "email": email,
        "amount": amount_in_cents,
        "currency": "KES",
        "reference": reference,
        "mobile_money": {
            "phone": safe_phone,       # E.g., '0712345678'
            "provider": "mpesa"
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

def verify_paystack_payment(reference):
    """
    Verifies the final status of a transaction after the user pays.
    """
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    }
    
    response = requests.get(url, headers=headers)
    return response.json()