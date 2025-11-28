from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"roles", views.RolViewSet)
router.register(r"departamentos", views.DepartamentoViewSet)
router.register(r"nominas", views.NominaViewSet)
router.register(r"usuarios", views.UsuarioViewSet)
router.register(r"logs", views.ActivityLogViewSet)
router.register(r"import-jobs", views.ImportJobViewSet)
router.register(r"notifications", views.NotificationViewSet)

# 👇 SIN el 'api/' extra
urlpatterns = router.urls
# (equivalente a: urlpatterns = [path("", include(router.urls))])
