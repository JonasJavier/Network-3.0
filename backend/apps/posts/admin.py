from django.contrib import admin

from .models import Comment, Post, PostLike


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["id", "author", "short_content", "created_at"]
    search_fields = ["content", "author__username"]
    list_select_related = ["author"]
    date_hierarchy = "created_at"

    @admin.display(description="content")
    def short_content(self, obj):
        return obj.content[:60]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["id", "author", "post", "parent", "created_at"]
    search_fields = ["content", "author__username"]
    list_select_related = ["author", "post", "parent"]


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ["user", "post", "created_at"]
    list_select_related = ["user", "post"]
