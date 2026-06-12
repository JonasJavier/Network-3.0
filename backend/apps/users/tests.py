from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Follow

User = get_user_model()


def make_user(username, **extra):
    return User.objects.create_user(
        username=username, email=f"{username}@test.dev", password="S3cure-pass!", **extra
    )


class AuthTests(APITestCase):
    def test_register_returns_tokens_and_user(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {"username": "neo", "email": "neo@test.dev", "password": "S3cure-pass!"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "neo")

    def test_register_rejects_weak_password(self):
        response = self.client.post(
            "/api/v1/auth/register/",
            {"username": "neo", "email": "neo@test.dev", "password": "123"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_duplicate_email(self):
        make_user("first")
        response = self.client.post(
            "/api/v1/auth/register/",
            {"username": "second", "email": "first@test.dev", "password": "S3cure-pass!"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_me(self):
        make_user("neo")
        token = self.client.post(
            "/api/v1/auth/token/", {"username": "neo", "password": "S3cure-pass!"}
        )
        self.assertEqual(token.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.data['access']}")
        me = self.client.get("/api/v1/users/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["username"], "neo")

    def test_anonymous_cannot_access_feed(self):
        response = self.client.get("/api/v1/posts/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = make_user("neo")
        self.client.force_authenticate(self.user)

    def test_update_own_profile(self):
        response = self.client.patch(
            "/api/v1/users/me/", {"headline": "Staff Engineer", "bio": "Hello"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.headline, "Staff Engineer")

    def test_retrieve_profile_by_username(self):
        other = make_user("trinity", headline="Operator")
        response = self.client.get("/api/v1/users/trinity/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["headline"], "Operator")
        self.assertFalse(response.data["is_following"])

    def test_search_users(self):
        make_user("trinity", headline="Operator")
        make_user("morpheus")
        response = self.client.get("/api/v1/users/", {"search": "trin"})
        usernames = [u["username"] for u in response.data["results"]]
        self.assertEqual(usernames, ["trinity"])


class FollowTests(APITestCase):
    def setUp(self):
        self.user = make_user("neo")
        self.other = make_user("trinity")
        self.client.force_authenticate(self.user)

    def test_follow_and_unfollow(self):
        response = self.client.post("/api/v1/users/trinity/follow/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_following"])
        self.assertEqual(response.data["followers_count"], 1)
        self.assertTrue(
            Follow.objects.filter(follower=self.user, following=self.other).exists()
        )

        response = self.client.delete("/api/v1/users/trinity/follow/")
        self.assertFalse(response.data["is_following"])
        self.assertEqual(response.data["followers_count"], 0)

    def test_follow_is_idempotent(self):
        self.client.post("/api/v1/users/trinity/follow/")
        self.client.post("/api/v1/users/trinity/follow/")
        self.assertEqual(Follow.objects.count(), 1)

    def test_cannot_follow_self(self):
        response = self.client.post("/api/v1/users/neo/follow/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_followers_and_following_lists(self):
        self.client.post("/api/v1/users/trinity/follow/")
        followers = self.client.get("/api/v1/users/trinity/followers/")
        self.assertEqual(followers.data["count"], 1)
        self.assertEqual(followers.data["results"][0]["username"], "neo")
        following = self.client.get("/api/v1/users/neo/following/")
        self.assertEqual(following.data["count"], 1)
        self.assertEqual(following.data["results"][0]["username"], "trinity")

    def test_suggestions_exclude_followed_and_self(self):
        make_user("morpheus")
        self.client.post("/api/v1/users/trinity/follow/")
        response = self.client.get("/api/v1/users/suggestions/")
        usernames = [u["username"] for u in response.data]
        self.assertNotIn("neo", usernames)
        self.assertNotIn("trinity", usernames)
        self.assertIn("morpheus", usernames)
