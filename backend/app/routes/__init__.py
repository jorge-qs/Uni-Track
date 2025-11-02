"""
Módulo de rutas/endpoints
Exporta todos los routers de la API
"""

from app.routes import auth, estudiantes, cursos, matriculas

__all__ = ["auth", "estudiantes", "cursos", "matriculas"]
