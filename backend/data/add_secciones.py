import pandas as pd


secciones = pd.read_csv('unitrack-horario.csv')
cursos = pd.read_csv('df_curso.csv')

print(secciones.head())
print(cursos.head())
# eliminar las tuplas de seccion que no estan en curso
secciones = secciones[secciones['cod_curso'].isin(cursos['COD_CURSO'].str.strip().str.upper())]

secciones.to_csv('unitrack-secciones.csv', index=False)