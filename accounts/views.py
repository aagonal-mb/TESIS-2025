from rest_framework import viewsets, permissions
from .models import (
    Rol,
    Departamento,
    Nomina,
    Usuario,
    ActivityLog,
    ImportJob,
    ImportRow,
    Notification
)
from .serializers import (
    RolSerializer,
    DepartamentoSerializer,
    NominaSerializer,
    UsuarioSerializer,
    ActivityLogSerializer,
    ImportJobSerializer,
    ImportRowSerializer,
    NotificationSerializer,
    UserAuthSerializer # Para la cuenta de Django Auth
)
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response

# --- Permisos Base ---
# Puedes definir permisos más detallados en un archivo aparte (e.g., permissions.py)
# Ejemplo: Solo usuarios autenticados pueden acceder.
class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

# Ejemplo: Solo superusuarios pueden crear/actualizar Roles.
class IsSuperUserOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True # Permite GET, HEAD, OPTIONS a cualquiera
        return request.user and request.user.is_superuser
        
# ----------------------------------------------------------------------
## 💻 1. Vistas de Tablas de Soporte (CRUD Completo)
# ----------------------------------------------------------------------

class RolViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para los Roles."""
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsSuperUserOrReadOnly] # Solo Superuser para modificar

class DepartamentoViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para los Departamentos."""
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]

class NominaViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para la Nomina."""
    queryset = Nomina.objects.all()
    serializer_class = NominaSerializer
    permission_classes = [IsAuthenticated]

# ----------------------------------------------------------------------
## 👤 2. Vistas de Usuarios
# ----------------------------------------------------------------------

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    Provee operaciones CRUD para los Usuarios de negocio. 
    Nota: La creación de un Usuario requiere la creación de una cuenta User (auth) asociada.
    """
    queryset = Usuario.objects.select_related('user', 'id_rol', 'id_departamento').all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    # Ejemplo de Action: Obtener el perfil del usuario logueado
    @action(detail=False, methods=['get'], url_path='me')
    def get_current_user_profile(self, request):
        """Retorna el perfil (Usuario) del usuario logueado."""
        try:
            usuario = Usuario.objects.get(user=request.user)
            serializer = self.get_serializer(usuario)
            return Response(serializer.data)
        except Usuario.DoesNotExist:
            return Response({"detail": "Perfil de usuario no encontrado."}, status=404)

# ----------------------------------------------------------------------
## 📊 3. Vistas de Logs y Tareas
# ----------------------------------------------------------------------

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Provee operaciones de lectura para el Historial de Actividad."""
    # ReadOnlyModelViewSet: Solo permite listar y recuperar (GET)
    queryset = ActivityLog.objects.select_related('user').all().order_by('-created_at')
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

    # Opcional: Filtro para ver solo las actividades del usuario logueado
    def get_queryset(self):
        if self.request.user.is_superuser:
            return ActivityLog.objects.all().order_by('-created_at')
        return ActivityLog.objects.filter(user=self.request.user).order_by('-created_at')


class ImportRowViewSet(viewsets.ReadOnlyModelViewSet):
    """Provee lectura para las filas de las tareas de importación."""
    queryset = ImportRow.objects.all()
    serializer_class = ImportRowSerializer
    permission_classes = [IsAuthenticated]

class ImportJobViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD para las Tareas de Importación."""
    queryset = ImportJob.objects.select_related('creado_por').all().order_by('-created_at')
    serializer_class = ImportJobSerializer
    permission_classes = [IsAuthenticated]
    
    # Sobrescribe perform_create para asignar automáticamente el usuario logueado
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

# ----------------------------------------------------------------------
## 🔔 4. Vistas de Notificaciones
# ----------------------------------------------------------------------

class NotificationViewSet(viewsets.ModelViewSet):
    """Provee operaciones CRUD y manejo de estado para Notificaciones."""
    queryset = Notification.objects.select_related('user').all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    # Las notificaciones deben ser solo para el usuario logueado o para admins
    def get_queryset(self):
        # Los superusuarios pueden ver todas las notificaciones
        if self.request.user.is_superuser:
            return Notification.objects.all().order_by('-created_at')
        
        # Usuarios normales solo ven sus propias notificaciones
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    # Action para marcar una notificación como leída
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notificación marcada como leída'})