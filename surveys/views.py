from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import Survey, Question, Answer
from .serializer import SurveySerializer, QuestionSerializer, AnswerSerializer

# Create your views here.
class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    
    def perform_create(self, serializer):
        # Asignar automáticamente un owner mientras no haya autenticación en frontend
        default_owner = User.objects.first()
        serializer.save(owner=default_owner)

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        queryset = Question.objects.all()
        survey_id = self.kwargs.get("survey_pk")  # 👈 importante: viene de lookup='survey'
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset



class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer

    def get_queryset(self):
        queryset = Answer.objects.all()
        question_id = self.kwargs.get("question_pk")  # <- clave
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        return queryset