# surveys/views.py
from rest_framework import viewsets
from django.contrib.auth.models import User

from accounts.permissions import IsAdminOrManager
# ✅ Importamos los modelos de surveys y accounts
from .models import Survey, Question, Answer, SurveyAssignment 
from .serializer import SurveySerializer, QuestionSerializer, AnswerSerializer, SurveyAssignmentSerializer 
from accounts.models import Usuario, Rol, Departamento # Necesario para lookups

# 💡 NOTA: Asumimos que AnswerSerializer y SurveyAssignmentSerializer ya están importados

class SurveyViewSet(viewsets.ModelViewSet):
    # ... (código sin cambios) ...
    queryset = Survey.objects.all().order_by("-id")
    serializer_class = SurveySerializer

    def perform_create(self, serializer):
        owner = getattr(self.request, "user", None)
        if not owner or not owner.is_authenticated:
            owner = User.objects.first()
        serializer.save(owner=owner)

class QuestionViewSet(viewsets.ModelViewSet):
    # ... (código sin cambios) ...
    serializer_class = QuestionSerializer

    def get_queryset(self):
        qs = Question.objects.all().order_by("-id")
        survey_id = self.kwargs.get("survey_pk")
        if survey_id:
            qs = qs.filter(survey_id=survey_id)
        return qs

    def perform_create(self, serializer):
        survey_id = self.kwargs.get("survey_pk")
        if survey_id:
            serializer.save(survey_id=survey_id)
        else:
            serializer.save()

class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer

    def get_queryset(self):
        # Usamos select_related para optimizar las consultas a User y Usuario
        qs = Answer.objects.all().order_by("-id").select_related('question__survey', 'user__biz')
        
        # 1. Filtro por ID de Encuesta (Usado en SurveyResponsesPage.jsx)
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
             # Filtra respuestas cuyas preguntas pertenecen a la encuesta dada
             qs = qs.filter(question__survey_id=survey_id)
             
        # 2. Filtro por ID de Rol (Reportes)
        rol_id = self.request.query_params.get('rol_id')
        if rol_id:
             # Filtra: Respuesta -> User (auth) -> biz (Usuario) -> id_rol (Rol)
             qs = qs.filter(user__biz__id_rol=rol_id)
             
        # 3. Filtro por ID de Departamento (Reportes)
        depto_id = self.request.query_params.get('departamento_id')
        if depto_id:
             # Filtra: Respuesta -> User (auth) -> biz (Usuario) -> id_departamento (Departamento)
             qs = qs.filter(user__biz__id_departamento=depto_id)
             
        return qs

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            user = User.objects.first()
        serializer.save(user=user)

class SurveyAssignmentViewSet(viewsets.ModelViewSet):
    # ... (código sin cambios) ...
    queryset = SurveyAssignment.objects.all().order_by("survey") 
    serializer_class = SurveyAssignmentSerializer
    permission_classes = [IsAdminOrManager] # <-- Asegúrate de importar IsAdminOrManager en surveys/views.py si es necesario

    def get_queryset(self):
        qs = super().get_queryset()
        survey_id = self.request.query_params.get('survey_id')
        if survey_id:
            qs = qs.filter(survey_id=survey_id)
        return qs