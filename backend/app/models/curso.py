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
    __tablename__ = "curso"

    # Primary Key
    cod_curso = Column(String(10), primary_key=True, index=True, nullable=False)

    # Información del curso
    curso = Column(String(100), nullable=False)  # Nombre del curso
    creditos = Column(Integer, nullable=False)  # Créditos académicos

    # Clasificación
    familia = Column(String(2), nullable=True)  # Agrupación temática
    nivel_curso = Column(Integer, nullable=True)  # Nivel académico o ciclo sugerido
    tipo = Column(String(3), nullable=False) # O -> obligatorio, EH -> electivo humanidades, EP -> electivo de carrera
    
    horas = Column(Integer, nullable=True)  # Horas semanales
    # opción simple: almacenar la lista como texto separador por comas
    prerequisito = Column(String(200), nullable=True)  # guarda "CALCULO I,MATEMATICA II"
    prerequisito_cod = Column(String(200), nullable=True)  # guarda "MA101,MA102"
    resources = Column(String(1000), nullable=True)  # recursos adicionales (URL u otros)
    descripcion = Column(String(1000), nullable=True)  # descripción del curso
    
    def __repr__(self):
        return f"<Curso(cod_curso='{self.cod_curso}', nombre='{self.curso}')>"
