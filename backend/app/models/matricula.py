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
    __tablename__ = "matriculas"

    # Composite Primary Key
    per_matricula = Column(String(10), primary_key=True, nullable=False)  # ej: 2024-1
    cod_persona = Column(String(10), ForeignKey("estudiantes.cod_persona"), primary_key=True, nullable=False)
    cod_curso = Column(String(10), ForeignKey("cursos.cod_curso"), primary_key=True, nullable=False)

    # Información académica
    nota = Column(Float, nullable=True)  # Calificación final
    hrs_inasistencia = Column(Integer, default=0)  # Horas de inasistencia
    estado = Column(String(20), nullable=True)  # Aprobado / Desaprobado / Retirado
    tipo_de_ciclo = Column(String(20), nullable=True)  # Regular / Verano / Extraordinario

    # Relaciones
    estudiante = relationship("Estudiante", backref="matriculas")
    curso = relationship("Curso", backref="matriculas")

    def __repr__(self):
        return f"<Matricula(periodo='{self.per_matricula}', estudiante='{self.cod_persona}', curso='{self.cod_curso}')>"
