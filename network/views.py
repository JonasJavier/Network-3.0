from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.core.paginator import Paginator
from django.contrib import messages
from .forms import PostForm, EditPostForm, ProfileBackgroundForm, ProfileImageForm, CommentForm, UserProfileForm
from .models import User, Post, Follow, Comment
from collections import defaultdict
from django.utils import timezone
from datetime import datetime, timedelta


@login_required(login_url='login')
def index(request):
    """Main page showing all posts with pagination."""
    all_posts = Post.objects.all().order_by('-created_at')
    paginator = Paginator(all_posts, 10)  # Show 10 posts per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    comment_form = CommentForm()
    return render(request, "network/index.html", {'page_obj': page_obj, 'comment_form': comment_form})


def login_view(request):
    """Handles user login; redirects to index on success or shows error message."""
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        return render(request, "network/login.html", {"message": "Invalid username and/or password."})
    return render(request, "network/login.html")


def logout_view(request):
    """Logs out the current user and redirects to index page."""
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    """Handles new user registration; logs in user on successful registration."""
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {"message": "Passwords must match."})
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        except IntegrityError:
            return render(request, "network/register.html", {"message": "Username already taken."})
    return render(request, "network/register.html")


@login_required
def new_post(request):
    """Creates a new post; redirects to index on success."""
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            new_post = form.save(commit=False)
            new_post.author = request.user
            new_post.save()
            return redirect('index')
    else:
        form = PostForm()
    return render(request, 'network/index.html', {'form': form})


def all_posts(request):
    """Displays all posts ordered by creation date."""
    posts = Post.objects.all().order_by('-created_at')
    comment_form = CommentForm()
    return render(request, 'network/index.html', {'posts': posts, 'comment_form': comment_form})


@login_required
def edit_post(request, post_id):
    """Allows post editing for post author only; redirects to profile on success."""
    post = get_object_or_404(Post, pk=post_id)

    # Ensure the current user is the author of the post
    if request.user != post.author:
        return redirect('index')

    if request.method == 'POST':
        form = EditPostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            form.save()
            return redirect('profile')  # Redirects to user profile or other preferred page
    else:
        form = EditPostForm(instance=post)

    return render(request, "network/edit_post.html", {'form': form, 'post': post})


@login_required
def like_post(request, post_id):
    """Handles liking a post. Returns JSON response with like status and message."""
    post = get_object_or_404(Post, pk=post_id)
    liked = request.user in post.likes.all()
    if not liked:
        post.likes.add(request.user)
    return JsonResponse({
        'liked': not liked,
        'message': 'Post liked successfully.' if not liked else 'You have already liked this post.'
    })


@login_required
def unlike_post(request, post_id):
    """Handles unliking a post. Returns JSON response with unlike status and message."""
    post = get_object_or_404(Post, pk=post_id)
    liked = request.user in post.likes.all()
    if liked:
        post.likes.remove(request.user)
    return JsonResponse({
        'liked': not liked,
        'message': 'Post unliked successfully.' if liked else 'You have not liked this post yet.'
    })


@login_required
def following_posts(request):
    """Displays posts from users the current user is following, with follower/following counts."""
    user = request.user
    following_posts = Post.objects.filter(author__in=user.following.all()).order_by('-created_at')
    followers = user.followers_relationships.all()
    following = user.following_relationships.all()
    followers_count = followers.count()
    following_count = following.count()
    return render(request, "network/following_posts.html", {
        'following_posts': following_posts,
        'followers': followers,
        'following': following,
        'followers_count': followers_count,
        'following_count': following_count,
    })

@login_required
def user_page(request, user_id):
    """Displays another user's profile page with their posts and followers/following information."""
    user = get_object_or_404(User, pk=user_id)  # User whose profile is being viewed
    posts = Post.objects.filter(author=user).order_by('-created_at')
    user_posts_with_images = posts.filter(image__isnull=False)
    post_count = posts.count()

    # Followers and following data
    followers = user.followers_relationships.all()
    following = user.following_relationships.all()
    followers_count = followers.count()
    following_count = following.count()
    is_following = request.user.is_authenticated and user.followers_relationships.filter(follower=request.user).exists()

    # Formulario de perfil de solo lectura
    profile_form = UserProfileForm(instance=user)
    for field in profile_form.fields.values():
        field.disabled = True  

    return render(request, 'network/user_page.html', {
        'user': user,
        'posts': posts,
        'user_posts_with_images': user_posts_with_images,
        'post_count': post_count,
        'followers': followers,
        'following': following,
        'followers_count': followers_count,
        'following_count': following_count,
        'is_following': is_following,
        'profile_form': profile_form, 
    })


@login_required
def profile(request):
    """Displays the logged-in user's profile page with edit forms for profile, background, and profile image."""
    user = request.user
    profile_form = UserProfileForm(instance=user)
    background_form = ProfileBackgroundForm(instance=user)
    profile_image_form = ProfileImageForm(instance=user)
    
    user_posts = Post.objects.filter(author=user).order_by('-created_at')
    user_posts_with_images = user_posts.filter(image__isnull=False)

    followers = user.followers_relationships.all()
    following = user.following_relationships.all()
    followers_count = followers.count()
    following_count = following.count()
    post_count = user_posts.count()

    if request.method == 'POST':
        # Handle profile updates based on the form submitted
        if 'update_profile' in request.POST:
            profile_form = UserProfileForm(request.POST, instance=user)
            if profile_form.is_valid():
                profile_form.save()
                return redirect('profile')
        
        elif 'update_background' in request.POST:
            background_form = ProfileBackgroundForm(request.POST, request.FILES, instance=user)
            if background_form.is_valid():
                background_form.save()
                return redirect('profile')
        
        elif 'update_profile_image' in request.POST:
            profile_image_form = ProfileImageForm(request.POST, request.FILES, instance=user)
            if profile_image_form.is_valid():
                profile_image_form.save()
                return redirect('profile')

    return render(request, "network/profile.html", {
        'user': user,
        'user_posts': user_posts,
        'user_posts_with_images': user_posts_with_images,
        'profile_form': profile_form,
        'background_form': background_form,
        'profile_image_form': profile_image_form,
        'followers': followers,
        'following': following,
        'followers_count': followers_count,
        'following_count': following_count,
        'post_count': post_count,
    })


@login_required
def follow(request):
    """Allows the current user to follow another user by user_id, redirecting to the followed user's page."""
    userfollow = request.POST.get('userfollow')
    userfollowData = get_object_or_404(User, pk=userfollow)
    Follow.objects.get_or_create(follower=request.user, followed_user=userfollowData)
    return HttpResponseRedirect(reverse('user_page', kwargs={'user_id': userfollow}))


@login_required
def unfollow(request):
    """Allows the current user to unfollow another user by user_id, redirecting to the unfollowed user's page."""
    userfollow_id = request.POST.get('userfollow')
    userfollowData = get_object_or_404(User, pk=userfollow_id)
    Follow.objects.filter(follower=request.user, followed_user=userfollowData).delete()
    return HttpResponseRedirect(reverse('user_page', kwargs={'user_id': userfollowData.pk}))


@login_required
def add_comment(request, post_id):
    """Allows the user to add a comment to a specific post and redirects to index on success."""
    post = get_object_or_404(Post, pk=post_id)
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            new_comment = form.save(commit=False)
            new_comment.author = request.user
            new_comment.post = post
            new_comment.save()
            messages.success(request, 'Your comment has been published.')
    return redirect('index')


@login_required(login_url='login')
def edit(request):
    """Displays an edit page where the user can update their profile information."""
    profile_form = UserProfileForm(instance=request.user)
    if request.method == 'POST':
        profile_form = UserProfileForm(request.POST, instance=request.user)
        if profile_form.is_valid():
            profile_form.save()
            messages.success(request, 'Your profile has been updated.')
            return redirect('profile')
    return render(request, 'edit.html', {'profile_form': profile_form})


def search_results(request):
    """Displays search results for users based on username query."""
    query = request.GET.get('query')
    results = User.objects.filter(username__icontains=query) if query else None
    return render(request, 'network/search_results.html', {'results': results, 'query': query})


@login_required
def delete_post(request, post_id):
    """Allows the author of a post to delete it, then redirects to the profile page."""
    post = get_object_or_404(Post, id=post_id)
    if request.user == post.author:
        post.delete()
    return redirect('profile')


@login_required
def like_comment(request, comment_id):
    """Toggles like status on a comment; returns JSON with like status and total like count."""
    comment = get_object_or_404(Comment, id=comment_id)
    if request.user in comment.likes.all():
        comment.likes.remove(request.user)
        liked = False
    else:
        comment.likes.add(request.user)
        liked = True
    return JsonResponse({'liked': liked, 'likes_count': comment.likes.count()})
