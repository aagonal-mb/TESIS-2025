from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import SurveyViewSet, QuestionViewSet, AnswerViewSet, SurveyAssignmentViewSet # Asumimos SurveyAssignmentViewSet fue añadido en views.py

# Router principal
router = DefaultRouter()
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'answers', AnswerViewSet, basename='answer')
# ✅ NUEVO: Registramos el ViewSet de Asignaciones en una ruta principal
router.register(r'assignments', SurveyAssignmentViewSet, basename='survey-assignment') 


# Nested router: surveys/{id}/questions
survey_router = routers.NestedDefaultRouter(router, r'surveys', lookup='survey')
survey_router.register(r'questions', QuestionViewSet, basename='survey-questions')

# Nested router: questions/{id}/answers
question_router = routers.NestedDefaultRouter(survey_router, r'questions', lookup='question')
question_router.register(r'answers', AnswerViewSet, basename='question-answers')

urlpatterns = router.urls + survey_router.urls + question_router.urls