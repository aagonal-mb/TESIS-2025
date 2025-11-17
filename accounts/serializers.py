from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Usuario, Rol

class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id_rol","nombre_rol","permisos"]

class UsuarioSerializer(serializers.ModelSerializer):
    id_rol = RolSerializer(read_only=True)
    id_rol_id = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(), source="id_rol", write_only=True, required=False
    )
    class Meta:
        model = Usuario
        fields = ["id_usuario","id_rol","id_rol_id","id_nomina","id_departamento",
                  "nombre","apellido","documento","correo","is_approved"]

class UserDetailSerializer(serializers.ModelSerializer):
    biz = UsuarioSerializer()
    class Meta:
        model = User
        fields = ["id","username","first_name","last_name","email","is_active","biz"]

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)

    def create(self, data):
        u = User(
            username=data["username"],
            email=data["email"],
            first_name=data.get("first_name",""),
            last_name=data.get("last_name",""),
            is_active=True,
        )
        u.set_password(data["password"])
        u.save()
        return u

class MeUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    nombre = serializers.CharField(required=False, allow_blank=True)
    apellido = serializers.CharField(required=False, allow_blank=True)
    documento = serializers.CharField(required=False, allow_blank=True)
    id_rol_id = serializers.IntegerField(required=False)

    def update(self, user, data):
        # auth_user
        for f in ["first_name","last_name","email"]:
            if f in data: setattr(user, f, data[f])
        user.save()
        # USUARIOS
        b = user.biz
        for f in ["nombre","apellido","documento"]:
            if f in data: setattr(b, f, data[f])
        req = self.context.get("request")
        if "id_rol_id" in data and req and req.user.is_staff:
            b.id_rol_id = data["id_rol_id"]
        b.save()
        return user
