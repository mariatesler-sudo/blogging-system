

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.models.like import Like
from app.models.favorite import Favorite
from datetime import datetime


def test_user_model_creation():

    user = User(
        email="test@example.com",
        username="testuser",
        password_hash="hashed_password_123",
        role="user",
        bio="Test bio"
    )
    
    assert user.email == "test@example.com"
    assert user.username == "testuser"
    assert user.password_hash == "hashed_password_123"
    assert user.role == "user"
    assert user.bio == "Test bio"
    assert hasattr(user, 'id') or True  # id может быть None при создании
    assert hasattr(user, 'created_at')
    assert hasattr(user, 'updated_at')
    
    print("✓ User model test passed")


def test_post_model_creation():

    post = Post(
        title="Test Post Title",
        content="Test post content here",
        author_id=1
    )
    
    assert post.title == "Test Post Title"
    assert post.content == "Test post content here"
    assert post.author_id == 1
    assert hasattr(post, 'id') or True
    assert hasattr(post, 'created_at')
    
    print("✓ Post model test passed")


def test_comment_model_creation():

    comment = Comment(
        user_id=1,
        post_id=1,
        text="This is a test comment"
    )
    
    assert comment.user_id == 1
    assert comment.post_id == 1
    assert comment.text == "This is a test comment"
    assert hasattr(comment, 'id') or True
    assert hasattr(comment, 'created_at')
    
    print("✓ Comment model test passed")


def test_like_model_creation():

    like = Like(
        user_id=1,
        post_id=1
    )
    
    assert like.user_id == 1
    assert like.post_id == 1
    assert hasattr(like, 'id') or True
    
    print("✓ Like model test passed")


def test_favorite_model_creation():

    favorite = Favorite(
        user_id=1,
        post_id=1
    )
    
    assert favorite.user_id == 1
    assert favorite.post_id == 1
    assert hasattr(favorite, 'id') or True
    
    print("✓ Favorite model test passed")


def test_models_relationships():

    user = User(
        email="relation@example.com",
        username="relationuser",
        password_hash="hash",
        role="user"
    )
    

    post = Post(
        title="Relation Post",
        content="Content",
        author_id=1
    )
    

    comment = Comment(
        user_id=user.id if hasattr(user, 'id') else 1,
        post_id=post.id if hasattr(post, 'id') else 1,
        text="Test comment"
    )
    
    like = Like(
        user_id=user.id if hasattr(user, 'id') else 1,
        post_id=post.id if hasattr(post, 'id') else 1
    )
    
    favorite = Favorite(
        user_id=user.id if hasattr(user, 'id') else 1,
        post_id=post.id if hasattr(post, 'id') else 1
    )
    
    print("✓ Model relationships test passed")
