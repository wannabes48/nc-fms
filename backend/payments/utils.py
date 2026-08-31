import requests
from django.conf import settings
import uuid

def generate_reference():
    return f"NC-{uuid.uuid4().hex[:12].upper()}"

def initialize_paystack_payment(email, amount, reference):
    """
    Calls Paystack to start a transaction. 
    Amount must be in the lowest currency unit (e.g., Cents/Kobo). For KES, multiply by 100.
    """
    url = "https://api.paystack.co/transaction/initialize"
    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "email": email,
        "amount": int(amount * 100), # Convert KES to cents
        "reference": reference,
        "currency": "KES",
        "channels": ["mobile_money", "card"] # Allow M-Pesa and Cards
    }

    response = requests.post(url, headers=headers, json=data)
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