import pandas as pd

data = pd.read_csv('df_matricula.csv')

set_2019_1_as_limit = data[data['PER_MATRICULA'] <= '2019-01'].copy()

set_2019_1_as_limit.to_csv('df_matricula_1.csv', index=False)