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
                            "userid.keyword": request.GET['profileId']
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
                        },
                        {
                            "match": {
                            "pinned": True
                            }
                        }
                    ]
                }
            },
            "size": 6,
            # "sort": [
            #     {
            #         "time": {
            #             "order": "desc"
            #         }
            #     }
            # ]
        }
    q2 = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "match": {
                            "userid.keyword": request.GET['profileId']
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
                        },
                        {
                            "match": {
                            "pinned": False
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
        resp2 = es_client.search(index="posts", body=q2)
        resp += resp2['hits']['hits']
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
    ctx['p_dp_url'] = get_signed_url(key)
    key = 'users/' + userid + '/dp/cp.jpg'
    ctx['p_cp_url'] = get_signed_url(key)
    if userid == current_userid:
        ctx['edit'] = 1
    else:
        ctx['edit'] = 0
    ctx['profileuser'] = Users.objects.get(pk=userid)
    resp = es_client.get(index="user", id=userid)
    ctx['location'] = resp['_source']['location']
    ctx['userskills'] = resp['_source']['skills']
    q = ['follow-count', 'following-count', 'post-count']
    resp = es_client.get(index="user-activity", id=userid, _source_includes=q)
    ctx['followcount'] = resp['_source']['follow-count']
    ctx['followingcount'] = resp['_source']['following-count']
    ctx['postcount'] = resp['_source']['post-count']
    ctx['following'] = check_following(current_userid, userid)
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
                'comments': [],
                'pinned': False
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
@user_passes_test(onboarded, login_url='profile-settings')
def pinpost(request):
    if request.method == 'POST':
        postid = request.POST['postId']
        update_query = {
            "script": {
                "source": """
                    def pinned = ctx._source.pinned_posts;
                    def index = -1;
                    if (!pinned.contains(params.post_id)) {
                        if(pinned.size() == 6){
                            pinned.remove(0);
                            ctx._source.pinned_posts.remove(0);
                        }
                        pinned.add(params.post_id);
                        ctx._source.pinned_posts = pinned;
                    } else{
                        for (int i = 0; i < pinned.size(); i++) {
                            if (pinned[i] == params.post_id) {
                                index = i;
                                break;
                            }
                        }
                        ctx._source.pinned_posts.remove(index);
                    }
                """,
                "params": {
                    "post_id": postid
                },
                "lang": "painless"
            }
        }
        res = es_client.update(index='user-activity', id=request.user.id, body=update_query)
        update_query = {
            "script": {
                "source": """
                    ctx._source.pinned = !ctx._source.pinned;
                """,
                "params": {
                    "post_id": postid
                },
                "lang": "painless"
            }
        }
        es_client.update(index='posts', id=postid, body=update_query)
        return JsonResponse({'msg': 'success', 'id': postid})
    return JsonResponse({'error': 'Invalid request'})

@login_required
@user_passes_test(onboarded, login_url='profile-settings')
def follow_user(request):
    try:
        if request.method == 'POST':
            userid = str(request.user.id)
            profile_id = request.POST['profileId']
            if userid == profile_id:
                return JsonResponse({'error': 'Internal Server Error'})
            update_query = {
                "script": {
                    # "source": "ctx._source.following.add(params.profile_id);",
                    "source": """
                        if (!ctx._source.following.contains(params.profile_id)) {
                            ctx._source.following.add(params.profile_id);
                            ctx._source['following-count'] += params.count_increment;
                        } else {
                            def string_to_find = params.profile_id;
                            def index = -1;
                            def list_field = ctx._source.following;
                            for (int i = 0; i < list_field.size(); i++) {
                                if (list_field[i] == string_to_find) {
                                    index = i;
                                    break;
                                }
                            }
                            ctx._source.following.remove(index);
                            ctx._source['following-count'] -= params.count_increment;
                        }
                    """,
                    "params": {
                        "count_increment": 1,
                        "profile_id": profile_id
                    },
                    "lang": "painless"
                }
            }
            es_client.update(index='user-activity', id=userid, body=update_query)
            update_query = {
                "script": {
                    # "source": "ctx._source.followers.add(params.profile_id);",
                    "source": """
                        if (!ctx._source.followers.contains(params.profile_id)) {
                            ctx._source.followers.add(params.profile_id);
                            ctx._source['follow-count'] += params.count_increment;
                        } else {
                            def string_to_find = params.profile_id;
                            def index = -1;
                            def list_field = ctx._source.followers;
                            for (int i = 0; i < list_field.size(); i++) {
                                if (list_field[i] == string_to_find) {
                                    index = i;
                                    break;
                                }
                            }
                            ctx._source.followers.remove(index);
                            ctx._source['follow-count'] -= params.count_increment;
                        }
                    """,
                    "params": {
                        "count_increment": 1,
                        "profile_id": userid
                    },
                    "lang": "painless"
                }
            }
            es_client.update(index='user-activity', id=profile_id, body=update_query)
    except Exception as e:
        print(e)
        return JsonResponse({'error': 'Internal Server Error'})
    return JsonResponse({'msg': 'Success'})


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
        "blacklist": [],
        "pinned_posts": []
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