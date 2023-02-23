from elasticsearch import Elasticsearch
from django.conf import settings


# Create the client instance
es_client = Elasticsearch(
    settings.ELASTIC_HOST,
    basic_auth=("elastic", settings.ELASTIC_PASSWORD), verify_certs=False
)

# Successful response!
es_client.info()