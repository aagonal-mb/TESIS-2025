"""
URL configuration for django_encuestas_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# urls.py del proyecto principal
from django.contrib import admin
from django.urls import path, include
from surveys.urls import router as surveys_router


from rest_framework.schemas import get_schema_view
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/v1/", include("surveys.urls")),  # 👈 importante!

    path("openapi/", get_schema_view(
        title="Survey API",
        description="Documentación de la API de encuestas",
        version="1.0.0"
    ), name="openapi-schema"),

    path("docs/", include_docs_urls(title="Survey API")),
]
