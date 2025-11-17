from django.contrib.auth.models import User
from rest_framework import generics, viewsets, status, permissions, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Usuario, Rol, ImportJob, ImportRow, ActivityLog
from .serializers import RegisterSerializer, UserDetailSerializer, MeUpdateSerializer
from .permissions import IsApproved, IsAdminOrManager

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    def perform_create(self, serializer):
        u = serializer.save()
        ActivityLog.objects.create(user=u, action="register", meta={"username": u.username})

class CustomTokenView(TokenObtainPairView):
    """Login JWT con chequeo de aprobación e inactividad."""
    def post(self, request, *args, **kwargs):
        username = request.data.get("username") or request.data.get("email")
        try:
            u = (User.objects.get(email__iexact=username)
                 if ("@" in (username or "")) else
                 User.objects.get(username__iexact=username))
        except User.DoesNotExist:
            return super().post(request, *args, **kwargs)
        if not u.is_active:
            return Response({"detail":"Cuenta desactivada."}, status=403)
        if not hasattr(u,"biz") or not u.biz.is_approved:
            return Response({"detail":"Cuenta pendiente de aprobación."}, status=403)
        return super().post(request, *args, **kwargs)

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsApproved]
    def get_object(self): return self.request.user
    def update(self, request, *args, **kwargs):
        ser = MeUpdateSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        u = ser.update(request.user, ser.validated_data)
        ActivityLog.objects.create(user=request.user, action="me_update", meta=ser.validated_data)
        return Response(UserDetailSerializer(u).data)

class UsersViewSet(viewsets.ModelViewSet):
    """Administración: búsqueda, aprobar, cambiar rol, activar/desactivar, creación manual."""
    queryset = User.objects.select_related("biz").all().order_by("id")
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    filter_backends = [filters.SearchFilter]
    search_fields = ["username","email","biz__documento","biz__apellido","biz__nombre"]

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        u = self.get_object()
        u.biz.is_approved = True
        u.biz.save()
        ActivityLog.objects.create(user=request.user, action="approve_user", meta={"user": u.id})
        return Response({"ok": True})

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        u = self.get_object(); u.is_active = False; u.save()
        ActivityLog.objects.create(user=request.user, action="deactivate_user", meta={"user": u.id})
        return Response({"ok": True})

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        u = self.get_object(); u.is_active = True; u.save()
        ActivityLog.objects.create(user=request.user, action="reactivate_user", meta={"user": u.id})
        return Response({"ok": True})

    @action(detail=True, methods=["post"])
    def set_role(self, request, pk=None):
        u = self.get_object()
        role_id = request.data.get("id_rol_id")
        try:
            rol = Rol.objects.get(pk=role_id)
        except Rol.DoesNotExist:
            return Response({"detail":"Rol inválido"}, status=400)
        u.biz.id_rol = rol; u.biz.save()
        ActivityLog.objects.create(user=request.user, action="set_role", meta={"user": u.id, "role": rol.id_rol})
        return Response({"ok": True})

class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail":"Falta refresh"}, status=400)
        try:
            RefreshToken(refresh).blacklist()
            ActivityLog.objects.create(user=request.user, action="logout")
            return Response({"ok": True})
        except Exception:
            return Response({"detail":"Token inválido"}, status=400)
