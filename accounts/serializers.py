from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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

# --- Serializers para Modelos Base ---


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = "__all__"  # Incluye id_rol, nombre_rol, permisos


class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = "__all__"  # Incluye id_departamento, nombre_area, seccion


class NominaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nomina
        fields = "__all__"  # Incluye id_nomina, apellido, nombre, fecha_ingreso, departamento


# --- Serializer para User (Modelo de Django Auth) ---


class UserAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")


# --- Serializer Principal: Usuario de Negocio ---


class UsuarioSerializer(serializers.ModelSerializer):
    # ✅ CORRECCIÓN 1: Campos para exponer el NOMBRE del rol y departamento (solo lectura)
    # Usamos source para acceder a la propiedad 'nombre_rol' a través de la FK 'id_rol'
    rol_nombre = serializers.CharField(source="id_rol.nombre_rol", read_only=True) 
    
    # Usamos source para acceder a la propiedad 'nombre_area' a través de la FK 'id_departamento'
    departamento_nombre = serializers.CharField(source="id_departamento.nombre_area", read_only=True, allow_null=True) 
    
    # Campo anidado para la data completa del User de Auth (mantener si se usa en el frontend)
    user = UserAuthSerializer(read_only=True)
    
    # Campos que se usan para la ESCRITURA (POST/PUT), permitiendo solo la ID de la FK
    id_rol = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(), write_only=True
    )
    id_departamento = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(), write_only=True, allow_null=True
    )
    id_nomina = serializers.PrimaryKeyRelatedField(
        queryset=Nomina.objects.all(), write_only=True, allow_null=True
    )

    class Meta:
        model = Usuario
        fields = (
            "id_usuario",
            "nombre",
            "apellido",
            "documento",
            "correo",
            "is_approved",
            "user",
            # Campos FK para escritura (write_only=True)
            "id_rol",
            "id_nomina",
            "id_departamento",
            # ✅ Campos de lectura que exponen el nombre (Rol y Departamento)
            "rol_nombre", 
            "departamento_nombre", 
        )
        read_only_fields = ("user",)  # La relación OneToOne se maneja en la vista


# --- Serializers de Logs y Tareas de Importación (sin cambios) ---


class ActivityLogSerializer(serializers.ModelSerializer):
    user_info = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ActivityLog
        fields = "__all__"
        read_only_fields = ("user", "created_at")


class ImportRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportRow
        fields = "__all__"
        read_only_fields = ("job",)


class ImportJobSerializer(serializers.ModelSerializer):
    # Muestra las filas relacionadas de forma anidada
    rows = ImportRowSerializer(many=True, read_only=True)
    creado_por_username = serializers.CharField(
        source="creado_por.username", read_only=True
    )

    class Meta:
        model = ImportJob
        fields = "__all__"
        read_only_fields = (
            "estado",
            "total",
            "ok",
            "errores",
            "creado_por",
            "created_at",
            "rows",
        )


# --- Serializer de Notificaciones (sin cambios) ---


class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("user", "created_at")


# --- JWT personalizado ---


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Datos básicos del User
        token["username"] = user.username
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser

        # Datos del perfil de negocio (Usuario)
        biz = getattr(user, "biz", None)
        if biz:
            token["id_usuario"] = biz.id_usuario
            token["nombre"] = biz.nombre
            token["apellido"] = biz.apellido
            token["correo"] = biz.correo
            token["is_approved"] = biz.is_approved

            if biz.id_rol:
                token["rol"] = biz.id_rol.nombre_rol  # ej: "admin", "manager", "user"

            if biz.id_departamento:
                # ✅ CORRECCIÓN 2: El campo en el modelo es 'nombre_area'
                token["departamento"] = biz.id_departamento.nombre_area 

        return token


# --- Registro de usuarios (self-service) (sin cambios) ---


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    nombre = serializers.CharField()
    apellido = serializers.CharField()
    correo = serializers.EmailField()
    documento = serializers.CharField(required=False, allow_blank=True)

    id_rol = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(), required=False, allow_null=True
    )
    id_nomina = serializers.PrimaryKeyRelatedField(
        queryset=Nomina.objects.all(), required=False, allow_null=True
    )
    id_departamento = serializers.PrimaryKeyRelatedField(
        queryset=Departamento.objects.all(), required=False, allow_null=True
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ese nombre de usuario ya existe.")
        return value

    def validate_correo(self, value):
        if Usuario.objects.filter(correo=value).exists():
            raise serializers.ValidationError("Ese correo ya está registrado.")
        return value

    def create(self, validated_data):
        # 1) Sacamos username y password para crear el User de Django
        username = validated_data.pop("username")
        password = validated_data.pop("password")
        correo = validated_data.get("correo")

        user = User.objects.create_user(
            username=username,
            email=correo,
            password=password,
            first_name=validated_data.get("nombre", ""),
            last_name=validated_data.get("apellido", ""),
            is_active=True,
        )

        # 2) Usar (o crear) el Usuario de negocio asociado a ese User
        usuario, created = Usuario.objects.get_or_create(user=user)

        # 3) Cargar todos los datos de negocio en ese Usuario
        usuario.is_approved = False  # queda pendiente de aprobación
        for field in [
            "nombre",
            "apellido",
            "documento",
            "correo",
            "id_rol",
            "id_nomina",
            "id_departamento",
        ]:
            if field in validated_data:
                setattr(usuario, field, validated_data[field])

        usuario.save()
        return usuario