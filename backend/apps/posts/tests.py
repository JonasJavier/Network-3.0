from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Follow

from .models import Comment, Post

User = get_user_model()


def make_user(username):
    return User.objects.create_user(
        username=username, email=f"{username}@test.dev", password="S3cure-pass!"
    )


class PostTests(APITestCase):
    def setUp(self):
        self.user = make_user("neo")
        self.other = make_user("trinity")
        self.client.force_authenticate(self.user)

    def test_create_post(self):
        response = self.client.post("/api/v1/posts/", {"content": "Hello network!"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["author"]["username"], "neo")
        self.assertEqual(response.data["likes_count"], 0)
        self.assertFalse(response.data["is_liked"])

    def test_empty_post_rejected(self):
        response = self.client.post("/api/v1/posts/", {"content": "   "})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_feed_returns_all_posts(self):
        Post.objects.create(author=self.user, content="mine")
        Post.objects.create(author=self.other, content="theirs")
        response = self.client.get("/api/v1/posts/")
        self.assertEqual(len(response.data["results"]), 2)

    def test_following_feed_filters(self):
        Post.objects.create(author=self.user, content="mine")
        Post.objects.create(author=self.other, content="theirs")
        response = self.client.get("/api/v1/posts/", {"feed": "following"})
        self.assertEqual(len(response.data["results"]), 0)

        Follow.objects.create(follower=self.user, following=self.other)
        response = self.client.get("/api/v1/posts/", {"feed": "following"})
        contents = [p["content"] for p in response.data["results"]]
        self.assertEqual(contents, ["theirs"])

    def test_author_filter(self):
        Post.objects.create(author=self.user, content="mine")
        Post.objects.create(author=self.other, content="theirs")
        response = self.client.get("/api/v1/posts/", {"author": "trinity"})
        contents = [p["content"] for p in response.data["results"]]
        self.assertEqual(contents, ["theirs"])

    def test_only_author_can_edit(self):
        post = Post.objects.create(author=self.other, content="original")
        response = self.client.patch(f"/api/v1/posts/{post.id}/", {"content": "hacked"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_author_can_edit_and_delete(self):
        post = Post.objects.create(author=self.user, content="original")
        response = self.client.patch(f"/api/v1/posts/{post.id}/", {"content": "edited"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["content"], "edited")

        response = self.client.delete(f"/api/v1/posts/{post.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=post.id).exists())

    def test_like_toggles(self):
        post = Post.objects.create(author=self.other, content="like me")
        response = self.client.post(f"/api/v1/posts/{post.id}/like/")
        self.assertTrue(response.data["is_liked"])
        self.assertEqual(response.data["likes_count"], 1)

        response = self.client.post(f"/api/v1/posts/{post.id}/like/")
        self.assertFalse(response.data["is_liked"])
        self.assertEqual(response.data["likes_count"], 0)


class CommentTests(APITestCase):
    def setUp(self):
        self.user = make_user("neo")
        self.other = make_user("trinity")
        self.post = Post.objects.create(author=self.other, content="post")
        self.client.force_authenticate(self.user)

    def test_add_and_list_comments(self):
        response = self.client.post(
            f"/api/v1/posts/{self.post.id}/comments/", {"content": "Nice!"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(f"/api/v1/posts/{self.post.id}/comments/")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["content"], "Nice!")

    def test_replies_nest_under_parent(self):
        parent = Comment.objects.create(post=self.post, author=self.other, content="parent")
        response = self.client.post(
            f"/api/v1/posts/{self.post.id}/comments/",
            {"content": "reply", "parent": parent.id},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        listing = self.client.get(f"/api/v1/posts/{self.post.id}/comments/")
        self.assertEqual(listing.data["count"], 1)  # only top-level paginated
        self.assertEqual(listing.data["results"][0]["replies"][0]["content"], "reply")

    def test_reply_depth_limited_to_one(self):
        parent = Comment.objects.create(post=self.post, author=self.other, content="parent")
        reply = Comment.objects.create(
            post=self.post, author=self.other, content="reply", parent=parent
        )
        response = self.client.post(
            f"/api/v1/posts/{self.post.id}/comments/",
            {"content": "re-reply", "parent": reply.id},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comment_like_toggles(self):
        comment = Comment.objects.create(post=self.post, author=self.other, content="c")
        response = self.client.post(f"/api/v1/comments/{comment.id}/like/")
        self.assertTrue(response.data["is_liked"])
        response = self.client.post(f"/api/v1/comments/{comment.id}/like/")
        self.assertFalse(response.data["is_liked"])

    def test_only_author_deletes_comment(self):
        comment = Comment.objects.create(post=self.post, author=self.other, content="c")
        response = self.client.delete(f"/api/v1/comments/{comment.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        mine = Comment.objects.create(post=self.post, author=self.user, content="mine")
        response = self.client.delete(f"/api/v1/comments/{mine.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
