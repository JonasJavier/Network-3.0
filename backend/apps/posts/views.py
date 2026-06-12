from django.db.models import Count, Exists, OuterRef, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.pagination import StandardPagination, TimelineCursorPagination
from apps.core.permissions import IsAuthorOrReadOnly
from apps.notifications.models import Notification

from .models import Comment, Post, PostLike
from .serializers import CommentSerializer, PostSerializer


def annotated_comments(user):
    """Comment queryset with author, like counts, and like state attached."""
    return (
        Comment.objects.select_related("author")
        .annotate(
            likes_count=Count("likes", distinct=True),
            is_liked=Exists(
                Comment.likes.through.objects.filter(
                    comment=OuterRef("pk"), user=user
                )
            ),
        )
    )


class PostViewSet(viewsets.ModelViewSet):
    """Timeline feed plus full CRUD on posts and like toggling.

    List filters:
      - ?feed=following  → only people the requester follows
      - ?author=<username>
      - ?search=<text>
    """

    serializer_class = PostSerializer
    pagination_class = TimelineCursorPagination
    http_method_names = ["get", "post", "patch", "delete", "options"]

    def get_permissions(self):
        if self.action in {"update", "partial_update", "destroy"}:
            return [IsAuthenticated(), IsAuthorOrReadOnly()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Post.objects.select_related("author")
            .annotate(
                likes_count=Count("likes", distinct=True),
                comments_count=Count("comments", distinct=True),
                is_liked=Exists(
                    PostLike.objects.filter(post=OuterRef("pk"), user=user)
                ),
            )
        )

        params = self.request.query_params
        if params.get("feed") == "following":
            queryset = queryset.filter(
                author__follower_relations__follower=user
            )
        if author := params.get("author"):
            queryset = queryset.filter(author__username=author)
        if search := params.get("search"):
            queryset = queryset.filter(content__icontains=search)
        if params.get("liked") == "1":
            queryset = queryset.filter(likes=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        if created:
            if post.author_id != request.user.id:
                Notification.objects.get_or_create(
                    recipient=post.author,
                    actor=request.user,
                    verb=Notification.Verb.LIKE_POST,
                    post=post,
                )
            liked = True
        else:
            like.delete()
            liked = False
        return Response(
            {"is_liked": liked, "likes_count": post.likes.count()},
            status=status.HTTP_200_OK,
        )


class PostCommentsView(generics.ListCreateAPIView):
    """List top-level comments (replies nested) or add a comment to a post."""

    serializer_class = CommentSerializer
    pagination_class = StandardPagination

    def get_post(self):
        return get_object_or_404(Post, pk=self.kwargs["post_id"])

    def get_queryset(self):
        replies = Prefetch(
            "replies", queryset=annotated_comments(self.request.user)
        )
        return (
            annotated_comments(self.request.user)
            .filter(post_id=self.kwargs["post_id"], parent__isnull=True)
            .prefetch_related(replies)
            .order_by("created_at")
        )

    def perform_create(self, serializer):
        post = self.get_post()
        comment = serializer.save(author=self.request.user, post=post)

        if comment.parent and comment.parent.author_id != self.request.user.id:
            Notification.objects.get_or_create(
                recipient=comment.parent.author,
                actor=self.request.user,
                verb=Notification.Verb.REPLY,
                post=post,
                comment=comment.parent,
            )
        elif not comment.parent and post.author_id != self.request.user.id:
            Notification.objects.get_or_create(
                recipient=post.author,
                actor=self.request.user,
                verb=Notification.Verb.COMMENT,
                post=post,
            )


class CommentViewSet(viewsets.GenericViewSet):
    """Delete your own comments; like/unlike any comment."""

    serializer_class = CommentSerializer

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsAuthorOrReadOnly()]
        return super().get_permissions()

    def get_queryset(self):
        return annotated_comments(self.request.user)

    def destroy(self, request, pk=None):
        comment = self.get_object()
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        comment = self.get_object()
        if comment.likes.filter(pk=request.user.pk).exists():
            comment.likes.remove(request.user)
            liked = False
        else:
            comment.likes.add(request.user)
            liked = True
            if comment.author_id != request.user.id:
                Notification.objects.get_or_create(
                    recipient=comment.author,
                    actor=request.user,
                    verb=Notification.Verb.LIKE_COMMENT,
                    post=comment.post,
                    comment=comment,
                )
        return Response({"is_liked": liked, "likes_count": comment.likes.count()})
