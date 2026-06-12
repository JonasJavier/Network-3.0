from rest_framework import serializers

from apps.core.validators import validate_upload_size
from apps.users.serializers import UserMiniSerializer

from .models import Comment, Post


class CommentSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    parent = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(), required=False, allow_null=True, write_only=True
    )
    replies = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "parent",
            "content",
            "created_at",
            "likes_count",
            "is_liked",
            "replies",
        ]
        read_only_fields = ["post", "created_at"]

    def validate_parent(self, parent):
        if parent and parent.parent_id is not None:
            raise serializers.ValidationError("Replies can only be one level deep.")
        return parent

    def validate_content(self, content):
        if not content.strip():
            raise serializers.ValidationError("Comment cannot be empty.")
        return content.strip()

    def get_replies(self, obj):
        if obj.parent_id is not None:
            return []
        return CommentSerializer(obj.replies.all(), many=True, context=self.context).data

    def get_likes_count(self, obj) -> int:
        annotated = getattr(obj, "likes_count", None)
        return annotated if annotated is not None else obj.likes.count()

    def get_is_liked(self, obj) -> bool:
        annotated = getattr(obj, "is_liked", None)
        if annotated is not None:
            return annotated
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(pk=request.user.pk).exists()


class PostSerializer(serializers.ModelSerializer):
    author = UserMiniSerializer(read_only=True)
    image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_upload_size]
    )
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_edited = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "content",
            "image",
            "created_at",
            "updated_at",
            "is_edited",
            "likes_count",
            "comments_count",
            "is_liked",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        content = (attrs.get("content") or "").strip()
        image = attrs.get("image", getattr(self.instance, "image", None))
        if not content and not image:
            raise serializers.ValidationError("A post needs text or an image.")
        attrs["content"] = content
        return attrs

    def get_likes_count(self, obj) -> int:
        annotated = getattr(obj, "likes_count", None)
        return annotated if annotated is not None else obj.likes.count()

    def get_comments_count(self, obj) -> int:
        annotated = getattr(obj, "comments_count", None)
        return annotated if annotated is not None else obj.comments.count()

    def get_is_liked(self, obj) -> bool:
        annotated = getattr(obj, "is_liked", None)
        if annotated is not None:
            return annotated
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(pk=request.user.pk).exists()

    def get_is_edited(self, obj) -> bool:
        return (obj.updated_at - obj.created_at).total_seconds() > 2
