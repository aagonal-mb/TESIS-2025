# surveys/serializer.py
from rest_framework import serializers
from .models import Survey, Question, Answer

class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ["id", "title", "description", "created_at", "status"]

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
    Esto permite que el frontend envíe 'opcion1;opcion2'.
    """
    def to_internal_value(self, data):
        if data in ("", None):
            return None
        if isinstance(data, str):
            # Convierte el string "opcion1;opcion2" a la lista ['opcion1', 'opcion2']
            return [c.strip() for c in data.split(';') if c.strip()]
        
        # Si por alguna razón recibimos una lista, la validación posterior la manejará
        return data

# --- SERIALIZERS ---

class QuestionSerializer(serializers.ModelSerializer):
    # Usamos el campo personalizado para manejar la entrada del frontend
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
        # La lógica de validación ahora recibe 'choices' como una lista o None
        qtype = attrs.get("question_type", getattr(self.instance, "question_type", "text"))
        choices = attrs.get("choices", None)

        types_need = {"choice", "multi", "dropdown", "rank", "matrix"}
        types_forbid = {
            "text","longtext","bool","scale","number","date","time","datetime",
            "email","url","file","rating","phone","address","signature","color",
            "image","video","audio","captcha","payment","custom","other"
        }

        if qtype in types_need:
            # Aquí la validación espera una lista y revisa su longitud
            if not choices or not isinstance(choices, list) or len(choices) < 2:
                raise serializers.ValidationError(
                    "Para este tipo de pregunta se requieren al menos 2 opciones en 'choices'."
                )
        
        # Si el tipo no necesita choices pero se enviaron (como en 'text')
        if qtype in types_forbid and choices:
            # Si choices es una lista de strings (lo que devuelve ChoicesStringListField),
            # entonces este error se dispara correctamente.
            raise serializers.ValidationError("Este tipo de pregunta no debe incluir 'choices'.")
            
        return attrs

class AnswerSerializer(serializers.ModelSerializer):
    # Alias amistoso para escribir/leer 'value'
    response = serializers.CharField(source="value")

    # 💡 Sugerencia: Añadir el tipo de pregunta para el frontend (lectura)
    # Esto es crucial para que AnswerCard.jsx sepa cómo formatear la respuesta.
    question_type = serializers.CharField(source='question.question_type', read_only=True)

    class Meta:
        model = Answer
        # Añade 'question_type' a los fields de salida
        fields = ["id", "question", "user", "response", "question_type"] 
        extra_kwargs = {"user": {"required": False}}