from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display  = ("id_usuario","nombre","apellido","correo","is_approved")
    search_fields = ("nombre","apellido","correo","user__username","user__email")
    list_filter   = ("is_approved",)
    actions       = ["aprobar_seleccionados","desaprobar_seleccionados"]

    def aprobar_seleccionados(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} usuarios aprobados.")
    aprobar_seleccionados.short_description = "Aprobar seleccionados"

    def desaprobar_seleccionados(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} usuarios des-aprobados.")
    desaprobar_seleccionados.short_description = "Desaprobar seleccionados"


# (Opcional) Mostrar el “Usuario (biz)” inline dentro del admin de User
class UsuarioInline(admin.StackedInline):
    model = Usuario
    can_delete = False
    fk_name = "user"
    extra = 0

class UserAdmin(BaseUserAdmin):
    inlines = (UsuarioInline,)

# Re-registrar User con el inline
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("id", "kind", "user", "title", "is_read", "created_at")
    list_filter   = ("kind", "is_read")
    search_fields = ("title", "message", "user__username", "user__email")
