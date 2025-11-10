"""
Modelo ORM para la tabla Estudiante
Tabla estática (se crea después del registro)
"""

from sqlalchemy import Column, String, Boolean, Integer
from app.db.database import Base


class Alumno(Base):
    """
    Modelo de Alumno
    Almacena información personal y académica del alumno
    """
    __tablename__ = "alumno"

    # columnas: COD_PERSONA,NOMBRE,APELLIDO,CARRERA,SEXO,PER_INGRESO,ESTADO_CIVIL,TIPO_COLEGIO,PTJE_INGRESO,BECA_VIGENTE,DEPARTAMENTO_PRO,PROVINCIA_PRO,DISTRITO_PRO,DEPARTAMENTO_RES,PROVINCIA_RES,DISTRITO_RES,CONTRASENIA,nombre,apellido,carrera
    # ejepmlo de tupla: 33277,Esteban,Peña,Computer Science,M,2017-01,S,Privada Particular,143.0,1,AREQUIPA,AREQUIPA,AREQUIPA,AREQUIPA,AREQUIPA,PAUCARPATA,DPD_33277,Esteban,Peña,Computer Science

    # Primary Key
    cod_persona = Column(String(10), primary_key=True, index=True, nullable=False)

    # Información personal
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    carrera = Column(String(100), nullable=True)
    sexo = Column(String(1), nullable=True)  # M/F/O
    per_ingreso = Column(String(7), nullable=True)  # Formato: AAAA-MM
    estado_civil = Column(String(20), nullable=True)  # Soltero, Casado, etc.
    tipo_colegio = Column(String(50), nullable=True)  # Público, Privado, etc.
    ptje_ingreso = Column(Integer, nullable=True)  # Puntaje de ingreso a la universidad
    beca_vigente = Column(Boolean, nullable=True)  # True/False
    departamento_pro = Column(String(50), nullable=True)  # Departamento de procedencia
    provincia_pro = Column(String(50), nullable=True)  # Provincia de procedencia
    distrito_pro = Column(String(50), nullable=True)  # Distrito de procedencia
    departamento_res = Column(String(50), nullable=True)  # Departamento de residencia
    provincia_res = Column(String(50), nullable=True)  # Provincia de residencia
    distrito_res = Column(String(50), nullable=True)  # Distrito de residencia
    contrasenia = Column(String(100), nullable=False)  # Contraseña hashed


    def __repr__(self):
        return f"<Estudiante(cod_persona='{self.cod_persona}', periodo='{self.per_ingreso}')>"
    
    def verificar_contrasenia(self, contrasenia_input: str) -> bool:
        """
        Verifica si la contraseña ingresada coincide con la almacenada.
        Aquí se puede implementar hashing si es necesario.
        """
        return self.contrasenia == contrasenia_input
