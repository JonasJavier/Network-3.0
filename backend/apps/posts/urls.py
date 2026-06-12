from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CommentViewSet, PostCommentsView, PostViewSet

router = DefaultRouter()
router.register("posts", PostViewSet, basename="posts")
router.register("comments", CommentViewSet, basename="comments")

urlpatterns = [
    path("posts/<int:post_id>/comments/", PostCommentsView.as_view(), name="post-comments"),
    path("", include(router.urls)),
]
