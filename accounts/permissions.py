from rest_framework.permissions import BasePermission

class IsApproved(BasePermission):
    def has_permission(self, request, view):
        u = getattr(request, "user", None)
        return bool(u and u.is_authenticated and hasattr(u, "biz") and u.biz.is_approved)

class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        u = getattr(request, "user", None)
        if not (u and u.is_authenticated and hasattr(u, "biz")):
            return False
        # Ajustá los nombres de rol si usás otros
        return u.is_staff or (u.biz.id_rol and u.biz.id_rol.nombre_rol in ("admin","manager"))
