"""
Carga inicial de datos desde CSV como tablas nuevas.

- Crea/actualiza tablas "curso", "alumno" y "matricula" desde:
  data/df_curso_final.csv, data/df_estudiante.csv, data/df_matricula.csv
- No requiere pandas; usa csv + SQLAlchemy Core.
- Si la tabla ya existe, se vacía y se recarga para mantener idempotencia.
"""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Dict, List, Tuple, Any

from sqlalchemy import (
    MetaData,
    Table,
    Column,
    String,
    Integer,
    Float,
    Boolean,
    inspect,
)
from sqlalchemy.engine import Engine


def _infer_type(values: List[str]):
    """Inferir tipo SQLAlchemy simple a partir de valores de texto."""
    clean = [v for v in values if v is not None and str(v).strip() != ""]
    if not clean:
        return String()  # por defecto

    def is_bool(v: str) -> bool:
        s = str(v).strip().lower()
        return s in {"true", "false", "1", "0", "t", "f"}

    def is_int(v: str) -> bool:
        try:
            # Evitar floats representados como enteros
            if "." in str(v):
                return False
            int(str(v))
            return True
        except Exception:
            return False

    def is_float(v: str) -> bool:
        try:
            float(str(v))
            return True
        except Exception:
            return False

    if all(is_bool(v) for v in clean):
        return Boolean()
    if all(is_int(v) for v in clean):
        return Integer()
    if all(is_float(v) for v in clean):
        return Float()
    return String()


def _read_csv_preview(csv_path: Path, max_rows: int = 100) -> Tuple[List[str], List[Dict[str, Any]]]:
    """Leer cabeceras y un subconjunto de filas para inferencia de tipos."""
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        rows = []
        for i, row in enumerate(reader):
            rows.append(row)
            if i + 1 >= max_rows:
                break
    return headers, rows


def _ensure_table(engine: Engine, table_name: str, headers: List[str], preview_rows: List[Dict[str, Any]]) -> Table:
    """Crear la tabla si no existe; si existe, devolver referencia Table.

    Usa inferencia de tipos básica con base en las primeras filas.
    """
    inspector = inspect(engine)
    metadata = MetaData()

    existing = inspector.has_table(table_name)
    if existing:
        # Reflejar estructura existente
        metadata.reflect(bind=engine, only=[table_name])
        return metadata.tables[table_name]

    # Preparar valores por columna para inferencia
    col_samples: Dict[str, List[str]] = {h: [] for h in headers}
    for row in preview_rows:
        for h in headers:
            col_samples[h].append(row.get(h))

    columns = [Column(h.lower(), _infer_type(col_samples[h])) for h in headers]
    table = Table(table_name, metadata, *columns)
    metadata.create_all(bind=engine, tables=[table])
    return table


def _normalize_value(val: Any, col_type) -> Any:
    if val is None:
        return None
    s = str(val).strip()
    if s == "":
        return None
    # Booleanos comunes
    if isinstance(col_type, Boolean):
        return s.lower() in {"true", "1", "t"}
    if isinstance(col_type, Integer):
        try:
            return int(float(s))
        except Exception:
            return None
    if isinstance(col_type, Float):
        try:
            return float(s)
        except Exception:
            return None
    # String por defecto
    return s


def _load_csv_into_table(engine: Engine, table: Table, csv_path: Path) -> None:
    """Vaciar e insertar todas las filas del CSV en la tabla dada."""
    # Cargar todas las filas (streaming simple)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        col_types = {c.name: c.type for c in table.columns}

        rows: List[Dict[str, Any]] = []
        for row in reader:
            item: Dict[str, Any] = {}
            for k, v in row.items():
                col_name = k.lower()
                if col_name in col_types:
                    item[col_name] = _normalize_value(v, col_types[col_name])
            rows.append(item)

    with engine.begin() as conn:
        # Vaciar tabla para recarga idempotente
        conn.execute(table.delete())
        if rows:
            conn.execute(table.insert(), rows)


def import_csv_tables(engine: Engine) -> None:
    """Crear/actualizar tablas y cargar CSVs estándar en data/.

    - df_curso_final.csv  -> curso
    - df_estudiante_final.csv    -> alumno
    - df_matricula.csv     -> matricula
    - unitrack-secciones.csv -> seccion
    """
    base_path = Path(__file__).resolve().parents[2] / "data"
    mapping = {
        "df_curso_final_con_recursos.csv": "curso",
        "df_estudiante_final.csv": "alumno",
        "df_matricula.csv": "matricula",
        "unitrack-secciones.csv": "seccion",
    }
    
    for fname, tname in mapping.items():
        csv_path = base_path / fname
        if not csv_path.exists():
            # Si falta un CSV, continuar con los demás
            raise FileNotFoundError(f"Archivo CSV no encontrado: {csv_path}")
        

        headers, preview = _read_csv_preview(csv_path)
        if not headers:
            continue

        table = _ensure_table(engine, tname, headers, preview)
        _load_csv_into_table(engine, table, csv_path)

