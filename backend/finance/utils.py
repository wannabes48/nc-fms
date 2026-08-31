from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from weasyprint import HTML
from .models import Transaction

def generate_receipt_pdf(transaction_id):
    # Fetch the completed transaction
    transaction = Transaction.objects.prefetch_related('allocations').get(id=transaction_id)
    
    # Render the HTML template with the transaction data
    html_string = render_to_string('receipt.html', {'transaction': transaction})
    
    # Convert the HTML string to a PDF using WeasyPrint
    pdf_file = HTML(string=html_string).write_pdf()
    
    # Save the PDF to the transaction's receipt_pdf field
    filename = f"receipt_{transaction.paystack_reference}.pdf"
    transaction.receipt_pdf.save(filename, ContentFile(pdf_file), save=True)
    
    return transaction