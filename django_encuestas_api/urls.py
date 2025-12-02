# django_encuestas_api/urls.py (proyecto)
from django.contrib import admin
from django.urls import path, include

from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls

# 👇 Vistas propias de accounts
from accounts.views import (
    MyTokenObtainPairView,
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ChangePasswordView,
)

# 👇 JWT
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    # ----------------------------- ADMIN -----------------------------
    path("admin/", admin.site.urls),

    # ----------------------------- AUTH / REGISTRO -------------------
    path("api/auth/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path(
        "api/auth/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password_reset",
    ),
    path(
        "api/auth/password-reset-confirm/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),

    # ----------------------------- APPS ------------------------------
    path("api/accounts/", include("accounts.urls")),
    path("api/surveys/", include("surveys.urls")),

    # ----------------------------- DOCS ------------------------------
    path(
        "openapi/",
        get_schema_view(
            title="Survey API",
            description="Documentación de la API de encuestas",
            version="1.0.0",
        ),
        name="openapi-schema",
    ),
    path("docs/", include_docs_urls(title="Survey API")),

        path(
        "api/auth/change-password/",
        ChangePasswordView.as_view(),
        name="change_password",
    ),

]
