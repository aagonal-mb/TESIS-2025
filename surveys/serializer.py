from rest_framework import serializers
from .models import Survey, Question, Answer

class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'created_at', 'status']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question 
        fields = '__all__'
        
class AnswerSerializer(serializers.ModelSerializer):
    response = serializers.CharField(source="value")

    class Meta:
        model = Answer
        fields = '__all__'
