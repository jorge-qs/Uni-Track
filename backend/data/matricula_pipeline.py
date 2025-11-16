import pandas as pd

data = pd.read_csv('df_matricula.csv')


# filter rows where PER_MATRICULA is less than or equal to '2019-01'
new_data = data[data['PER_MATRICULA'] <= '2019-01'].copy()

new_data.to_csv('df_matricula_1.csv', index=False)

estudiante = pd.read_csv('df_estudiante_final.csv')

#verificar los cod_persona en new_data esten en estudiante 
filtered_data = new_data[new_data['COD_PERSONA'].isin(estudiante['COD_PERSONA'])].copy()

filtered_data.to_csv('df_matricula_1.csv', index=False)