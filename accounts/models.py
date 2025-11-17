from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone  # <-- necesario para Notification


class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50, unique=True)
    permisos = models.JSONField(default=dict, blank=True)
    class Meta:
        db_table = "ROLES"
    def __str__(self): return self.nombre_rol


class Departamento(models.Model):
    id_departamento = models.AutoField(primary_key=True)
    nombre_area = models.CharField(max_length=100)
    seccion = models.CharField(max_length=100, blank=True)
    class Meta:
        db_table = "DEPARTAMENTOS"
    def __str__(self): return self.nombre_area


class Nomina(models.Model):
    id_nomina = models.AutoField(primary_key=True)
    apellido = models.CharField(max_length=120)
    nombre = models.CharField(max_length=120)
    fecha_ingreso = models.DateField(null=True, blank=True)
    departamento = models.CharField(max_length=120, blank=True)
    class Meta:
        db_table = "NOMINAS"
    def __str__(self): return f"{self.apellido}, {self.nombre}"


class Usuario(models.Model):
    """
    Tabla de negocio USUARIOS (no guarda password). OneToOne con auth_user.
    """
    id_usuario = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="biz", db_column="user_id"
    )

    id_rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, db_column="id_rol")
    id_nomina = models.ForeignKey(Nomina, on_delete=models.SET_NULL, null=True, db_column="id_nomina")
    id_departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, db_column="id_departamento")

    nombre = models.CharField(max_length=120)
    apellido = models.CharField(max_length=120)
    documento = models.CharField(max_length=50, blank=True)
    correo = models.EmailField(unique=True)

    # aprobación de cuenta
    is_approved = models.BooleanField(default=False)

    class Meta:
        db_table = "USUARIOS"

    def __str__(self): return f"{self.apellido}, {self.nombre}"


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "HISTORIAL_ACTIVIDAD"


class ImportJob(models.Model):
    ESTADOS = [("pendiente","pendiente"),("procesando","procesando"),("listo","listo"),("error","error")]
    archivo = models.FileField(upload_to="imports/")
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    total = models.IntegerField(default=0)
    ok = models.IntegerField(default=0)
    errores = models.IntegerField(default=0)
    creado_por = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "IMPORT_JOBS"


class ImportRow(models.Model):
    ESTADOS = [("ok","ok"),("error","error")]
    job = models.ForeignKey(ImportJob, on_delete=models.CASCADE, related_name="rows")
    data = models.JSONField(default=dict)
    estado = models.CharField(max_length=10, choices=ESTADOS, default="ok")
    error_msg = models.TextField(blank=True)
    class Meta:
        db_table = "IMPORT_ROWS"


# --------- NUEVO: Notificaciones in-app ----------
class Notification(models.Model):
    TO_ADMIN = "to_admin"
    TO_USER  = "to_user"
    KIND_CHOICES = [(TO_ADMIN, "Para admin"), (TO_USER, "Para usuario")]

    kind       = models.CharField(max_length=20, choices=KIND_CHOICES)
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title      = models.CharField(max_length=120)
    message    = models.TextField(blank=True)
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table  = "NOTIFICATIONS"
        ordering  = ["-created_at"]

    def __str__(self):
        return f"[{self.kind}] {self.title} -> {self.user.username}"
