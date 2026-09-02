from django.contrib.auth import get_user_model
from django.db.models import Count
from finance.models import Transaction

User = get_user_model()

# Find phone numbers that appear more than once
duplicates = User.objects.values('phone_number').annotate(phone_count=Count('id')).filter(phone_count__gt=1)

print(f"Found {duplicates.count()} phone numbers with duplicate accounts.")

for dup in duplicates:
    phone = dup['phone_number']
    # Order by date joined so the oldest account becomes the primary
    users = list(User.objects.filter(phone_number=phone).order_by('date_joined'))
    
    primary_user = users[0]
    duplicate_users = users[1:]
    
    print(f"\nMerging records for {phone} into User ID {primary_user.id}")

    for dup_user in duplicate_users:
        # 1. Reassign all financial transactions to the primary user
        Transaction.objects.filter(user=dup_user).update(user=primary_user)
        
        # 2. Reassign other related models here if necessary (e.g., MemberProfile)
        # If the primary user doesn't have a profile but the duplicate does, reassign it
        if not hasattr(primary_user, 'profile') and hasattr(dup_user, 'profile'):
            profile = dup_user.profile
            profile.user = primary_user
            profile.save()
        
        # 3. Delete the redundant duplicate account
        print(f" -> Deleting duplicate User ID {dup_user.id}")
        dup_user.delete()
        
print("\nDatabase cleanup complete!")
