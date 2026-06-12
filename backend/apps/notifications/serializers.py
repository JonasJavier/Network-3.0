from rest_framework import serializers

from apps.users.serializers import UserMiniSerializer

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserMiniSerializer(read_only=True)
    post_preview = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "actor", "verb", "post", "comment", "post_preview", "is_read", "created_at"]

    def get_post_preview(self, obj) -> str:
        if obj.post and obj.post.content:
            return obj.post.content[:80]
        return ""
