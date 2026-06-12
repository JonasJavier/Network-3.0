from django import forms
from django.core.validators import URLValidator
from .models import Post, User, Comment


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']

    def clean_content(self):
        content = self.cleaned_data.get('content')
        if not content.strip():
            raise forms.ValidationError("You need to write something to create a post.")
        return content
class EditPostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ['content', 'image']

class ProfileBackgroundForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['background_image']

    def clean_background_image(self):
        background_image = self.cleaned_data.get('background_image')
        if background_image and not background_image.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
            raise forms.ValidationError('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF).')
        return background_image

class ProfileImageForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['profile_image']

    def clean_profile_image(self):
        profile_image = self.cleaned_data.get('profile_image')
        if profile_image and not profile_image.name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
            raise forms.ValidationError('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF).')
        return profile_image

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['email', 'mobile', 'address', 'birth_date', 'birth_year', 'gender', 'interests', 'languages']
        widgets = {'birth_date': forms.DateInput(attrs={'type': 'date'})}

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.TextInput(attrs={
                'class': 'form-control rounded',
                'placeholder': 'Enter Your Comment'
            })
        }

