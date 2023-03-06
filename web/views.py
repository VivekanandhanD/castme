from functools import wraps
import io
import json
from django.http import JsonResponse
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.decorators import user_passes_test
from allauth.account.views import LoginView
from elasticsearch import NotFoundError
from .forms import CustomLoginForm
from .es import es_client
from .utils import *
from .models import *


def onboarded(user):
    try:
        resp = es_client.get(index="user", id=user.id)
        if not resp['_source']['onboarded']:
            return False
    except:
        return False
    return True


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def index(request):
    print(es_client.info())
    resp = es_client.get(index="user", id=request.user.id)
    print(resp['_source'])
    # s3_client.download_file('cast.me', 'signature.png', 'signature.png')
    return render(request, 'index.html', {'data':resp['_source']})


@login_required
def search(request):
    return render(request, 'search.html')


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def profile(request, userid=None):
    # try:
    #     resp = es_client.get(index="user", id=request.user.id)
    #     if not resp['_source']['onboarded']:
    #         return redirect('web:profile-settings')
    # except NotFoundError:
    #     return redirect('web:profile-settings')
    context = {}
    if not userid:
        userid = str(request.user.id)
    current_userid = str(request.user.id)
    key = 'users/' + userid + '/dp/dp.jpg'
    context['dp_url'] = get_signed_url(key)
    key = 'users/' + userid + '/dp/cp.jpg'
    context['cp_url'] = get_signed_url(key)
    if userid == current_userid:
        context['edit'] = 1
    else:
        context['edit'] = 0
    context['profileuser'] = Users.objects.get(pk=userid)
    return render(request, 'profile.html', context=context)


@login_required
def inbox(request):
    return render(request, 'inbox.html')


@login_required
def upload_image(request):
    if request.method == 'POST' and request.FILES['image']:
        image = request.FILES['image']
        mode = request.POST['mode']
        user_id = str(request.user.id)
        if mode == 'dp':
            filename = 'users/' + user_id + '/dp/dp.jpg'
        elif mode == 'cp':
            filename = 'users/' + user_id + '/dp/cp.jpg'
        s3_client.upload_fileobj(image, settings.AWS_STORAGE_BUCKET_NAME, filename)
        image_url = get_signed_url(filename)
        return JsonResponse({'image_url': image_url})
    return JsonResponse({'error': 'Invalid request'})


@login_required
def settings_page(request):
    return render(request, 'settings.html')


@login_required
def profile_settings(request):
    cxt = {}
    cxt['skills'] = cine_skills + music_skills
    # cxt['tamil_nadu_cities'] = tamil_nadu_cities
    cxt['cities'] = all_cities
    if request.method == 'POST':
        data = json.loads(request.body)
        user = Users.objects.get(pk=request.user.id)
        user.firstname = data.get('firstname')
        user.lastname = data.get('lastname')
        user.save()
        update_body = {
            "doc": {
                "firstname": data.get('firstname'),
                "lastname": data.get('lastname'),
                "location": data.get('location'),
                "skills": data.get('skills'),
                "onboarded": True
            }
        }
        try:
            es_client.update(index="user", id=request.user.id, body=update_body)
        except NotFoundError:
            es_client.index(index="user", id=request.user.id, body=update_body['doc'])
        except Exception as e:
            print(e)
    try:
        resp = es_client.get(index="user", id=request.user.id)
        cxt['location'] = resp['_source']['location']
        cxt['userskills'] = resp['_source']['skills']
    except Exception as e:
        cxt['location'] = ''
        cxt['userskills'] = []
    return render(request, 'profile-settings.html', context=cxt)


class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'account/login.html'

custom_login_view = CustomLoginView.as_view()