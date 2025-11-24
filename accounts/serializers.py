from rest_framework import serializers
from django.contrib.auth.models import User
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

# --- Serializers para Modelos Base ---

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__' # Incluye id_rol, nombre_rol, permisos

class DepartamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Departamento
        fields = '__all__' # Incluye id_departamento, nombre_area, seccion

class NominaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nomina
        fields = '__all__' # Incluye id_nomina, apellido, nombre, fecha_ingreso, departamento

# --- Serializer para User (Modelo de Django Auth) ---

class UserAuthSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined')

# --- Serializer Principal: Usuario de Negocio ---

class UsuarioSerializer(serializers.ModelSerializer):
    # Campos que representan relaciones con datos anidados
    user = UserAuthSerializer(read_only=True)
    id_rol_data = RolSerializer(source='id_rol', read_only=True)
    id_departamento_data = DepartamentoSerializer(source='id_departamento', read_only=True)
    
    # Campo para la clave foránea simple (solo ID en escritura)
    id_rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), write_only=True)
    id_departamento = serializers.PrimaryKeyRelatedField(queryset=Departamento.objects.all(), write_only=True, allow_null=True)
    id_nomina = serializers.PrimaryKeyRelatedField(queryset=Nomina.objects.all(), write_only=True, allow_null=True)

    class Meta:
        model = Usuario
        fields = (
            'id_usuario', 'nombre', 'apellido', 'documento', 'correo', 
            'is_approved',
            'user', 'id_rol', 'id_nomina', 'id_departamento',
            # Campos anidados solo para lectura
            'id_rol_data', 'id_departamento_data'
        )
        read_only_fields = ('user',) # La relación OneToOne se maneja en la vista o lógica de negocio

# --- Serializers de Logs y Tareas de Importación ---

class ActivityLogSerializer(serializers.ModelSerializer):
    user_info = serializers.CharField(source='user.username', read_only=True) # Muestra el username del User
    
    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class ImportRowSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportRow
        fields = '__all__'
        read_only_fields = ('job',)

class ImportJobSerializer(serializers.ModelSerializer):
    # Muestra las filas relacionadas de forma anidada
    rows = ImportRowSerializer(many=True, read_only=True) 
    creado_por_username = serializers.CharField(source='creado_por.username', read_only=True)

    class Meta:
        model = ImportJob
        fields = '__all__'
        read_only_fields = ('estado', 'total', 'ok', 'errores', 'creado_por', 'created_at', 'rows')

# --- Serializer de Notificaciones ---

class NotificationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')