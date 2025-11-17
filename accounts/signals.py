from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Usuario

@receiver(post_save, sender=User)
def create_usuario_business(sender, instance, created, **kwargs):
    if created:
        Usuario.objects.create(
            user=instance,
            nombre=instance.first_name or instance.username,
            apellido=instance.last_name or "",
            correo=instance.email or f"{instance.username}@example.local",
            is_approved=False,
        )
