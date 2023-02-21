from allauth.account.forms import LoginForm
from django import forms

class CustomLoginForm(LoginForm):
    remember_me = forms.BooleanField(
        label='Remember me', required=False
    )