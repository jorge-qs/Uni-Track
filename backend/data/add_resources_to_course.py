import pandas as pd

data = pd.read_csv('df_curso_final.csv')
resources = pd.read_csv('recursos_recomendados_cursos_descripcion.csv')

print(data.columns)
print(resources.columns)

# headers: ['curso', 'recurso_1', 'recurso_2', 'recurso_3', 'recurso_4']
# dict: curso -> [recurso_1, recurso_2, recurso_3, recurso_4]
resource_dict = {}

for _, row in resources.iterrows():
    curso = row['curso']
    recs = []
    for i in range(1, 5):
        rec = row[f'recurso_{i}']
        if pd.notna(rec) and rec.strip() != "":
            recs.append(rec.strip())
    resource_dict[curso] = recs

print(resource_dict)

data['resources'] = data['curso'].map(resource_dict).apply(lambda x: x if isinstance(x, list) else [])

data['descripcion'] = resources['descripcion'].reindex(data.index).values

# Guardar resultado en CSV
data.to_csv('df_curso_final_con_recursos.csv', index=False, encoding='utf-8')