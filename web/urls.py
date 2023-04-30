from django.urls import path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    # path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('', views.index, name='index'),
    path('search', views.search, name='search'),
    path('posts', views.posts, name='posts'),
    path('newpost', views.newpost, name='new-post'),
    path('post', views.newpost, name='new-post'),
    path('post/<str:postid>', views.post_view, name='post-view'),
    path('profile', views.profile, name='profile'),
    path('profile/', views.profile, name='profile_slash'),
    path('profile/<str:userid>', views.profile, name='profile_id'),
    path('inbox', views.inbox, name='inbox'),
    path('upload_image/', views.upload_image, name='upload-image'),
    path('upload_post/', views.upload_post, name='upload-post'),
    path('settings/', views.settings_page, name='settings'),
    path('profile-settings/', views.profile_settings, name='profile-settings'),
    path('img/<str:type>/<str:profile_id>/<str:key>', views.signed_img, name='profile-settings'),
]