
from sqlalchemy.orm import Session


def verificar_cursos_alumno(cod_alumno: int, cod_cursos: list[int], db: Session) -> bool:
    # Lógica para verificar si los cursos pueden ser llevados por el alumno
    return True  # Placeholder, implementar la lógica real