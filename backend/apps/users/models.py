from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import F, Q


class User(AbstractUser):
    """A member of the network, with a professional profile."""

    email = models.EmailField("email address", unique=True)
    headline = models.CharField(max_length=120, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    cover = models.ImageField(upload_to="covers/", blank=True, null=True)

    def __str__(self):
        return self.username

    @property
    def name(self) -> str:
        return self.get_full_name() or self.username


class Follow(models.Model):
    """A directed follow relationship between two users."""

    follower = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="following_relations"
    )
    following = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="follower_relations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="unique_follow"),
            models.CheckConstraint(condition=~Q(follower=F("following")), name="no_self_follow"),
        ]
        indexes = [
            models.Index(fields=["follower", "-created_at"]),
            models.Index(fields=["following", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.follower} → {self.following}"
