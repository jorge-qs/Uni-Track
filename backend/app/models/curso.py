"""
Modelo ORM para la tabla Curso
Tabla estática (desde la creación de la malla curricular)
"""

from sqlalchemy import Column, String, Integer
from app.db.database import Base


class Curso(Base):
    """
    Modelo de Curso
    Almacena información de los cursos de la malla curricular
    """
    __tablename__ = "cursos"

    # Primary Key
    cod_curso = Column(String(10), primary_key=True, index=True, nullable=False)

    # Información del curso
    curso = Column(String(100), nullable=False)  # Nombre del curso
    creditos = Column(Integer, nullable=False)  # Créditos académicos
    tipo_curso = Column(String(20), nullable=True)  # Obligatorio / Electivo
    hrs_curso = Column(Integer, nullable=True)  # Horas semanales

    # Clasificación
    familia = Column(String(50), nullable=True)  # Agrupación temática
    cluster = Column(String(50), nullable=True)  # Nivel de dificultad / categoría
    nivel_curso = Column(Integer, nullable=True)  # Nivel académico o ciclo sugerido

    def __repr__(self):
        return f"<Curso(cod_curso='{self.cod_curso}', nombre='{self.curso}')>"
