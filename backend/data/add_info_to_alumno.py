import csv
import random
from pathlib import Path
from datetime import datetime
import pandas as pd

# add_info_to_alumno.py
# Abre df_estudiante.csv (en la misma carpeta), añade columnas 'NOMBRE', 'APELLIDO' con datos ficticios
# y añade columna 'CARRERA' con valor "Computer Science" para todos.
# Guarda el CSV (hace una copia de seguridad antes).



# Semilla para reproducibilidad
random.seed(42)

# Listas de NOMBREs y APELLIDOs ficticios
MALE_FIRST_NAMES = [
    "Alejandro", "Carlos", "Diego", "Mateo", "Javier", "Andrés", "Fernando", "Ricardo",
    "Mario", "Pablo", "Nicolás", "Luis", "Sergio", "Roberto", "Hugo", "Antonio",
    "Miguel", "Bruno", "Rafael", "Samuel", "Esteban", "Enrique", "Marcos", "César",
    "Rodrigo", "Tomás", "Iván", "Agustín", "Fabián"
]

FEMALE_FIRST_NAMES = [
    "María", "Lucía", "Sofía", "Valentina", "Camila", "Isabella", "Paula", "Julia",
    "Gabriela", "Adriana", "Elena", "Natalia", "Daniela", "Martina", "Victoria",
    "Catalina", "Alejandra", "Ángela", "Mía", "Renata", "Carolina", "Olivia",
    "Emilia", "Lara", "Manuela", "Leticia", "Belén", "Inés"
]

LAST_NAMES = [
    "García", "Rodríguez", "Martínez", "López", "González", "Hernández", "Pérez",
    "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Vargas", "Ramos", "Muñoz",
    "Castillo", "Romero", "Herrera", "Silva", "Ortiz", "Cruz", "Morales", "Delgado",
    "Jiménez", "Peña", "León", "Aguilar", "Rojas", "Contreras", "Navarro", "Domínguez",
    "Gutiérrez", "Márquez", "Maldonado", "Paredes", "Vega", "Soto", "Campos", "Cabrera",
    "Salazar", "Molina", "Bravo", "Duarte", "Pizarro", "Villalobos", "Fuentes", "Espinoza",
    "Bustamante", "Cortés", "Valenzuela", "Coronado", "Cárdenas", "Benítez", "Ayala",
    "Acosta", "Olivares", "Sáenz", "Roldán", "Figueroa"
]

def main():
    csv_path = "df_estudiante.csv"

    # Leer CSV
    df = pd.read_csv(csv_path)

    n = len(df)

    # Detectar columna de sexo (soporta 'sexo', 'SEXO', 'Sexo')
    sex_col = 'SEXO'
    sexo_values = df[sex_col].tolist()

    print( sexo_values[:10] )

    def pick_name_by_sex(sex_val):
        s = str(sex_val).strip().upper()
        if s.startswith('M'):
            return random.choice(MALE_FIRST_NAMES)
        if s.startswith('F'):
            return random.choice(FEMALE_FIRST_NAMES)
        # fallback si no hay sexo claro
        return random.choice(MALE_FIRST_NAMES + FEMALE_FIRST_NAMES)

    # Si ya existen columnas, las rellenamos solo donde estén vacías; si no existen, las creamos.
    if 'NOMBRE' not in df.columns:
        df['NOMBRE'] = [pick_name_by_sex(sexo_values[i]) for i in range(n)]
    else:
        df['NOMBRE'] = [
            v if (not (pd.isna(v) or str(v).strip() == "")) else pick_name_by_sex(sexo_values[i])
            for i, v in enumerate(df['NOMBRE'])
        ]

    if 'APELLIDO' not in df.columns:
        df['APELLIDO'] = [random.choice(LAST_NAMES) for _ in range(n)]
    else:
        df['APELLIDO'] = [
            v if (not (pd.isna(v) or str(v).strip() == "")) else random.choice(LAST_NAMES)
            for v in df['APELLIDO']
        ]

    # Añadir/establecer CARRERA
    df['CARRERA'] = "Computer Science"

    # Coloca el NOMBRE APELLIDO y CARRERA en el 2do, tercero y cuarto lugar respectivamente
    cols = df.columns.tolist()
    cols.remove('NOMBRE')
    cols.remove('APELLIDO')
    cols.remove('CARRERA')
    df = df[[cols[0], 'NOMBRE', 'APELLIDO', 'CARRERA'] + cols[1:]]
    

    # quitar a los que entrarons despues de 2019-1
    set_2019_1_as_limit = df[(df['PER_INGRESO'] >= '2016-01') & (df['PER_INGRESO'] <= '2019-01')].copy()
    print(set_2019_1_as_limit.head())


    # join con 3.data_desercion_CCOMP.csv
    desercion_path ="3.data_desercion_CCOMP.csv"

    df_desercion = pd.read_csv(
        desercion_path,
        sep=';',              # delimitador correcto
        quotechar='"',        # campos entre comillas
        encoding='latin1'    # compatible con acentos
        # on_bad_lines='skip'   # ignora líneas problemáticas (por si acaso)
    )

    #eliminar en set_2019_1_as_limit si en df_desercion el cod_persona tiene COD_PLAN diferente a 71, sin añadir nuevas columnas
    set_2019_1_as_limit = set_2019_1_as_limit.merge(
        df_desercion[['COD_PERSONA', 'COD_PLAN']],
        on='COD_PERSONA',
        how='left',
        suffixes=('', '_desercion')
    )
    print(set_2019_1_as_limit['COD_PLAN'].unique())
    set_2019_1_as_limit = set_2019_1_as_limit[set_2019_1_as_limit['COD_PLAN'] == 79]
    set_2019_1_as_limit = set_2019_1_as_limit.drop(columns=['COD_PLAN'])
    #drop duplicates based on COD_PERSONA
    set_2019_1_as_limit = set_2019_1_as_limit.drop_duplicates(subset=['COD_PERSONA'])

    new_path = "df_estudiante_final.csv"

    # Guardar el CSV actualizado con el NOMBRE original
    set_2019_1_as_limit.to_csv(new_path, index=False, quoting=csv.QUOTE_MINIMAL)



if __name__ == "__main__":
    main()