"""
Modelo ORM para la tabla Estudiante
Tabla estática (se crea después del registro)
"""

from sqlalchemy import Column, String, Float, Boolean, Date
from app.db.database import Base


class Estudiante(Base):
    """
    Modelo de Estudiante
    Almacena información personal y académica del estudiante
    """
    __tablename__ = "estudiantes"

    # Primary Key
    cod_persona = Column(String(10), primary_key=True, index=True, nullable=False)

    # Información personal
    sexo = Column(String(1), nullable=True)  # M/F/O
    estado_civil = Column(String(20), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)

    # Información académica
    per_ingreso = Column(String(10), nullable=True)  # Periodo de ingreso (ej: 2022-1)
    tipo_colegio = Column(String(30), nullable=True)  # Público / Privado
    puntaje_ingreso = Column(Float, nullable=True)  # Nota de ingreso
    beca_vigente = Column(Boolean, default=False)  # True si posee beca activa

    # Procedencia (origen)
    departamento_pro = Column(String(50), nullable=True)
    provincia_pro = Column(String(50), nullable=True)
    distrito_pro = Column(String(50), nullable=True)

    # Residencia actual
    departamento_res = Column(String(50), nullable=True)
    provincia_res = Column(String(50), nullable=True)
    distrito_res = Column(String(50), nullable=True)

    def __repr__(self):
        return f"<Estudiante(cod_persona='{self.cod_persona}', periodo='{self.per_ingreso}')>"
