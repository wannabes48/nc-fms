from io import BytesIO
from django.template.loader import get_template
from django.core.files.base import ContentFile
from xhtml2pdf import pisa

def generate_and_save_receipt(transaction):
    template = get_template('receipts/receipt_template.html')
    
    member_name = f"{transaction.user.profile.first_name} {transaction.user.profile.last_name}".strip() if hasattr(transaction.user, 'profile') else "Guest"
    
    context = {
        'transaction': transaction,
        'member_name': member_name,
        'allocations': transaction.allocations.all()
    }
    html = template.render(context)
    
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    
    if not pdf.err:
        filename = f"Receipt_{transaction.paystack_reference}.pdf"
        transaction.receipt_file.save(filename, ContentFile(result.getvalue()))
        transaction.save()
        return True
    return False