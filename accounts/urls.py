from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, CustomTokenView, MeView, UsersViewSet, LogoutView

router = DefaultRouter()
router.register(r'users', UsersViewSet, basename='users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenView.as_view(), name='login'),
    path('me/', MeView.as_view(), name='me'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
]
