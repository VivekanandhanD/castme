from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from allauth.account.views import LoginView
from .forms import CustomLoginForm

@login_required
def index(request):
    return render(request, 'index.html')


class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'account/login.html'

custom_login_view = CustomLoginView.as_view()