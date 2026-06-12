from django.conf import settings
from rest_framework import serializers


def validate_upload_size(file):
    """Reject uploads larger than MAX_UPLOAD_SIZE (default 5 MB)."""
    max_size = settings.MAX_UPLOAD_SIZE
    if file and file.size > max_size:
        raise serializers.ValidationError(
            f"File too large. Maximum size is {max_size // (1024 * 1024)} MB."
        )
    return file
