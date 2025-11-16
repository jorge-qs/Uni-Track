
import ast
import csv
import json as js



def str_to_dict(str: str) -> dict:
        """Convertir cadena de diccionario a dict"""
        if not str:
            return {}
        try:
            parsed = ast.literal_eval(str)
            if isinstance(parsed, dict):
                return parsed
        except (ValueError, SyntaxError):
            pass
        # Fallback: intentar con json
        try:
            parsed = js.loads(str)
            if isinstance(parsed, dict):
                return parsed
        except js.JSONDecodeError:
            pass
        return {}

def str_to_list_simple(prereq_str: str) -> list[str]:
    """Convertir cadena separada por comas a lista"""
    if not prereq_str:
        return []
    prereq_str = prereq_str[1:-1]  # eliminar corchetes si existen
    return [s.strip() for s in prereq_str.split(",") if s.strip()]

def str_to_list(prereq_str: str) -> list[str]:
    """Convertir cadena de prerequisitos a lista, manejando comillas y formatos variados"""
    if not prereq_str:
        return []
    if isinstance(prereq_str, (list, tuple)):
        return [str(x) for x in prereq_str]

    # Primero intentar parsear expresiones Python seguras como "['a','b,c','d']"
    try:
        parsed = ast.literal_eval(prereq_str)
        if isinstance(parsed, (list, tuple)):
            return [str(x) for x in parsed]
    except (ValueError, SyntaxError):
        pass

    # Si falla, usar csv.reader para respetar comillas que contienen comas
    try:
        row = next(csv.reader([prereq_str], skipinitialspace=True))
        return [s.strip().strip("\"'") for s in row if s.strip()]
    except Exception:
        # Fallback final: dividir por coma simple
        return [s.strip().strip("\"'") for s in prereq_str.split(",") if s.strip()]
    