import pandas as pd

data = pd.read_csv('df_curso.csv')
data2 = pd.read_csv('malla_curricular_2016.csv')

# Normalizar códigos para evitar problemas de mayúsculas/espacios
data['COD_CURSO'] = data['COD_CURSO'].astype(str).str.strip().str.upper()
data2['CODIGO'] = data2['CODIGO'].astype(str).str.strip().str.upper()

# Hacer el join usando los códigos; left para conservar todos los cursos del primer archivo
data = data.merge(data2, left_on='COD_CURSO', right_on='CODIGO', how='left', suffixes=('_curso', '_malla'))


# curso_curso -> nombre del curso, usa rename
data = data.rename(columns={'CURSO_curso': 'curso',
                            'CREDITOS_curso': 'creditos'})

print(data.columns)

data = data.drop(columns=['CURSO_malla'])
data = data.drop(columns=['CREDITOS_malla'])
data = data.drop(columns=['HRS_CURSO'])
data = data.drop(columns=['TIPO_CURSO'])
data = data.drop(columns=['SEM'])
data = data.drop(columns=['CODIGO'])

# Guardar resultado en CSV


data.to_csv('df_curso_final.csv', index=False, encoding='utf-8')

