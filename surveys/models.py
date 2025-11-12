from django.contrib.auth.models import User
from django.db import models

# Create your models here.
class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="surveys")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.BooleanField(default=False)
    

    def __str__(self):
        return self.title
    
class Question(models.Model):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="questions")
    text = models.CharField(max_length=500)
    QUESTION_TYPES = [
        ("text", "Texto libre"),
        ("bool", "Verdadero/Falso"),
        ("scale", "Escala 1-5"),
        ("choice", "Opción múltiple"),
        ("multi", "Selección múltiple"),
        ("date", "Fecha"),
        ("time", "Hora"),   
        ("datetime", "Fecha y hora"),
        ("email", "Correo electrónico"),
        ("number", "Número"),   
        ("url", "URL"),
        ("file", "Archivo"),
        ("rating", "Valoración"),
        ("matrix", "Matriz"),
        ("dropdown", "Desplegable"),
        ("rank", "Clasificación"),
        ("longtext", "Texto largo"),
        ("phone", "Número de teléfono"),    
        ("address", "Dirección"),
        ("signature", "Firma"),
        ("color", "Selector de color"),
        ("image", "Imagen"),
        ("video", "Video"),
        ("audio", "Audio"),
        ("captcha", "Captcha"),
        ("payment", "Pago"),
        ("custom", "Personalizado"),
        ("other", "Otro"),        
    ]
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default="text")
    
    # 👇 NUEVO
    required = models.BooleanField(default=True)
    choices = models.JSONField(default=list, blank=True, null=True)  # p/ choice, multi, dropdown, rank, etc.

    def __str__(self):
        return f"[{self.get_question_type_display()}] {self.text[:40]}"
    
class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="answers")
    value = models.TextField()  # podés guardar todo como texto y parsear según el tipo de pregunta