from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Count, Exists, OuterRef
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notifications.models import Notification

from .models import Follow
from .serializers import (
    RegisterSerializer,
    UserCardSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
)

User = get_user_model()

SUGGESTIONS_CACHE_TTL = 60 * 5


def suggestions_cache_key(user_id: int) -> str:
    return f"user-suggestions:{user_id}"


def annotate_profile(queryset, user):
    """Attach counts and follow state used by the profile serializers."""
    return queryset.annotate(
        followers_count=Count("follower_relations", distinct=True),
        following_count=Count("following_relations", distinct=True),
        posts_count=Count("posts", distinct=True),
        is_following=Exists(
            Follow.objects.filter(follower=user, following=OuterRef("pk"))
        ),
    )


class RegisterView(generics.CreateAPIView):
    """Create an account and return JWT tokens so the client is logged in."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserDetailSerializer(user, context={"request": request}).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieve or update the authenticated user's profile."""

    http_method_names = ["get", "patch", "options"]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return UserUpdateSerializer
        return UserDetailSerializer

    def partial_update(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserDetailSerializer(request.user, context={"request": request}).data)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Browse profiles, search people, follow/unfollow, and list relations."""

    lookup_field = "username"
    lookup_value_regex = r"[\w.@+-]+"
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "first_name", "last_name", "headline"]

    def get_queryset(self):
        return annotate_profile(
            User.objects.filter(is_active=True), self.request.user
        ).order_by("username")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return UserDetailSerializer
        return UserCardSerializer

    @action(detail=True, methods=["post", "delete"])
    def follow(self, request, username=None):
        target = self.get_object()
        if target == request.user:
            return Response(
                {"detail": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST
            )

        if request.method == "POST":
            _, created = Follow.objects.get_or_create(follower=request.user, following=target)
            if created:
                Notification.objects.get_or_create(
                    recipient=target,
                    actor=request.user,
                    verb=Notification.Verb.FOLLOW,
                )
            following = True
        else:
            Follow.objects.filter(follower=request.user, following=target).delete()
            following = False

        cache.delete(suggestions_cache_key(request.user.id))
        followers_count = target.follower_relations.count()
        return Response({"is_following": following, "followers_count": followers_count})

    @action(detail=True, methods=["get"])
    def followers(self, request, username=None):
        target = self.get_object()
        queryset = annotate_profile(
            User.objects.filter(following_relations__following=target),
            request.user,
        ).order_by("-following_relations__created_at")
        return self._paginated_cards(queryset)

    @action(detail=True, methods=["get"])
    def following(self, request, username=None):
        target = self.get_object()
        queryset = annotate_profile(
            User.objects.filter(follower_relations__follower=target),
            request.user,
        ).order_by("-follower_relations__created_at")
        return self._paginated_cards(queryset)

    @action(detail=False, methods=["get"])
    def suggestions(self, request):
        """People to follow: most-followed members you don't follow yet."""
        cache_key = suggestions_cache_key(request.user.id)
        data = cache.get(cache_key)
        if data is None:
            followed = Follow.objects.filter(follower=request.user).values("following_id")
            queryset = (
                annotate_profile(User.objects.filter(is_active=True), request.user)
                .exclude(pk=request.user.pk)
                .exclude(pk__in=followed)
                .order_by("-followers_count", "username")[:5]
            )
            data = UserCardSerializer(queryset, many=True, context={"request": request}).data
            cache.set(cache_key, data, SUGGESTIONS_CACHE_TTL)
        return Response(data)

    def _paginated_cards(self, queryset):
        page = self.paginate_queryset(queryset)
        serializer = UserCardSerializer(page, many=True, context={"request": self.request})
        return self.get_paginated_response(serializer.data)
