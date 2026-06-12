from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.posts.models import Comment, Post

from .models import Notification

User = get_user_model()


def make_user(username):
    return User.objects.create_user(
        username=username, email=f"{username}@test.dev", password="S3cure-pass!"
    )


class NotificationTests(APITestCase):
    def setUp(self):
        self.user = make_user("neo")
        self.other = make_user("trinity")
        self.client.force_authenticate(self.user)

    def test_follow_creates_notification(self):
        self.client.post("/api/v1/users/trinity/follow/")
        notification = Notification.objects.get(recipient=self.other)
        self.assertEqual(notification.actor, self.user)
        self.assertEqual(notification.verb, Notification.Verb.FOLLOW)

    def test_like_creates_notification_for_author_only(self):
        post = Post.objects.create(author=self.other, content="post")
        self.client.post(f"/api/v1/posts/{post.id}/like/")
        self.assertEqual(Notification.objects.filter(recipient=self.other).count(), 1)

        own_post = Post.objects.create(author=self.user, content="mine")
        self.client.post(f"/api/v1/posts/{own_post.id}/like/")
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 0)

    def test_comment_notifies_post_author(self):
        post = Post.objects.create(author=self.other, content="post")
        self.client.post(f"/api/v1/posts/{post.id}/comments/", {"content": "hey"})
        notification = Notification.objects.get(recipient=self.other)
        self.assertEqual(notification.verb, Notification.Verb.COMMENT)

    def test_reply_notifies_parent_author(self):
        post = Post.objects.create(author=self.user, content="post")
        parent = Comment.objects.create(post=post, author=self.other, content="parent")
        self.client.post(
            f"/api/v1/posts/{post.id}/comments/", {"content": "reply", "parent": parent.id}
        )
        notification = Notification.objects.get(recipient=self.other)
        self.assertEqual(notification.verb, Notification.Verb.REPLY)

    def test_unread_count_and_mark_all_read(self):
        Notification.objects.create(
            recipient=self.user, actor=self.other, verb=Notification.Verb.FOLLOW
        )
        response = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(response.data["count"], 1)

        self.client.post("/api/v1/notifications/read-all/")
        response = self.client.get("/api/v1/notifications/unread-count/")
        self.assertEqual(response.data["count"], 0)

    def test_notifications_list_is_private(self):
        Notification.objects.create(
            recipient=self.other, actor=self.user, verb=Notification.Verb.FOLLOW
        )
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(len(response.data["results"]), 0)
