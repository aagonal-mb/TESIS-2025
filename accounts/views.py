from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    RolSerializer,
    DepartamentoSerializer,
    NominaSerializer,
    UsuarioSerializer,
    ActivityLogSerializer,
    ImportJobSerializer,
    ImportRowSerializer,
    NotificationSerializer,
    UserAuthSerializer,
    MyTokenObtainPairSerializer,  # JWT custom
    RegisterSerializer,           # Registro de usuarios
)

from .models import (
    Rol,
    Departamento,
    Nomina,
    Usuario,
    ActivityLog,
    ImportJob,
    ImportRow,
    Notification,
)

# ----------------------------------------------------------------------
# 🔐 Permisos base
# ----------------------------------------------------------------------


class IsAuthenticated(permissions.BasePermission):
    """
    Permiso simple: solo usuarios autenticados.
    (Ojo: esto NO es el mismo que rest_framework.permissions.IsAuthenticated,
    es uno nuestro, pero cumple lo mismo.)
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Solo superusuarios pueden crear/editar/borrar.
    Cualquiera autenticado puede hacer lecturas (GET, HEAD, OPTIONS).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True  # Permite GET, HEAD, OPTIONS
        return request.user and request.user.is_superuser


class IsApproved(permissions.BasePermission):
    """
    Solo usuarios cuyo perfil de negocio (Usuario) está aprobado.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        biz = getattr(user, "biz", None)
        if not biz:
            return False

        return biz.is_approved


class IsAdminOrManager(permissions.BasePermission):
    """
    Permite acceso a:
    - superusers
    - staff
    - usuarios con rol 'admin' o 'manager'
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_staff:
            return True

        biz = getattr(user, "biz", None)
        if not biz or not biz.id_rol:
            return False

        nombre_rol = (biz.id_rol.nombre_rol or "").lower()
        return nombre_rol in ("admin", "manager")


class IsSelfOrAdmin(permissions.BasePermission):
    """
    Para vistas de detalle de Usuario:
    - admin/manager puede ver/editar cualquier Usuario
    - usuario normal solo su propio perfil (obj.user == request.user)
    """

    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # Admin / manager
        if user.is_superuser or user.is_staff:
            return True

        biz = getattr(user, "biz", None)
        if biz and biz.id_rol:
            nombre_rol = (biz.id_rol.nombre_rol or "").lower()
            if nombre_rol in ("admin", "manager"):
                return True

        # Usuario normal: solo su propio registro Usuario
        return getattr(obj, "user_id", None) == user.id


# ----------------------------------------------------------------------
# 💻 1. Vistas de Tablas de Soporte (CRUD Completo)
# ----------------------------------------------------------------------


class RolViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para los Roles."""
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsSuperUserOrReadOnly]  # Solo Superuser para modificar


class DepartamentoViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para los Departamentos."""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated, IsApproved]


class NominaViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para la Nomina."""
    queryset = Nomina.objects.all()
    serializer_class = NominaSerializer
    permission_classes = [IsAuthenticated, IsApproved]


# ----------------------------------------------------------------------
# 👤 2. Vistas de Usuarios
# ----------------------------------------------------------------------


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    Provee operaciones CRUD para los Usuarios de negocio.
    Nota: La creación de un Usuario requiere la creación de una cuenta User (auth) asociada.
    """
    queryset = Usuario.objects.select_related("user", "id_rol", "id_departamento").all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    # GET /api/accounts/usuarios/me/
    @action(detail=False, methods=["get"], url_path="me")
    def get_current_user_profile(self, request):
        """Retorna el perfil (Usuario) del usuario logueado."""
        try:
            usuario = Usuario.objects.get(user=request.user)
            serializer = self.get_serializer(usuario)
            return Response(serializer.data)
        except Usuario.DoesNotExist:
            return Response({"detail": "Perfil de usuario no encontrado."}, status=404)

    # POST /api/accounts/usuarios/<pk>/approve/
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        Aprueba un usuario de negocio (is_approved = True).
        Solo debería hacerlo un admin / superuser.
        """
        # chequeo simple de permisos
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "No tenés permisos para aprobar usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()

        if usuario.is_approved:
            return Response({"detail": "El usuario ya estaba aprobado."})

        usuario.is_approved = True
        usuario.save()

        return Response({"detail": "Usuario aprobado."})

# ----------------------------------------------------------------------
# 📊 3. Vistas de Logs y Tareas
# ----------------------------------------------------------------------


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Provee operaciones de lectura para el Historial de Actividad."""
    queryset = ActivityLog.objects.select_related("user").all().order_by("-created_at")
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return ActivityLog.objects.all().order_by("-created_at")
        return ActivityLog.objects.filter(user=self.request.user).order_by("-created_at")


class ImportRowViewSet(viewsets.ReadOnlyModelViewSet):
    """Provee lectura para las filas de las tareas de importación."""
    queryset = ImportRow.objects.all()
    serializer_class = ImportRowSerializer
    permission_classes = [IsAuthenticated, IsApproved]


class ImportJobViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para las Tareas de Importación."""
    queryset = ImportJob.objects.select_related("creado_por").all().order_by(
        "-created_at"
    )
    serializer_class = ImportJobSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)


# ----------------------------------------------------------------------
# 🔔 4. Vistas de Notificaciones
# ----------------------------------------------------------------------


class NotificationViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD y manejo de estado para Notificaciones."""
    queryset = Notification.objects.select_related("user").all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsApproved]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Notification.objects.all().order_by("-created_at")
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "Notificación marcada como leída"})


# ----------------------------------------------------------------------
# 🔑 5. Auth: JWT y Registro
# ----------------------------------------------------------------------


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        return Response(
            UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED
        )
