import boto3
from django.conf import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY,
    aws_secret_access_key=settings.AWS_SECRET_KEY,
    region_name=settings.S3_REGION
)

def get_signed_url(object_key):
    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={
            'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
            'Key': object_key,
        },
        ExpiresIn=3600,  # URL expires in 1 hour
    )

    return url
    

def dp_url(request):
    context = {}
    user_id = str(request.user.id)
    key = 'users/' + user_id + '/dp/dp.jpg'
    context['dp_url'] = get_signed_url(key)
    key = 'users/' + user_id + '/dp/cp.jpg'
    context['cp_url'] = get_signed_url(key)
    return context