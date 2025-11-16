import pandas as pd

data = pd.read_csv('unitrack-secciones.csv')


# headers : cod_curso,curso,Seccion,Grupo,Modalidad,Horario,Frecuencia,Ubicacion,Vacantes,Matriculados,Docente,Correo
# example: CS210,ALGORITMOS Y ESTRUCTURAS DE DATOS,1,TEORÍA 1,Presencial,Lun. 11:00 - 13:00,Semana General,UTEC-BA A901(42),30,30,"Nina Choquehuayta, Wilder ",wnina@utec.edu.pe


json = {}

sec_horario_general = {}

for index, row in data.iterrows():
    print(f"Processing row {index}: {row['curso']} - {row['Seccion']} - {row['Grupo']}")
    if float(row['Grupo'].split()[-1]) % 1 == 0:
        if row['cod_curso'] not in sec_horario_general:
            sec_horario_general[row['cod_curso']]= []
        sec_horario_general[row['cod_curso']].append(row)
    else:
        if row['cod_curso'] not in json:
            json[row['cod_curso']] = {
                'curso': row['curso'],
                'horarios': {}
            }
        print(f"Creating new entry for course {row['cod_curso']}: {row['curso']}")
        if row['Grupo'].split()[-1] not in json[row['cod_curso']]['horarios']:
            json[row['cod_curso']]['horarios'][row['Grupo'].split()[-1]] = []
        json[row['cod_curso']]['horarios'][row['Grupo'].split()[-1]].append({
            'Seccion': row['Seccion'],
            'Grupo': row['Grupo'],
            'Modalidad': row['Modalidad'],
            'Horario': row['Horario'],
            'Dia': row['Horario'].split('.')[0],
            'Hora_inicio': row['Horario'].split('.')[1].split('-')[0].strip(),
            'Hora_fin': row['Horario'].split('-')[1].strip(),
            'Frecuencia': row['Frecuencia'],
            'Ubicacion': row['Ubicacion'],
            'Vacantes': row['Vacantes'],
            'Matriculados': row['Matriculados'],
            'Docente': row['Docente'],
            'Correo': row['Correo']
        })

for cod_curso, rows in sec_horario_general.items():
    if cod_curso not in json:
        json[cod_curso] = {
            'curso': rows[0]['curso'],
            'horarios': {}
        }
        print(f"Creating new entry for course {cod_curso}: {rows[0]['curso']}")
        for row in rows:
            if row['Grupo'].split()[-1] not in json[cod_curso]['horarios']:
                json[cod_curso]['horarios'][row['Grupo'].split()[-1]] = []
            json[cod_curso]['horarios'][row['Grupo'].split()[-1]].append({
                'Seccion': row['Seccion'],
                'Grupo': row['Grupo'],
                'Modalidad': row['Modalidad'],
                'Horario': row['Horario'],
                'Dia': row['Horario'].split('.')[0],
                'Hora_inicio': row['Horario'].split('.')[1].split('-')[0].strip(),
                'Hora_fin': row['Horario'].split('-')[1].strip(),
                'Frecuencia': row['Frecuencia'],
                'Ubicacion': row['Ubicacion'],
                'Vacantes': row['Vacantes'],
                'Matriculados': row['Matriculados'],
                'Docente': row['Docente'],
                'Correo': row['Correo']
            })
    else:
        for row in rows:
            for seccion, horarios in json[cod_curso]['horarios'].items():
                print(f"Adding general schedule to course {cod_curso}, section {seccion}")
                print(f"# comparing {seccion[0]} with {row['Grupo'].split()[-1]}")
                if seccion[0] == row['Grupo'].split()[-1]:
                    json[cod_curso]['horarios'][seccion].append({
                            'Seccion': row['Seccion'],
                            'Grupo': row['Grupo'],
                            'Modalidad': row['Modalidad'],
                            'Horario': row['Horario'],
                            'Dia': row['Horario'].split('.')[0],
                            'Hora_inicio': row['Horario'].split('.')[1].split('-')[0].strip(),
                            'Hora_fin': row['Horario'].split('-')[1].strip(),
                            'Frecuencia': row['Frecuencia'],
                            'Ubicacion': row['Ubicacion'],
                            'Vacantes': row['Vacantes'],
                            'Matriculados': row['Matriculados'],
                            'Docente': row['Docente'],
                            'Correo': row['Correo']
                        })


import json as js
with open('secciones_playground.json', 'w', encoding='utf-8') as f:
    js.dump(json, f, ensure_ascii=False, indent=4)
print("JSON file created: secciones_playground.json")


import pandas as pd

# pasar de json -> csv como [cod_curso, info]

data_for_csv = []
for cod_curso, info in json.items():
    nombre_curso = info['curso']
    ite = 0
    for horario_key, horarios in info['horarios'].items():
        if ite > 4:
            break
        data_for_csv.append({
            'cod_curso': cod_curso,
            'curso': nombre_curso,
            'seccion_key': horario_key,
            'horarios': js.dumps(horarios, ensure_ascii=False)
        })
        ite += 1

df = pd.DataFrame(data_for_csv)
df.to_csv('secciones_playground.csv', index=False, encoding='utf-8')
print("CSV file created: secciones_playground.csv")
