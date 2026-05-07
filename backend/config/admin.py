from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth.views import LoginView
from django.urls import path


class CustomAdminSite(AdminSite):
    site_header = "LIBAAS SAPNA Admin"
    site_title = "LIBAAS SAPNA Admin Portal"
    index_title = "Welcome to LIBAAS SAPNA Administration"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('login/', self.admin_view(LoginView.as_view(template_name='admin/login.html')), name='login'),
        ]
        return custom_urls + urls


# Create custom admin site instance
admin_site = CustomAdminSite(name='admin')
