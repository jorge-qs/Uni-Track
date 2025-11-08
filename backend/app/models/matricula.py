"""
Modelo ORM para la tabla Matricula
Tabla dinámica (registro histórico de matrícula)
"""

from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Matricula(Base):
    """
    Modelo de Matrícula
    Almacena el registro histórico de matrículas de estudiantes en cursos
    """
    __tablename__ = "matricula"

    # columns: COD_PERSONA,COD_CURSO,PER_MATRICULA,NOTA,HRS_INASISTENCIA
    # ejemplo de tuplas: 33277,MA100,2017-01,20.0,0

    # Primary Key compuesta
    cod_persona = Column(String(10), ForeignKey("alumno.cod_persona"), primary_key=True, index=True, nullable=False)
    cod_curso = Column(String(10), ForeignKey("curso.cod_curso"), primary_key=True, index=True, nullable=False)
    per_matricula = Column(String(7), primary_key=True, index=True, nullable=False)  # Formato: AAAA-MM
    nota = Column(Float, nullable=True)  # Nota final del curso
    hrs_inasistencia = Column(Integer, nullable=True)  # Horas de inasistencia

    def __repr__(self):
        return f"<Matricula(periodo='{self.per_matricula}', estudiante='{self.cod_persona}', curso='{self.cod_curso}')>"
