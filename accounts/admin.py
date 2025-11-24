from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Rol,
    Departamento,
    Nomina,
    Usuario,
    ActivityLog,
    ImportJob,
    Notification
)

# ----------------------------------------------------------------------
# 1. Registro de Modelos Simples (Tablas de Soporte)
# ----------------------------------------------------------------------

# Estos modelos ahora serán visibles y administrables en el panel.
admin.site.register(Rol)
admin.site.register(Departamento)
admin.site.register(Nomina)


# ----------------------------------------------------------------------
# 2. Configuración Avanzada de Usuario de Negocio (Usuario)
# ----------------------------------------------------------------------

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    # Ya no incluimos has_add_permission = False, ni readonly_fields = ('user',)
    # Esto habilita el botón "Agregar Usuario" y permite seleccionar el User.
    
    list_display  = ("id_usuario", "nombre", "apellido", "correo", "id_rol", "is_approved")
    search_fields = ("nombre", "apellido", "correo", "user__username", "user__email")
    list_filter   = ("is_approved", "id_rol", "id_departamento")
    actions       = ["aprobar_seleccionados", "desaprobar_seleccionados"]
    
    # El campo 'user' se mantiene en 'fields' y ahora es editable,
    # resolviendo el IntegrityError al obligar a seleccionarlo.
    fields = (
        'user', 'nombre', 'apellido', 'documento', 'correo', 
        'id_rol', 'id_nomina', 'id_departamento', 'is_approved'
    )
    # 📌 NOTA: Ya no es readonly_fields.

    def aprobar_seleccionados(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} usuarios aprobados.")
    aprobar_seleccionados.short_description = "Aprobar seleccionados"

    def desaprobar_seleccionados(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} usuarios des-aprobados.")
    desaprobar_seleccionados.short_description = "Desaprobar seleccionados"

    # ⚠️ RECOMENDACIÓN: Si tienes muchos usuarios, es buena práctica 
    # añadir 'raw_id_fields = ('user',)' para usar una búsqueda
    # en lugar de un dropdown gigante, pero eso es opcional.
    # raw_id_fields = ('user',)


# ----------------------------------------------------------------------
# 3. Configuración del User de Django Auth
# ----------------------------------------------------------------------

# Mostrar el “Usuario (biz)” inline dentro del admin de User
class UsuarioInline(admin.StackedInline):
    model = Usuario
    # IMPORTANTE: Si un User ya tiene un perfil Usuario, y creas otro Usuario
    # manualmente y lo vinculas al mismo User, tendrás un error de unicidad.
    can_delete = False
    fk_name = "user"
    extra = 0

class UserAdmin(BaseUserAdmin):
    inlines = (UsuarioInline,)

# Re-registrar User con el inline
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ----------------------------------------------------------------------
# 4. Configuración de Logs y Notificaciones
# ----------------------------------------------------------------------

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display  = ('created_at', 'user', 'action')
    list_filter   = ('action',)
    search_fields = ('action', 'user__username')
    readonly_fields = ('user', 'action', 'meta', 'created_at')
    
    def has_add_permission(self, request):
        return False


@admin.register(ImportJob)
class ImportJobAdmin(admin.ModelAdmin):
    list_display  = ('created_at', 'creado_por', 'archivo', 'estado', 'total', 'errores')
    list_filter   = ('estado',)
    search_fields = ('creado_por__username',)
    readonly_fields = ('creado_por', 'total', 'ok', 'errores', 'created_at', 'estado')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ("id", "kind", "user", "title", "is_read", "created_at")
    list_filter   = ("kind", "is_read")
    search_fields = ("title", "message", "user__username", "user__email")