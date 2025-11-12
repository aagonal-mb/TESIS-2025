# surveys/serializer.py
from rest_framework import serializers
from .models import Survey, Question, Answer

class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ["id", "title", "description", "created_at", "status"]

# Permite que el form HTML de DRF mande "" en choices sin romper
class EmptyStringJSONField(serializers.JSONField):
    def to_internal_value(self, data):
        if data in ("", None):
            return None
        return super().to_internal_value(data)

class QuestionSerializer(serializers.ModelSerializer):
    # choices puede venir vacío o null
    choices = EmptyStringJSONField(required=False, allow_null=True)

    class Meta:
        model = Question
        fields = ["id", "survey", "text", "question_type", "required", "choices"]
        # No obligamos a mandar 'survey' cuando usamos ruta anidada
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
    # Alias amistoso para escribir/leer 'value'
    response = serializers.CharField(source="value")

    class Meta:
        model = Answer
        fields = ["id", "question", "user", "response"]
        extra_kwargs = {"user": {"required": False}}
