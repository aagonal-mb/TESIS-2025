from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Crear un router e inscribir los ViewSets
router = DefaultRouter()
router.register(r'roles', views.RolViewSet)
router.register(r'departamentos', views.DepartamentoViewSet)
router.register(r'nominas', views.NominaViewSet)
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'logs', views.ActivityLogViewSet)
router.register(r'import-jobs', views.ImportJobViewSet)
# No registramos ImportRow en el router principal, se accederá a través de ImportJob
router.register(r'notifications', views.NotificationViewSet)


urlpatterns = [
    # Incluye las rutas generadas por el router (ej. /roles/, /usuarios/1/, etc.)
    path('api/', include(router.urls)),
]

# Recuerda incluir este urls.py en el urls.py principal de tu proyecto.