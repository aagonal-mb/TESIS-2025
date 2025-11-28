from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsApproved(BasePermission):
    """
    Solo deja pasar a usuarios cuyo perfil de negocio (Usuario)
    esté marcado como is_approved=True.
    """

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        biz = getattr(user, "biz", None)
        if not biz:
            return False

        return biz.is_approved


class IsAdminOrManager(BasePermission):
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


class IsSelfOrAdmin(BasePermission):
    """
    Para vistas de detalle (retrieve/update):
    - admin/manager puede ver/editar todo
    - usuario normal solo su propio perfil (Usuario.user == request.user)
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
        # obj es una instancia de Usuario
        return getattr(obj, "user_id", None) == user.id
