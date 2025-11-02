"""
Módulo de modelos ORM
Exporta todos los modelos de la base de datos
"""

from app.models.estudiante import Estudiante
from app.models.curso import Curso
from app.models.matricula import Matricula

__all__ = ["Estudiante", "Curso", "Matricula"]
