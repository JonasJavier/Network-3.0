from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.core.validators import validate_upload_size

from .models import Follow, User


class UserMiniSerializer(serializers.ModelSerializer):
    """Compact user representation embedded in posts, comments, etc."""

    name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "name", "headline", "avatar"]


class UserCardSerializer(UserMiniSerializer):
    """User representation for people lists — includes follow state."""

    is_following = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta(UserMiniSerializer.Meta):
        fields = UserMiniSerializer.Meta.fields + ["is_following", "followers_count"]

    def get_is_following(self, obj) -> bool:
        annotated = getattr(obj, "is_following", None)
        if annotated is not None:
            return annotated
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Follow.objects.filter(follower=request.user, following=obj).exists()

    def get_followers_count(self, obj) -> int:
        annotated = getattr(obj, "followers_count", None)
        return annotated if annotated is not None else obj.follower_relations.count()


class UserDetailSerializer(UserCardSerializer):
    """Full profile representation."""

    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta(UserCardSerializer.Meta):
        fields = UserCardSerializer.Meta.fields + [
            "first_name",
            "last_name",
            "bio",
            "location",
            "website",
            "cover",
            "following_count",
            "posts_count",
            "date_joined",
        ]

    def get_following_count(self, obj) -> int:
        annotated = getattr(obj, "following_count", None)
        return annotated if annotated is not None else obj.following_relations.count()

    def get_posts_count(self, obj) -> int:
        annotated = getattr(obj, "posts_count", None)
        return annotated if annotated is not None else obj.posts.count()


class UserUpdateSerializer(serializers.ModelSerializer):
    """Fields a user may edit on their own profile."""

    avatar = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_upload_size]
    )
    cover = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_upload_size]
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "headline",
            "bio",
            "location",
            "website",
            "avatar",
            "cover",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, validators=[validate_password], style={"input_type": "password"}
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
