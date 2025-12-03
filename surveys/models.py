# surveys/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models import UniqueConstraint, Q, CheckConstraint 
# Asumo que la aplicación accounts está importada correctamente
from accounts.models import Usuario, Rol, Departamento 

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
    
    required = models.BooleanField(default=True)
    choices = models.JSONField(default=list, blank=True, null=True) 

    def __str__(self):
        return f"[{self.get_question_type_display()}] {self.text[:40]}"
    
class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="answers")
    value = models.TextField() 

    def __str__(self):
        return f"Respuesta a {self.question.text[:20]} por {self.user.username}"


# ✅ MODELO DE ASIGNACIÓN: AHORA ES UN MODELO TOP-LEVEL
class SurveyAssignment(models.Model):
    """
    Define a quién está asignada una encuesta.
    La encuesta puede asignarse a un usuario, a un rol o a un departamento.
    """
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='assignments')
    
    # Asignación por USUARIO (individual)
    assigned_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='survey_assignments_by_user')
    
    # Asignación por ROL
    assigned_rol = models.ForeignKey(Rol, on_delete=models.CASCADE, null=True, blank=True, related_name='survey_assignments_by_rol')
    
    # Asignación por DEPARTAMENTO
    assigned_departamento = models.ForeignKey(Departamento, on_delete=models.CASCADE, null=True, blank=True, related_name='survey_assignments_by_departamento')

    class Meta:
        db_table = "SURVEY_ASSIGNMENTS"
        # 💡 Restricción para evitar asignaciones duplicadas e inútiles
        constraints = [
            models.UniqueConstraint(fields=['survey', 'assigned_user'], name='unique_user_assignment'),
            models.UniqueConstraint(fields=['survey', 'assigned_rol'], name='unique_rol_assignment'),
            models.UniqueConstraint(fields=['survey', 'assigned_departamento'], name='unique_depto_assignment'),
            # Restricción para asegurar que al menos uno de los campos de asignación esté lleno
            models.CheckConstraint(
                check=(
                    models.Q(assigned_user__isnull=False) | 
                    models.Q(assigned_rol__isnull=False) | 
                    models.Q(assigned_departamento__isnull=False)
                ),
                name='at_least_one_assignment_target'
            ),
        ]

    def __str__(self):
        if self.assigned_user:
            return f"Encuesta {self.survey.id} asignada a Usuario: {self.assigned_user.username}"
        if self.assigned_rol:
            return f"Encuesta {self.survey.id} asignada a Rol: {self.assigned_rol.nombre_rol}"
        if self.assigned_departamento:
            return f"Encuesta {self.survey.id} asignada a Depto: {self.assigned_departamento.nombre_area}"
        return f"Asignación inválida para Encuesta {self.survey.id}"