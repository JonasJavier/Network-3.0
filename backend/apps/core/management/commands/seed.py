"""Populate the database with realistic demo data.

Usage:
    python manage.py seed

Idempotent: running it twice will not duplicate users or posts.
Every demo account uses the password "network123".
"""

import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.posts.models import Comment, Post, PostLike
from apps.users.models import Follow

User = get_user_model()

DEMO_PASSWORD = "network123"

PEOPLE = [
    ("ada", "Ada", "Lovelace", "Software Engineer · Distributed Systems", "London, UK",
     "Building things that scale. Previously @ Analytical Engines Inc."),
    ("grace", "Grace", "Hopper", "Compiler Engineer · Speaker", "Arlington, VA",
     "I like to teach machines to speak human. COBOL was just the beginning."),
    ("linus", "Linus", "Torvalds", "Kernel Maintainer", "Portland, OR",
     "Just here for the merge conflicts."),
    ("margaret", "Margaret", "Hamilton", "Director of Software Engineering", "Boston, MA",
     "Software engineering is what got us to the moon. Reliability above all."),
    ("alan", "Alan", "Turing", "Researcher · Computability & AI", "Cambridge, UK",
     "Can machines think? Asking for a friend."),
    ("katherine", "Katherine", "Johnson", "Data Scientist · Orbital Mechanics", "Hampton, VA",
     "I love numbers, and numbers love me back."),
    ("tim", "Tim", "Berners-Lee", "Web Architect", "Geneva, CH",
     "I made a thing called the web. Still fixing it."),
    ("hedy", "Hedy", "Lamarr", "Inventor · Wireless Systems", "Los Angeles, CA",
     "Frequency hopping by day, film by night."),
]

POSTS = [
    ("ada", "Shipped our new event-driven pipeline today. 40% lower latency and the on-call "
            "rotation finally sleeps at night. The trick? Stop fighting backpressure — embrace it."),
    ("grace", "Hot take: the most valuable skill in engineering isn't writing code, it's deleting it. "
              "Today I removed 4,000 lines and the test suite got faster AND greener."),
    ("linus", "Code review tip: if the diff needs a 10-paragraph explanation, the diff is wrong. "
              "Split it. Your reviewers will thank you, and future-you will thank them."),
    ("margaret", "We don't rise to the level of our ambitions, we fall to the level of our error handling. "
                 "Write the failure path first."),
    ("alan", "Spent the weekend building a tiny neural net from scratch. No frameworks, just math. "
             "Best way to actually understand backprop — highly recommend the exercise."),
    ("katherine", "Data quality > model complexity. Every single time. Spent two days cleaning a dataset "
                  "and the 'boring' linear model now beats last quarter's deep net."),
    ("tim", "Reminder that the web was designed to be decentralized. Own your data, own your identity. "
            "The pendulum is finally swinging back and I'm here for it."),
    ("hedy", "Patent filed! 📡 New approach to spread-spectrum scheduling for congested networks. "
             "Sometimes the best ideas come from completely unrelated fields."),
    ("ada", "Mentoring question I ask every junior engineer: 'What does this code do when it fails?' "
            "If you can't answer that, you're not done yet."),
    ("grace", "A ship in port is safe, but that's not what ships are built for. "
              "Ship the feature. Gather the data. Iterate."),
    ("linus", "Talk is cheap. Show me the code."),
    ("katherine", "Like what you do, and then you will do your best. Took me years to learn "
                  "that motivation beats raw talent over any meaningful timescale."),
]

COMMENTS = [
    "Completely agree — we saw the same thing on our team.",
    "This is the way.",
    "Could you share more details? Genuinely curious about the implementation.",
    "Saving this one. 🔖",
    "Strong disagree, but I respect the take.",
    "We tried this last quarter and it paid off massively.",
    "Underrated point. More people need to hear this.",
    "Brilliant as always!",
]


class Command(BaseCommand):
    help = "Seed the database with demo users, posts, follows, likes and comments."

    def handle(self, *args, **options):
        rng = random.Random(42)

        users = {}
        for username, first, last, headline, location, bio in PEOPLE:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@network.dev",
                    "first_name": first,
                    "last_name": last,
                    "headline": headline,
                    "location": location,
                    "bio": bio,
                },
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save(update_fields=["password"])
            users[username] = user
        self.stdout.write(f"Users: {len(users)}")

        # Follows — everyone follows 3-5 others, deterministically
        follow_count = 0
        usernames = list(users)
        for username in usernames:
            others = [u for u in usernames if u != username]
            for target in rng.sample(others, k=rng.randint(3, 5)):
                _, created = Follow.objects.get_or_create(
                    follower=users[username], following=users[target]
                )
                follow_count += created
        self.stdout.write(f"Follows created: {follow_count}")

        posts = []
        for username, content in POSTS:
            post, _ = Post.objects.get_or_create(author=users[username], content=content)
            posts.append(post)
        self.stdout.write(f"Posts: {len(posts)}")

        like_count = 0
        comment_count = 0
        for post in posts:
            fans = rng.sample(usernames, k=rng.randint(2, 6))
            for fan in fans:
                if users[fan] != post.author:
                    _, created = PostLike.objects.get_or_create(user=users[fan], post=post)
                    like_count += created
            commenters = rng.sample(usernames, k=rng.randint(1, 3))
            for commenter in commenters:
                _, created = Comment.objects.get_or_create(
                    post=post,
                    author=users[commenter],
                    content=rng.choice(COMMENTS),
                )
                comment_count += created
        self.stdout.write(f"Likes created: {like_count}, comments created: {comment_count}")

        self.stdout.write(self.style.SUCCESS(
            f"Done. Log in with any of {', '.join(usernames)} / {DEMO_PASSWORD}"
        ))
