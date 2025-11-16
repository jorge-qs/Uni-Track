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

    # columns: cod_curso,curso,seccion_key,horarios
    # ejemplo de tupla: CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1.01,"[{""Seccion"": 1, ""Grupo"": ""LABORATORIO 1.01"", ""Modalidad"": ""Presencial"", ""Horario"": ""Jue. 07:00 - 09:00"", ""Dia"": ""Jue"", ""Hora_inicio"": ""07:00"", ""Hora_fin"": ""09:00"", ""Frecuencia"": ""Semana General"", ""Ubicacion"": ""UTEC-BA M604(30)"", ""Vacantes"": 30, ""Matriculados"": 30, ""Docente"": ""Nina Choquehuayta, Wilder "", ""Correo"": ""wnina@utec.edu.pe""}, {""Seccion"": 1, ""Grupo"": ""LABORATORIO 1.01"", ""Modalidad"": ""Presencial"", ""Horario"": ""Vie. 10:00 - 12:00"", ""Dia"": ""Vie"", ""Hora_inicio"": ""10:00"", ""Hora_fin"": ""12:00"", ""Frecuencia"": ""Semana General"", ""Ubicacion"": ""UTEC-BA M604(30)"", ""Vacantes"": 30, ""Matriculados"": 30, ""Docente"": ""Nina Choquehuayta, Wilder "", ""Correo"": ""wnina@utec.edu.pe""}, {""Seccion"": 1, ""Grupo"": ""TEORÍA 1"", ""Modalidad"": ""Presencial"", ""Horario"": ""Lun. 11:00 - 13:00"", ""Dia"": ""Lun"", ""Hora_inicio"": ""11:00"", ""Hora_fin"": ""13:00"", ""Frecuencia"": ""Semana General"", ""Ubicacion"": ""UTEC-BA A901(42)"", ""Vacantes"": 30, ""Matriculados"": 30, ""Docente"": ""Nina Choquehuayta, Wilder "", ""Correo"": ""wnina@utec.edu.pe""}]"


    # Primary Key cod_curso + seccion_key
    cod_curso = Column(String, primary_key=True, index=True)
    curso = Column(String, nullable=False)
    seccion_key = Column(String, primary_key=True, index=True)
    horarios = Column(String, nullable=False)  # JSON string


    
    def __repr__(self):
        return f"<Seccion(cod_curso='{self.cod_curso}', nombre='{self.curso}')>"
