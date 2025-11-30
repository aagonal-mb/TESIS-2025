# django_encuestas_api/urls.py (proyecto)
from django.contrib import admin
from django.urls import path, include

from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls

# 👇 Vistas propias de accounts
from accounts.views import MyTokenObtainPairView, RegisterView

# 👇 JWT
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
 # ----------------------------- AUTH / REGISTRO -----------------------------
 path("api/auth/register/", RegisterView.as_view(), name="auth_register"),
 path("api/auth/token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
 path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

 # ----------------------------- ADMIN DJANGO -------------------------------
 path("admin/", admin.site.urls),

 # ----------------------------- API PROPIA ---------------------------------
 # Rutas de encuestas (surveys)
 path("api/surveys/", include("surveys.urls")),

 # Rutas de cuentas / roles / usuarios, etc. (accounts)
 path("api/accounts/", include("accounts.urls")),

 # ----------------------------- DOCS ---------------------------------------
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
]
