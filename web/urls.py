from django.urls import path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    # path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('', views.index, name='index'),
    path('search', views.search, name='search'),
    # path('profile', views.profile, name='profile'),
    path('profile/<str:userid>', views.profile, name='profile'),
    path('inbox', views.inbox, name='inbox'),

    path('upload_image/', views.upload_image, name='upload-image'),
    path('settings/', views.settings_page, name='settings'),
    path('profile-settings/', views.profile_settings, name='profile-settings'),
]