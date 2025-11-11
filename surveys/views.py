# surveys/views.py
from rest_framework import viewsets
from django.contrib.auth.models import User
from .models import Survey, Question, Answer
from .serializer import SurveySerializer, QuestionSerializer, AnswerSerializer

class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.all().order_by("-id")
    serializer_class = SurveySerializer

    def perform_create(self, serializer):
        owner = getattr(self.request, "user", None)
        if not owner or not owner.is_authenticated:
            owner = User.objects.first()
        serializer.save(owner=owner)

class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        qs = Question.objects.all().order_by("-id")
        survey_id = self.kwargs.get("survey_pk")
        if survey_id:
            qs = qs.filter(survey_id=survey_id)
        return qs

    def perform_create(self, serializer):
        # Ruta anidada: /api/surveys/<survey_pk>/questions/
        survey_id = self.kwargs.get("survey_pk")
        if survey_id:
            serializer.save(survey_id=survey_id)
        else:
            serializer.save()

class AnswerViewSet(viewsets.ModelViewSet):
    serializer_class = AnswerSerializer

    def get_queryset(self):
        qs = Answer.objects.all().order_by("-id")
        question_id = self.kwargs.get("question_pk")
        if question_id:
            qs = qs.filter(question_id=question_id)
        return qs

    def perform_create(self, serializer):
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            user = User.objects.first()
        serializer.save(user=user)
