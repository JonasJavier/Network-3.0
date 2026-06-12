from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    followers = models.ManyToManyField('self', symmetrical=False, related_name='following')
    background_image = models.ImageField(upload_to='user_backgrounds/', blank=True, null=True)
    profile_image = models.ImageField(upload_to='user_profiles/', blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    mobile = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    birth_year = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    interests = models.CharField(max_length=255, blank=True, null=True)
    languages = models.CharField(max_length=255, blank=True, null=True)

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    dislikes = models.ManyToManyField(User, related_name='disliked_posts', blank=True)

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_relationships')
    followed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_relationships')

    def __str__(self):
        return f"{self.follower} is following {self.followed_user}"

class Comment(models.Model):
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_comments', blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author.username} on {self.post}'

class Reply(models.Model):
    parent_comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='replies')
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f'Reply by {self.author.username} on {self.parent_comment}'
