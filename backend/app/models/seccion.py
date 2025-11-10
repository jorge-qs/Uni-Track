"""
Modelo ORM para la tabla Curso
Tabla estática (desde la creación de la malla curricular)
"""

from sqlalchemy import Column, String, Integer
from app.db.database import Base


class Seccion(Base):
    """
    Modelo de Seccion
    Almacena información de las secciones de los cursos de la malla curricular
    """
    __tablename__ = "seccion"

    # columns: cod_curso,curso,Seccion,Grupo,Modalidad,Horario,Frecuencia,Ubicacion,Vacantes,Matriculados,Docente,Correo
    # ejemplo de tupla: CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1,TEORÍA 1,Presencial,Lun. 11:00 - 13:00,Semana General,UTEC-BA A901(42),30,30,"Nina Choquehuayta, Wilder ",wnina@utec.edu.pe

    # Primary Key cod_curso + grupo + Horario
    cod_curso = Column(String(10), primary_key=True, index=True, nullable=False)
    curso = Column(String(100), nullable=False)
    seccion = Column(Integer, nullable=False)
    grupo = Column(String(50), primary_key=True, index=True, nullable=True)
    modalidad = Column(String(50), nullable=True)
    horario = Column(String(100), primary_key=True, index=True, nullable=False)
    frecuencia = Column(String(50), nullable=True)
    ubicacion = Column(String(100), nullable=True)
    vacantes = Column(Integer, nullable=True)
    matriculados = Column(Integer, nullable=True)
    docente = Column(String(100), nullable=True)
    correo = Column(String(100), nullable=True)


    
    def __repr__(self):
        return f"<Seccion(cod_curso='{self.cod_curso}', nombre='{self.curso}')>"
