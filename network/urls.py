from django.urls import path
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from . import views

urlpatterns = [
    # Authentication routes
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    
    # Main page and post lists
    path("", views.index, name="index"),  # Main feed
    path("all_posts/", views.all_posts, name="all_posts"),  # View all posts
    path("following/", views.following_posts, name="following_posts"),  # Feed for followed users

    # Profile and user-related routes
    path("profile/", views.profile, name="profile"),  # User's own profile page
    path("user/<int:user_id>/", views.user_page, name="user_page"),  # View other users' profiles
    path("follow", views.follow, name="follow"),  # Follow a user
    path("unfollow", views.unfollow, name="unfollow"),  # Unfollow a user
    path("edit/", views.edit, name="edit"),  # Edit user profile

    # Post-related routes
    path("new_post", views.new_post, name="new_post"),  # Create a new post
    path("post/<int:post_id>/edit/", views.edit_post, name="edit_post"),  # Edit a post
    path("post/<int:post_id>/like/", views.like_post, name="like_post"),  # Like a post
    path("post/<int:post_id>/unlike/", views.unlike_post, name="unlike_post"),  # Unlike a post
    path("delete_post/<int:post_id>/", views.delete_post, name="delete_post"),  # Delete a post
    
    # Comment-related routes
    path('add_comment/<int:post_id>/', views.add_comment, name='add_comment'),  # Add a comment to a post
    path('like/comment/<int:comment_id>/', views.like_comment, name='like_comment'),  # Like a comment

    # Search
    path('search/', views.search_results, name='search_results'),  # Search users by username

    # Django Admin panel
    path('admin/', admin.site.urls),
]

# Serve media files in DEBUG mode
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
