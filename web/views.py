from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from allauth.account.views import LoginView
from .forms import CustomLoginForm
from .es import es_client
from .utils import *

@login_required
def index(request):
    print(es_client.info())
    resp = es_client.get(index="customer", id=1)
    print(resp['_source'])
    # s3_client.download_file('cast.me', 'signature.png', 'signature.png')
    return render(request, 'index.html', {'data':resp})


class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'account/login.html'

custom_login_view = CustomLoginView.as_view()