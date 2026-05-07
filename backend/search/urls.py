from django.urls import path
from .views import TextSearchView, VoiceSearchView, RomanUrduSearchView

urlpatterns = [
    path('text', TextSearchView.as_view(), name='text_search'),
    path('voice', VoiceSearchView.as_view(), name='voice_search'),
    path('ai', RomanUrduSearchView.as_view(), name='ai_roman_urdu_search'),
]

