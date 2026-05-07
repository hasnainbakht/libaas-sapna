from django.apps import AppConfig


class RecommendationsConfig(AppConfig):
    """
    Configuration class for the recommendations app.
    """
    default_auto_field = "django.db.models.BigAutoField"
    name = "recommendations"
    verbose_name = "Product Recommendations"

    def ready(self):
        """
        Hook for application startup. Import signals if needed.
        """
        pass
