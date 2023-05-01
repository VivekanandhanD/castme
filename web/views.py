import json
from django.http import JsonResponse
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.decorators import user_passes_test
from django.urls import reverse
from django.utils import timezone
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
    # print(es_client.info())
    resp = es_client.get(index="user", id=request.user.id)
    print(resp['_source'])
    # s3_client.download_file('cast.me', 'signature.png', 'signature.png')
    return render(request, 'index.html', {'data':resp['_source']})


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def search(request):
    return render(request, 'search.html')


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def newpost(request):
    return render(request, 'new-post.html')


def post_view(request, postid):
    ctx = get_post_details(postid)
    return render(request, 'post.html', context=ctx)


def posts(request):
    ctx = []
    q = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                            "userid.keyword": "39c9474d-bc9f-42c5-9649-9edde5bba8ab"
                            }
                        },
                        {
                            "match": {
                            "ad": False
                            }
                        },
                        {
                            "match": {
                            "job": False
                            }
                        }
                    ]
                }
            },
            "size": 10,
            "sort": [
                {
                    "time": {
                        "order": "desc"
                    }
                }
            ]
        }
    try:
        resp = es_client.search(index="posts", body=q)
        resp = resp['hits']['hits']
        print(resp)
    except Exception as e:
        print(e)
        resp = []
    return JsonResponse({'list': resp})


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def profile(request, userid=None):
    if not userid:
        userid = str(request.user.id)
        return redirect(reverse('profile') + '/' + userid)
    ctx = {}
    current_userid = str(request.user.id)
    key = 'users/' + userid + '/dp/dp.jpg'
    ctx['dp_url'] = get_signed_url(key)
    key = 'users/' + userid + '/dp/cp.jpg'
    ctx['cp_url'] = get_signed_url(key)
    if userid == current_userid:
        ctx['edit'] = 1
    else:
        ctx['edit'] = 0
    ctx['profileuser'] = Users.objects.get(pk=userid)
    resp = es_client.get(index="user", id=request.user.id)
    ctx['location'] = resp['_source']['location']
    ctx['userskills'] = resp['_source']['skills']
    q = ['follow-count', 'following-count', 'post-count']
    resp = es_client.get(index="user-activity", id=request.user.id, _source_includes=q)
    ctx['followcount'] = resp['_source']['follow-count']
    ctx['followingcount'] = resp['_source']['following-count']
    ctx['postcount'] = resp['_source']['post-count']
    return render(request, 'profile.html', context=ctx)


@login_required
@user_passes_test(onboarded, login_url='profile-settings')
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
@user_passes_test(onboarded, login_url='profile-settings')
def upload_post(request):
    if request.method == 'POST':
        postid = str(uuid.uuid4())
        user_id = str(request.user.id)
        content = {}
        image = None
        try:
            image = request.FILES['image']
            if image:
                filename = 'posts/' + user_id + '/' + postid + '.jpg'
                s3_client.upload_fileobj(image, settings.AWS_STORAGE_BUCKET_NAME, filename)
                # image_url = get_signed_url(filename)
            # content['content'] = request.POST['content']
            # content['img'] = image_url if image else ''
        except:
            pass
        content = {
            'doc': {
                'userid': user_id,
                'content': request.POST['content'],
                'yt-id': request.POST['yt-id'],
                'img': filename if image else '',
                'time': timezone.now(),
                'ad': request.POST.get('ad_bool', False),
                'job': request.POST.get('job_bool', False),
                'likes': [],
                'comments': []
            }
        }
        es_client.index(index="posts", id=postid, body=content['doc'])
        try:
            increase_post_count(user_id, postid)
        except Exception as e:
            print(e)
        return JsonResponse({'msg': 'success', 'id': postid})
    return JsonResponse({'error': 'Invalid request'})


@login_required
def settings_page(request):
    return render(request, 'settings.html')


def create_account_details(userid):
    data = {
        "follow-count": 0,
        "following-count": 0,
        "post-count": 0,
        "followers": [],
        "following": [],
        "posts": [],
        "blacklist": []
    }
    es_client.index(index="user-activity", id=userid, body=data)


def increase_post_count(userid, postid):
    update_query = {
        "script": {
            "source": "ctx._source['post-count'] += params.count_increment; ctx._source.posts.add(params.new_string_value);",
            "params": {
                "count_increment": 1,
                "new_string_value": postid
            },
            "lang": "painless"
        }
    }
    es_client.update(index='user-activity', id=userid, body=update_query)
    # update_query = {
    #     "script": {
    #         "source": "ctx._source.post-count += params.value",
    #         "params": {
    #             "value": 1
    #         }
    #     }
    # }
    # es_client.update(index="user-activity", id=userid, body=update_query)
    # update_body = {
    #     'script': {
    #         'source': 'ctx._source.posts.add(params.my_value)',
    #         'lang': 'painless',
    #         'params': {
    #             'my_value': postid
    #         }
    #     }
    # }
    # es_client.update(index="user-activity", id=userid, body=update_body)


@login_required
def profile_settings(request):
    ctx = {}
    ctx['skills'] = cine_skills + music_skills
    # ctx['tamil_nadu_cities'] = tamil_nadu_cities
    ctx['cities'] = all_cities
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
                "onboarded": True,
                "accounttype": data.get('accounttype'),
            }
        }
        try:
            es_client.update(index="user", id=request.user.id, body=update_body)
        except NotFoundError:
            es_client.index(index="user", id=request.user.id, body=update_body['doc'])
            create_account_details(request.user.id)
        except Exception as e:
            print(e)
    try:
        resp = es_client.get(index="user", id=request.user.id)
        ctx['location'] = resp['_source']['location']
        ctx['userskills'] = resp['_source']['skills']
        ctx['accounttype'] = resp['_source']['accounttype']
        # ctx['userservices'] = resp['_source']['userservices']
    except Exception as e:
        ctx['location'] = ''
        ctx['userskills'] = []
        ctx['accounttype'] = 'Individual'
        # ctx['userservices'] = []
    return render(request, 'profile-settings.html', context=ctx)


def signed_img(request, type, profile_id, key):
    return redirect(get_signed_url(type + '/' + profile_id + '/' + key))


class CustomLoginView(LoginView):
    form_class = CustomLoginForm
    template_name = 'account/login.html'

custom_login_view = CustomLoginView.as_view()