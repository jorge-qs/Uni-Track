# Guía de Instalación - Modelos ML (rama-modelos)

## Para desarrolladores que pulleen esta rama

### ✅ Pasos para ejecutar el proyecto

1. **Pull de la rama**:
   ```bash
   git checkout rama-modelos
   git pull origin rama-modelos
   ```

2. **Backend - No requiere instalación adicional**:
   Los modelos ML ya están incluidos en el repositorio:
   - `backend/app/modelo_produccion_clasificador.pkl` (5.0 MB)
   - `backend/app/modelo_produccion_x_matricula.pkl` (2.2 MB)
   - `backend/app/cursos_analisis_grafo.csv`
   - `backend/app/predictor_nota_data.csv`

   Las dependencias ya están en `requirements.txt` (pandas, numpy, joblib, scikit-learn).

3. **Iniciar backend**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

   Deberías ver en consola:
   ```
   OK - Modelo clasificador cargado exitosamente
   OK - Modelo de prediccion por matricula cargado exitosamente
   Sistema de recomendacion cargado exitosamente
   ```

4. **Frontend - No requiere cambios**:
   ```bash
   cd frontend
   npm install  # solo si es primera vez
   npm run dev
   ```

### ✅ Verificar que todo funciona

**Test rápido con curl**:
```bash
# Predicción por matrícula
curl -X POST http://localhost:8000/api/v1/prediccion/predecir-por-matricula \
  -H "Content-Type: application/json" \
  -d '{"cod_persona":"35086","codigos_cursos":["CS272","CS312"],"per_matricula":"2025-01"}'

# Esperado: Notas predichas diferentes (no siempre 14.0)
```

### 🔧 Resolución de problemas

**Si los modelos no cargan**:
- Verifica que los archivos `.pkl` estén en `backend/app/`
- Verifica que los `.csv` estén en `backend/app/`
- Si faltan, descárgalos del repositorio

**Si ves "WARNING - No hay datos para..."**:
- Es normal, el sistema usa datos históricos cuando no encuentra el período exacto
- Las predicciones seguirán funcionando

### 📊 Nuevas funcionalidades

1. **Predicción por Matrícula**: Considera todos los cursos seleccionados para predicciones más precisas
2. **Recomendador de Horario**: Botón morado "Recomendar Mejor Horario" en Calendario Tentativo
3. **Notas Predichas en Popup**: Al hacer clic en un curso, verás 2 predicciones (individual y con matrícula)

### 🐳 Uso con Docker

**Docker Compose funciona perfectamente sin cambios adicionales**:

```bash
# Pull de la rama
git checkout rama-modelos
git pull origin rama-modelos

# Iniciar con Docker
docker-compose up --build

# Los modelos .pkl se cargarán automáticamente desde ./backend
```

**Verificar que funciona**:
```bash
# Ver logs del backend
docker-compose logs backend

# Deberías ver:
# "OK - Modelo clasificador cargado exitosamente"
# "OK - Modelo de prediccion por matricula cargado exitosamente"
# "Sistema de recomendacion cargado exitosamente"
```

**¿Por qué funciona?**
- `docker-compose.yml` monta `./backend:/app` (línea 28)
- Los archivos `.pkl` están en `./backend/app/` en tu máquina
- Docker los monta automáticamente en el contenedor
- No requiere configuración adicional ✅

### 📚 Documentación completa

Ver `INTEGRACION_MODELOS_ML.md` para detalles técnicos completos.
