from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings


from django.contrib.auth.models import User
from rest_framework import status, viewsets, permissions
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

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
    # ✅ CORREGIDO: Usamos IsAdminOrManager para permitir a los administradores del negocio acceder
    permission_classes = [IsAdminOrManager] 


class DepartamentoViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para los Departamentos."""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    # ✅ CORREGIDO: Usamos IsAdminOrManager en lugar del filtro IsApproved/IsAuthenticated
    permission_classes = [IsAdminOrManager]


class NominaViewSet(viewsets.ModelViewSet):
    # ... (código sin cambios)
    queryset = Nomina.objects.all()
    serializer_class = NominaSerializer
    permission_classes = [IsAuthenticated, IsApproved]


# ----------------------------------------------------------------------
# 👤 2. Vistas de Usuarios
# ----------------------------------------------------------------------


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    CRUD de Usuarios de negocio (tabla USUARIOS).
    - La creación completa de usuario (User + Usuario) se hace vía RegisterView.
    - Acá se administran datos personales, rol, departamento, aprobado, activo, etc.
    """

    queryset = Usuario.objects.select_related("user", "id_rol", "id_departamento").all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    # ----------------- helpers internos -----------------

    def _is_admin_like(self, user):
        """Devuelve True si el usuario es admin/superuser/manager/RRHH."""
        if not user or not user.is_authenticated:
            return False

        if user.is_superuser or user.is_staff:
            return True

        biz = getattr(user, "biz", None)
        if biz and biz.id_rol:
            nombre_rol = (biz.id_rol.nombre_rol or "").lower()
            return nombre_rol in ("admin", "manager", "rrhh", "supervisor")

        return False

    # ----------------- queryset según quién mira -----------------

    def get_queryset(self):
        """
        - Admin / manager / superuser ve a todos.
        - Usuario normal solo ve su propio registro.
        """
        user = self.request.user
        qs = super().get_queryset()

        if self._is_admin_like(user):
            return qs

        if not user.is_authenticated:
            return Usuario.objects.none()

        return qs.filter(user=user)

    # ----------------- /usuarios/me/ -----------------

    @action(detail=False, methods=["get"], url_path="me")
    def get_current_user_profile(self, request):
        """
        GET /api/accounts/usuarios/me/
        Retorna el perfil de negocio del usuario logueado.
        """
        try:
            usuario = Usuario.objects.select_related("user", "id_rol", "id_departamento").get(
                user=request.user
            )
        except Usuario.DoesNotExist:
            return Response(
                {"detail": "No se encontró el perfil de usuario asociado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(usuario)
        return Response(serializer.data)

    # ----------------- aprobar usuario -----------------

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        POST /api/accounts/usuarios/{id}/approve/
        Marca is_approved = True.
        Solo admin / superuser.
        """
        if not self._is_admin_like(request.user):
            return Response(
                {"detail": "No tenés permisos para aprobar usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()
        if usuario.is_approved:
            return Response({"detail": "El usuario ya estaba aprobado."})

        usuario.is_approved = True
        usuario.save()

        # opcional: registrar en el historial
        ActivityLog.objects.create(
            user=request.user,
            action="usuario_aprobado",
            meta={"usuario_id": usuario.id_usuario, "correo": usuario.correo},
        )

        return Response({"detail": "Usuario aprobado."})

    # ----------------- desactivar / reactivar -----------------

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        """
        POST /api/accounts/usuarios/{id}/deactivate/
        Marca al auth.User como inactivo (is_active = False).
        """
        if not self._is_admin_like(request.user):
            return Response(
                {"detail": "No tenés permisos para desactivar usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()
        auth_user = usuario.user
        if not auth_user.is_active:
            return Response({"detail": "El usuario ya estaba inactivo."})

        auth_user.is_active = False
        auth_user.save()

        ActivityLog.objects.create(
            user=request.user,
            action="usuario_desactivado",
            meta={"usuario_id": usuario.id_usuario, "auth_id": auth_user.id},
        )

        return Response({"detail": "Usuario desactivado."})

    @action(detail=True, methods=["post"], url_path="reactivate")
    def reactivate(self, request, pk=None):
        """
        POST /api/accounts/usuarios/{id}/reactivate/
        Vuelve a activar al auth.User (is_active = True).
        """
        if not self._is_admin_like(request.user):
            return Response(
                {"detail": "No tenés permisos para reactivar usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()
        auth_user = usuario.user
        if auth_user.is_active:
            return Response({"detail": "El usuario ya estaba activo."})

        auth_user.is_active = True
        auth_user.save()

        ActivityLog.objects.create(
            user=request.user,
            action="usuario_reactivado",
            meta={"usuario_id": usuario.id_usuario, "auth_id": auth_user.id},
        )

        return Response({"detail": "Usuario reactivado."})

    # ----------------- actualizar rol y departamento -----------------

    @action(detail=True, methods=["patch"], url_path="update-role-dept")
    def update_role_dept(self, request, pk=None):
        """
        PATCH /api/accounts/usuarios/{id}/update-role-dept/
        Permite actualizar el departamento y el rol del usuario de negocio.
        Solo admin / RRHH / manager / superuser.
        """
        if not self._is_admin_like(request.user):
            return Response(
                {"detail": "No tenés permisos para editar rol y departamento."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()

        id_departamento = request.data.get("id_departamento", None)
        id_rol = request.data.get("id_rol", None)

        # ---- Departamento ----
        if id_departamento is not None:
            if id_departamento in ("", 0, "0", None, False):
                # dejar sin departamento
                usuario.id_departamento = None
            else:
                try:
                    dept = Departamento.objects.get(pk=id_departamento)
                    usuario.id_departamento = dept
                except Departamento.DoesNotExist:
                    return Response(
                        {"detail": "Departamento no encontrado."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        # ---- Rol ----
        if id_rol is not None:
            if id_rol in ("", 0, "0", None, False):
                usuario.id_rol = None
            else:
                try:
                    rol = Rol.objects.get(pk=id_rol)
                    usuario.id_rol = rol
                except Rol.DoesNotExist:
                    return Response(
                        {"detail": "Rol no encontrado."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        usuario.save()

        # opcional: registrar en el historial
        ActivityLog.objects.create(
            user=request.user,
            action="usuario_rol_depto_editado",
            meta={
                "usuario_id": usuario.id_usuario,
                "id_rol": usuario.id_rol.id if usuario.id_rol else None,
                "id_departamento": usuario.id_departamento.id
                if usuario.id_departamento
                else None,
            },
        )

        serializer = self.get_serializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)


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

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response(
                {"detail": "Tenés que enviar un correo válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserModel = get_user_model()
        user = UserModel.objects.filter(email__iexact=email).first()

        from .models import Usuario
        if not user:
            usuario = (
                Usuario.objects.select_related("user")
                .filter(correo__iexact=email)
                .first()
            )
            if usuario:
                user = usuario.user

        # Aunque no exista, devolvemos 200 igual (no revelamos info)
        if not user:
            return Response(
                {
                    "detail": "Si el correo está registrado, vas a recibir un email con instrucciones."
                },
                status=status.HTTP_200_OK,
            )

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        frontend_base = getattr(
            settings,
            "FRONTEND_URL",
            "http://localhost:5173",
        )
        reset_link = f"{frontend_base}/reset-password?uid={uid}&token={token}"

        subject = "Recuperación de contraseña - TESIS HR Surveys"
        message = (
            "Recibimos una solicitud para restablecer tu contraseña.\n\n"
            f"Podés hacerlo desde este enlace:\n{reset_link}\n\n"
            "Si no fuiste vos, simplemente ignorá este mensaje."
        )
        from_email = getattr(
            settings,
            "DEFAULT_FROM_EMAIL",
            "no-reply@tesis-hr-surveys.local",
        )

        try:
            send_mail(
                subject,
                message,
                from_email,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print("Error enviando mail de password reset:", e)
            return Response(
                {
                    "detail": "No se pudo enviar el correo de recuperación. Revisá la configuración de correo del servidor."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": "Si el correo está registrado, vas a recibir un email con instrucciones."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    Recibe uid, token y nueva contraseña.
    Si todo es válido, actualiza la contraseña del usuario.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response(
                {"detail": "Faltan datos para completar el proceso."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        UserModel = get_user_model()
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = UserModel.objects.get(pk=uid)
        except Exception:
            return Response(
                {"detail": "Enlace inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"detail": "El enlace de recuperación no es válido o expiró."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Todo OK → seteamos nueva contraseña
        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "La contraseña fue actualizada correctamente."},
            status=status.HTTP_200_OK,
        )

class ChangePasswordView(APIView):
    """
    Permite al usuario logueado cambiar su contraseña con:
    - current_password
    - new_password
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current = request.data.get("current_password")
        new = request.data.get("new_password")

        if not current or not new:
            return Response(
                {"detail": "Tenés que enviar la contraseña actual y la nueva."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.check_password(current):
            return Response(
                {"detail": "La contraseña actual no es correcta."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new) < 6:
            return Response(
                {"detail": "La nueva contraseña debe tener al menos 6 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new)
        user.save()

        return Response(
            {"detail": "La contraseña fue actualizada correctamente."},
            status=status.HTTP_200_OK,
        )
