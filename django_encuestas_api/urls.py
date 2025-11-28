# django_encuestas_api/urls.py (proyecto)
from django.contrib import admin
from django.urls import path, include

from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls

# 👇 JWT
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
path("", admin.site.urls),

# ----------------------------- API PROPIA -----------------------------
# Rutas de encuestas (surveys)
path("api/surveys/", include("surveys.urls")),

# Rutas de cuentas / roles / usuarios, etc. (accounts)
path("api/accounts/", include("accounts.urls")),

# ----------------------------- AUTH JWT ------------------------------
path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

# ----------------------------- DOCS ----------------------------------
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
