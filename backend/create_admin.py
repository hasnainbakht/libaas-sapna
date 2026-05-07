import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

# Create superuser if it doesn't exist
email = 'admin@libaassapna.com'
password = 'admin123'

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        password=password,
        name='Admin User'
    )
    print(f'Superuser created successfully!')
    print(f'Email: {email}')
    print(f'Password: {password}')
else:
    print('Superuser already exists!')
    print(f'Email: {email}')


