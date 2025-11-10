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


# la lista de la columna "PREREQUISITO" pasar de nombre -> cod

dict_nombre_a_cod = {}
for _, row in data.iterrows():
    dict_nombre_a_cod[row['curso'].strip().upper()] = row['COD_CURSO']

dict_nombre_a_cod['300 PTS. RANKING DE INGLES'] = '300IN'
dict_nombre_a_cod['400 PTS. RANKING DE INGLES'] = '400IN'
dict_nombre_a_cod['100 CREDITOS APROBADOS'] = '100CR'



no_map = []


def _map_prereq_to_codes(prereq):
    print("procesando prereq:", prereq)
    if pd.isna(prereq):
        return ""
    s = str(prereq).strip()
    print(s)
    if s == "" or s.upper() == "NAN":
        return ""
    if s.startswith('[') and s.endswith(']'):
        s = s[1:-1]
    nombres = [x.strip()[1:-1] for x in s.split(',') if x.strip() != ""]
    print(nombres)
    for i in nombres:
        if not dict_nombre_a_cod.get(i):
            no_map.append(i)
            print("No se encontró código para:", i)
    codigos = [dict_nombre_a_cod.get(nombre, "") for nombre in nombres]
    codigos = [c for c in codigos if c]  # eliminar vacíos
    print(codigos)
    return '[' + ', '.join(codigos) + ']'

# Añadir columna nueva sin modificar la original
data['PREREQUISITO_COD'] = data['PREREQUISITO'].apply(_map_prereq_to_codes)

print("No mapeados:", no_map)



data.to_csv('df_curso_final.csv', index=False, encoding='utf-8')

