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


@login_required
def search(request):
    return render(request, 'search.html')


@login_required
def profile(request):
    context = {}
    user_id = str(request.user.id)
    key = 'users/' + user_id + '/dp/dp.jpg'
    context['dp_url'] = get_signed_url(key)
    key = 'users/' + user_id + '/dp/cp.jpg'
    context['cp_url'] = get_signed_url(key)
    return render(request, 'profile.html', context=context)


@login_required
def inbox(request):
    return render(request, 'inbox.html')


class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'account/login.html'

custom_login_view = CustomLoginView.as_view()