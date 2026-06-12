from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Follow, User


@admin.register(User)
class NetworkUserAdmin(UserAdmin):
    list_display = ["username", "email", "headline", "is_staff", "date_joined"]
    search_fields = ["username", "email", "first_name", "last_name"]
    fieldsets = UserAdmin.fieldsets + (
        ("Profile", {"fields": ("headline", "bio", "location", "website", "avatar", "cover")}),
    )


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "following", "created_at"]
    search_fields = ["follower__username", "following__username"]
    list_select_related = ["follower", "following"]
