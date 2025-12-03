# surveys/serializer.py
from rest_framework import serializers
# 💡 Importamos los modelos de surveys
from .models import Survey, Question, Answer, SurveyAssignment 
# 💡 Importamos los modelos de accounts necesarios para las FKs
from accounts.models import Rol, Departamento, User 


# --- CAMPOS PERSONALIZADOS ---

# Permite que el form HTML de DRF mande "" en campos de tipo JSON
class EmptyStringJSONField(serializers.JSONField):
    def to_internal_value(self, data):
        if data in ("", None):
            return None
        return super().to_internal_value(data)

class ChoicesStringListField(serializers.CharField):
    """
    Convierte un string separado por punto y coma (;) en una lista de strings.
    """
    def to_internal_value(self, data):
        if data in ("", None):
            return None
        if isinstance(data, str):
            return [c.strip() for c in data.split(';') if c.strip()]
        
        return data

# -----------------------------------------------------
# ✅ NUEVO: SERIALIZERS PARA ASIGNACIÓN
# -----------------------------------------------------

class RolAssignmentSerializer(serializers.ModelSerializer):
    """Solo expone el ID y el nombre del Rol para lectura."""
    class Meta:
        model = Rol
        fields = ['id_rol', 'nombre_rol']

class DepartamentoAssignmentSerializer(serializers.ModelSerializer):
    """Solo expone el ID y el nombre del Departamento para lectura."""
    class Meta:
        model = Departamento
        fields = ['id_departamento', 'nombre_area']

class UserAssignmentSerializer(serializers.ModelSerializer):
    """Expone el ID del User y el nombre del Usuario de negocio."""
    # Accede al campo 'nombre' del perfil de negocio (relacionado por related_name='biz')
    full_name = serializers.CharField(source='biz.nombre', read_only=True) 
    
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name']


class SurveyAssignmentSerializer(serializers.ModelSerializer):
    # Campos de solo lectura para exponer la data de la asignación
    assigned_user_data = UserAssignmentSerializer(source='assigned_user', read_only=True)
    assigned_rol_data = RolAssignmentSerializer(source='assigned_rol', read_only=True)
    assigned_departamento_data = DepartamentoAssignmentSerializer(source='assigned_departamento', read_only=True)
    
    # Usamos la ID de la encuesta como campo de solo lectura (lo enviaremos en la vista/ruta anidada)
    survey_id = serializers.PrimaryKeyRelatedField(source='survey', read_only=True)

    class Meta:
        model = SurveyAssignment
        fields = [
            'id', 
            'survey_id', 
            # Campos FK para lectura y escritura (escribimos la ID)
            'assigned_user', 
            'assigned_rol', 
            'assigned_departamento',
            # Campos anidados para lectura
            'assigned_user_data',
            'assigned_rol_data',
            'assigned_departamento_data',
        ]
        # Permitir NULL y no requerido en escritura
        extra_kwargs = {
            'assigned_user': {'allow_null': True, 'required': False},
            'assigned_rol': {'allow_null': True, 'required': False},
            'assigned_departamento': {'allow_null': True, 'required': False},
        }

    def validate(self, attrs):
        # Lógica para asegurar que solo se asigne a UN objetivo
        instance = getattr(self, 'instance', None)
        
        # En creación (instance is None), la clave survey_id no está en attrs por el source='survey'
        # En actualización (instance exists), los valores existentes son fallbacks
        
        # Obtenemos los valores de asignación, considerando valores nuevos o existentes
        assigned_user = attrs.get('assigned_user', getattr(instance, 'assigned_user', None))
        assigned_rol = attrs.get('assigned_rol', getattr(instance, 'assigned_rol', None))
        assigned_departamento = attrs.get('assigned_departamento', getattr(instance, 'assigned_departamento', None))

        assigned_count = sum(1 for x in [assigned_user, assigned_rol, assigned_departamento] if x is not None)
        
        if assigned_count > 1:
            raise serializers.ValidationError("Una encuesta solo puede asignarse a un objetivo (usuario, rol, o departamento) por asignación.")
        if assigned_count == 0:
            # Esta validación es esencial por el CheckConstraint en el modelo
            raise serializers.ValidationError("Debe asignar la encuesta al menos a un usuario, rol o departamento.")
            
        return attrs


# -----------------------------------------------------
# ✅ ACTUALIZACIÓN: SurveySerializer
# -----------------------------------------------------

class SurveySerializer(serializers.ModelSerializer):
    # Añadimos el campo anidado para mostrar todas las asignaciones de la encuesta
    # Usamos related_name='assignments' definido en surveys/models.py
    assignments = SurveyAssignmentSerializer(many=True, read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    
    class Meta:
        model = Survey
        fields = ["id", "title", "description", "owner_username", "created_at", "status", "assignments"]


class QuestionSerializer(serializers.ModelSerializer):
    # ... (mantenemos el código de QuestionSerializer y AnswerSerializer sin cambios aquí) ...
    # Nota: Los dejé fuera de esta respuesta para enfocarme en los nuevos serializers.
    
    choices = ChoicesStringListField(required=False, allow_null=True)

    class Meta:
        model = Question
        fields = ["id", "survey", "text", "question_type", "required", "choices"]
        extra_kwargs = {
            "survey": {"required": False},
            "text": {"required": True},
            "question_type": {"required": True},
            "required": {"required": False},
        }
    def validate(self, attrs):
         qtype = attrs.get("question_type", getattr(self.instance, "question_type", "text"))
         choices = attrs.get("choices", None)
         types_need = {"choice", "multi", "dropdown", "rank", "matrix"}
         types_forbid = {
            "text","longtext","bool","scale","number","date","time","datetime",
             "email","url","file","rating","phone","address","signature","color",
             "image","video","audio","captcha","payment","custom","other"
         }
         if qtype in types_need:
             if not choices or not isinstance(choices, list) or len(choices) < 2:
                 raise serializers.ValidationError(
                     "Para este tipo de pregunta se requieren al menos 2 opciones en 'choices'."
                 )
         if qtype in types_forbid and choices:
             raise serializers.ValidationError("Este tipo de pregunta no debe incluir 'choices'.")
         return attrs

class AnswerSerializer(serializers.ModelSerializer):
    response = serializers.CharField(source="value")
    question_type = serializers.CharField(source='question.question_type', read_only=True)

    class Meta:
        model = Answer
        fields = ["id", "question", "user", "response", "question_type"] 
        extra_kwargs = {"user": {"required": False}}