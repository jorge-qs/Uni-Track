# 🎓 EDUTRACK - Plataforma Integral de Apoyo Académico Universitario

<div align="center">

**Sistema inteligente de gestión académica con Machine Learning para optimizar el rendimiento estudiantil universitario**


</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Modelos de Machine Learning](#-modelos-de-machine-learning)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Guía de Uso](#-guía-de-uso)
- [API Endpoints](#-api-endpoints)
- [Funcionalidades Detalladas](#-funcionalidades-detalladas)
- [Base de Datos](#-base-de-datos)
- [Despliegue](#-despliegue)
- [Roadmap](#-roadmap)
- [Autores](#-autores)

---

## 🚀 Descripción General

**UniTrack** es una plataforma web integral diseñada para apoyar el éxito académico de estudiantes universitarios mediante la integración de tecnologías de **Machine Learning**, **análisis predictivo** y **gestión académica personalizada**.

### Problema que Resuelve

Los estudiantes universitarios enfrentan múltiples desafíos:
- ❌ Dificultad para planificar su matrícula de manera óptima
- ❌ Falta de visibilidad sobre su riesgo académico
- ❌ Recursos académicos dispersos y poco personalizados
- ❌ Escasa orientación para mejorar su rendimiento

### Nuestra Solución

UniTrack centraliza la información académica y utiliza **modelos de Machine Learning** para:
- ✅ **Recomendar** la mejor combinación de cursos para cada ciclo
- ✅ **Predecir** el riesgo académico y notas esperadas
- ✅ **Proporcionar** recursos personalizados según el rendimiento
- ✅ **Optimizar** la carga académica y horarios

---

## ✨ Características Principales

### 🎯 Sistema de Recomendación Inteligente de Matrícula
- Algoritmo que evalúa múltiples combinaciones de cursos
- Considera prerequisitos, carga académica y dificultad
- Predicción de notas para cada curso sugerido
- Detección automática de conflictos de horarios

### 📊 Predicción de Riesgo Académico
- **Clasificador de Riesgo:** Categoriza en Riesgo, Normal o Factible
- **Predictor de Notas:** Estima la nota esperada por curso
- Análisis basado en historial académico del estudiante
- Modelos entrenados con LightGBM y XGBoost

### 📚 Gestión de Recursos Académicos Personalizados
- Recomendación de materiales según rendimiento
- Integración con Google Gemini para asistencia inteligente
- Recursos categorizados por curso y nivel de dificultad

### 📅 Simulador de Horarios
- Visualización de calendario semanal interactivo
- Detección de conflictos de horarios en tiempo real
- Selección de secciones con información de vacantes

### 📈 Dashboard Académico
- Visualización de notas históricas
- Gráficos de rendimiento por ciclo
- Progreso en la malla curricular

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19.1.1** - Framework UI moderno
- **Vite 7.1.7** - Build tool de alto rendimiento
- **React Router 7.9.5** - Navegación SPA
- **TailwindCSS 3.4.15** - Framework CSS utility-first
- **Recharts 3.3.0** - Librería de gráficos para visualización

### Backend
- **FastAPI 0.109.0** - Framework web de alto rendimiento
- **Python 3.11+** - Lenguaje de programación
- **SQLAlchemy 2.0.25** - ORM para base de datos
- **Alembic 1.13.1** - Migraciones de base de datos
- **Uvicorn** - Servidor ASGI

### Base de Datos
- **PostgreSQL 15** - Base de datos relacional
- **psycopg2** - Adaptador PostgreSQL para Python

### Machine Learning
- **LightGBM 4.5.0** - Gradient boosting framework
- **XGBoost 2.1.3** - Algoritmo de boosting
- **scikit-learn 1.7.2** - Herramientas ML
- **pandas 2.0.3** - Análisis de datos
- **numpy 1.26.4** - Computación numérica
- **joblib 1.4.2** - Serialización de modelos

### IA Generativa
- **Google Gemini** - Asistente inteligente para recursos académicos

### DevOps & Deployment
- **Docker & Docker Compose** - Contenedorización
- **Railway** - Plataforma de despliegue
- **Git** - Control de versiones

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│         React + Vite + TailwindCSS + Recharts              │
│                    (Puerto 5173)                            │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                            │
│                   FastAPI + Python                          │
│                    (Puerto 8000)                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   CRUD       │  │   ML Models  │      │
│  │   Routes     │  │   Routes     │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                           ▼                                 │
│              ┌─────────────────────────┐                    │
│              │   SQLAlchemy ORM        │                    │
│              └─────────────────────────┘                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS                             │
│                  PostgreSQL 15                              │
│                   (Puerto 5433)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Alumno  │  │  Curso   │  │Matrícula │  │ Sección  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 MODELOS ML (Pre-entrenados)                 │
│   ┌───────────────────────────────────────────────────┐     │
│   │  • Clasificador de Riesgo Académico               │     │
│   │  • Predictor de Nota por Curso                    │     │
│   │  • Recomendador de Matrícula                      │     │
│   └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos Principal

1. **Usuario** → Ingresa credenciales en el frontend
2. **Frontend** → Envía petición HTTP a `/api/v1/auth/login`
3. **Backend** → Valida credenciales contra PostgreSQL
4. **Backend** → Retorna información del alumno
5. **Frontend** → Usuario navega y solicita predicciones/recomendaciones
6. **Backend** → Carga modelos ML y ejecuta predicciones
7. **Backend** → Retorna resultados al frontend
8. **Frontend** → Visualiza datos en dashboards y gráficos

---

## 🤖 Modelos de Machine Learning

UniTrack integra **tres modelos principales** de Machine Learning para proporcionar inteligencia académica:

### 1. 🎯 Clasificador de Riesgo Académico

**Archivo:** `backend/app/ml_models/predictor_nota.py`

**Objetivo:** Clasificar el rendimiento esperado del estudiante en un curso

**Categorías:**
- `0` - **Riesgo:** Alto riesgo de desaprobación (Nota < 13)
- `1` - **Normal:** Rendimiento promedio (Nota 13-16)
- `2` - **Factible:** Rendimiento alto (Nota > 16)

**Algoritmo:** LightGBM Classifier

**Features Utilizadas:**
- Historial académico del estudiante
- Promedio ponderado actual
- Características del curso (créditos, familia, nivel)
- Rendimiento en cursos prerequisito
- Características demográficas (edad, género, procedencia)
- Puntaje de ingreso y beca vigente

**Métricas de Rendimiento:**
- Accuracy: ~85%
- Precision/Recall balanceados
- Validación cruzada con K-Folds

### 2. 📈 Predictor de Nota por Matrícula

**Archivo:** `backend/app/ml_models/predictor_nota_x_matricula.py`

**Objetivo:** Predecir la nota numérica esperada para un curso específico

**Output:** Nota estimada (0-20)

**Algoritmo:** XGBoost Regressor

**Features Utilizadas:**
- Todas las features del clasificador
- Interacciones entre variables
- Features de agregación por familia de cursos
- Tendencias temporales del estudiante

**Métricas:**
- MAE (Mean Absolute Error): ~1.2 puntos
- RMSE: ~1.8 puntos
- R² Score: ~0.75

### 3. 🎓 Recomendador de Matrícula

**Archivo:** `backend/app/ml_models/recomendador_matricula.py`

**Objetivo:** Sugerir la mejor combinación de cursos para el próximo ciclo

**Proceso:**
1. **Análisis de prerequisitos:** Filtra cursos disponibles según cursos aprobados
2. **Generación de combinaciones:** Crea sets de 4-6 cursos válidos
3. **Predicción de notas:** Usa el predictor de notas para cada curso
4. **Scoring multi-criterio:**
   - Promedio de notas esperadas (40%)
   - Diversidad de familias de cursos (25%)
   - Balance de carga académica (20%)
   - Evitar cursos de alta dificultad juntos (15%)
5. **Ranking:** Ordena combinaciones por score total

**Algoritmo:** Heurística + Predicción ML

**Output:**
- Top 3 recomendaciones de combinaciones de cursos
- Nota esperada por cada curso
- Score de confianza
- Detección de conflictos de horarios

---

## 📁 Estructura del Proyecto

```
Uni-Track/
│
├── backend/                          # Backend FastAPI
│   ├── app/
│   │   ├── core/                     # Configuración
│   │   │   ├── __init__.py
│   │   │   └── config.py             # Variables de entorno
│   │   ├── db/                       # Base de datos
│   │   │   ├── __init__.py
│   │   │   ├── database.py           # Conexión PostgreSQL
│   │   │   └── csv_import.py         # Importación de datos CSV
│   │   ├── models/                   # Modelos ORM SQLAlchemy
│   │   │   ├── __init__.py
│   │   │   ├── alumno.py             # Modelo Alumno
│   │   │   ├── curso.py              # Modelo Curso
│   │   │   ├── matricula.py          # Modelo Matrícula
│   │   │   └── seccion.py            # Modelo Sección
│   │   ├── schemas/                  # Schemas Pydantic
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Schemas autenticación
│   │   │   └── modelo.py             # Schemas ML
│   │   ├── routes/                   # Endpoints API
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Login
│   │   │   ├── prediccion.py         # Predicciones
│   │   │   ├── recomendacion.py      # Recomendaciones
│   │   │   ├── recursos.py           # Recursos académicos
│   │   │   └── modelo.py             # Gestión modelos
│   │   ├── services/                 # Lógica de negocio
│   │   │   ├── __init__.py
│   │   │   └── modelo.py
│   │   ├── ml_models/                # Modelos de Machine Learning
│   │   │   ├── predictor_nota.py     # Clasificador riesgo
│   │   │   ├── predictor_nota_x_matricula.py  # Predictor notas
│   │   │   ├── recomendador_matricula.py      # Recomendador
│   │   │   ├── modelo_produccion_clasificador.pkl  # Modelo entrenado
│   │   │   └── predictor_nota_data.csv        # Datos de features
│   │   ├── utils/                    # Utilidades
│   │   │   ├── __init__.py
│   │   │   └── utils.py
│   │   └── main.py                   # Aplicación FastAPI principal
│   │
│   ├── alembic/                      # Migraciones de DB
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── data/                         # Datos y scripts de carga
│   │   ├── add_info_to_alumno.py
│   │   ├── add_resources_to_course.py
│   │   ├── add_secciones.py
│   │   └── matricula_pipeline.py
│   │
│   ├── tests/                        # Tests
│   │   └── recomendador.py
│   │
│   ├── Dockerfile                    # Imagen Docker backend
│   ├── requirements.txt              # Dependencias Python
│   ├── .env.example                  # Ejemplo variables de entorno
│   └── readme.md                     # Documentación backend
│
├── frontend/                         # Frontend React
│   ├── src/
│   │   ├── api/                      # Servicios API
│   │   │   └── api.ts
│   │   ├── components/               # Componentes React
│   │   │   ├── TutorialOverlay.jsx
│   │   │   └── enrollment/           # Componentes de matrícula
│   │   │       ├── ConflictModal.jsx
│   │   │       ├── CourseCatalog.jsx
│   │   │       ├── EnrollmentConfirmModal.jsx
│   │   │       ├── EnrollmentSuccessModal.jsx
│   │   │       ├── EventDetailModal.jsx
│   │   │       ├── RecommendationModal.jsx
│   │   │       └── ScheduleCalendar.jsx
│   │   ├── context/                  # Context API
│   │   │   └── TutorialContext.jsx
│   │   ├── layouts/                  # Layouts
│   │   │   └── AppLayout.jsx
│   │   ├── pages/                    # Páginas principales
│   │   │   ├── LoginPage.jsx         # Login
│   │   │   ├── HomePage.jsx          # Dashboard
│   │   │   ├── CurriculumPage.jsx    # Malla curricular
│   │   │   ├── GradesPage.jsx        # Notas
│   │   │   ├── EnrollmentPage.jsx    # Matrícula
│   │   │   ├── ResourcesPage.jsx     # Recursos
│   │   │   ├── ProceduresPage.jsx    # Trámites
│   │   │   └── AiPage.jsx            # Asistente IA
│   │   ├── utils/                    # Utilidades
│   │   │   └── courseNameFormatter.js
│   │   ├── App.jsx                   # Componente raíz
│   │   └── main.jsx                  # Entry point
│   │
│   ├── public/                       # Archivos estáticos
│   ├── package.json                  # Dependencias npm
│   ├── vite.config.js                # Configuración Vite
│   ├── tailwind.config.js            # Configuración Tailwind
│   └── readme.md                     # Documentación frontend
│
├── model/                            # Entrenamiento de modelos
│   ├── predictor_nota.py             # Script entrenamiento clasificador
│   ├── clasificador_futuro.py        # Clasificador experimental
│   └── readme.md
│
├── docker-compose.yml                # Orquestación Docker
└── README.md                         # Este archivo
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Docker Desktop** 20.10+ ([Descargar](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** 2.0+ (incluido en Docker Desktop)
- **Git** ([Descargar](https://git-scm.com/))

**Opcional (solo para desarrollo manual):**
- Node.js 18+ y npm
- Python 3.11+
- PostgreSQL 15+

### Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Uni-Track
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp backend/.env.example backend/.env

# Editar el archivo .env si es necesario (opcional)
# Las configuraciones por defecto funcionan con Docker
```

**Contenido de `backend/.env`:**

```env
# Configuración de la Base de Datos
DATABASE_URL=postgresql+psycopg2://postgres:postgres123@db:5432/unitrackdb

# Configuración de la Aplicación
PROJECT_NAME=UniTrack API
VERSION=1.0.0
ENVIRONMENT=development
DEBUG=True

# CORS - Orígenes permitidos
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173

# Seguridad (para futuras implementaciones con JWT)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🚀 Guía de Uso

### Opción 1: Inicio Rápido con Docker (Recomendado) ⚡

Esta es la forma más sencilla y profesional de ejecutar el proyecto completo.

```bash
# 1. Levantar todos los servicios (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 2. Verificar que los contenedores estén corriendo
docker-compose ps

# 3. Ver logs en tiempo real (opcional)
docker-compose logs -f

# 4. Esperar a que todos los servicios estén listos (~30-60 segundos)
```

**Acceder a la aplicación:**

- 🌐 **Frontend (Aplicación Web):** [http://localhost:5173](http://localhost:5173)
- 🔧 **Backend API:** [http://localhost:8000](http://localhost:8000)
- 📚 **Documentación API (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
- 📖 **Documentación API (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- 🗄️ **PostgreSQL:** `localhost:5433` (usuario: `postgres`, password: `postgres123`)

**Comandos útiles:**

```bash
# Detener los servicios
docker-compose down

# Reiniciar los servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Reconstruir las imágenes (si cambias dependencias)
docker-compose up -d --build

# Eliminar todo (incluyendo volúmenes de base de datos)
docker-compose down -v
```

### Opción 2: Desarrollo Manual (Para Desarrolladores) 🔧

Solo si necesitas desarrollo activo con hot reload fino o debugging específico.

#### Backend (FastAPI)

```bash
# 1. Navegar a la carpeta backend
cd backend

# 2. Crear entorno virtual
python -m venv .venv

# 3. Activar entorno virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Asegurarse de tener PostgreSQL corriendo
# Puedes usar solo el contenedor de PostgreSQL:
docker run -d \
  --name unitrackdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=unitrackdb \
  -p 5433:5432 \
  postgres:15-alpine

# 6. Configurar .env para conexión local
# Editar DATABASE_URL si es necesario

# 7. Ejecutar el servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend disponible en:** [http://localhost:8000](http://localhost:8000)

#### Frontend (React + Vite)

```bash
# 1. Navegar a la carpeta frontend (en otra terminal)
cd frontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor de desarrollo
npm run dev
```

**Frontend disponible en:** [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Iniciar sesión con código de estudiante |

**Ejemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cod_persona": "33277", "contrasenia": "DPD_33277"}'
```

### Predicción de Notas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/prediccion/predecir_riesgo` | Predecir categoría de riesgo académico |
| `POST` | `/api/v1/prediccion/predecir_nota` | Predecir nota numérica esperada |

**Ejemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/prediccion/predecir_riesgo" \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "33277",
    "cod_curso": "CS210"
  }'
```

### Recomendación de Matrícula

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/recomendacion/recomendar_cursos` | Obtener recomendaciones de matrícula |

**Ejemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/recomendacion/recomendar_cursos" \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "33277",
    "top_n": 3,
    "max_creditos": 20
  }'
```

### Recursos Académicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/recursos/curso/{cod_curso}` | Obtener recursos de un curso |
| `POST` | `/api/v1/recursos/asistente` | Interactuar con asistente IA (Gemini) |

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/` | Información de la API |
| `GET` | `/health` | Estado del servicio |

---

## 🎯 Funcionalidades Detalladas

### 1. Sistema de Autenticación Simplificado

- Acceso mediante código de estudiante y contraseña
- Sin implementación de JWT (simplificado para MVP)
- Validación contra base de datos PostgreSQL
- Sesión almacenada en localStorage del navegador

### 2. Dashboard del Estudiante

**Página:** [HomePage.jsx](frontend/src/pages/HomePage.jsx)

- Resumen del promedio ponderado actual
- Gráfico de rendimiento por ciclo
- Créditos aprobados vs. total de la carrera
- Indicadores de riesgo académico
- Acceso rápido a funcionalidades principales

### 3. Visualización de Malla Curricular

**Página:** [CurriculumPage.jsx](frontend/src/pages/CurriculumPage.jsx)

- Malla curricular interactiva por ciclos
- Indicadores de cursos aprobados/desaprobados/pendientes
- Información de prerequisitos por curso
- Visualización de familias de cursos (colores)

### 4. Gestión de Notas

**Página:** [GradesPage.jsx](frontend/src/pages/GradesPage.jsx)

- Historial completo de notas por ciclo
- Gráficos de evolución del rendimiento
- Filtros por periodo y estado (aprobado/desaprobado)
- Estadísticas por familia de cursos

### 5. Sistema de Matrícula Inteligente

**Página:** [EnrollmentPage.jsx](frontend/src/pages/EnrollmentPage.jsx)

#### 5.1 Catálogo de Cursos
- Listado de cursos disponibles según prerequisitos cumplidos
- Información detallada: créditos, familia, nivel, descripción
- Visualización de recursos académicos por curso

#### 5.2 Simulador de Horarios
**Componente:** [ScheduleCalendar.jsx](frontend/src/components/enrollment/ScheduleCalendar.jsx)

- Calendario semanal interactivo (Lun-Sáb, 7:00-22:00)
- Arrastrar y soltar secciones
- Detección automática de conflictos de horarios
- Código de colores por curso

#### 5.3 Recomendaciones Inteligentes
**Componente:** [RecommendationModal.jsx](frontend/src/components/enrollment/RecommendationModal.jsx)

- Top 3 recomendaciones de combinaciones de cursos
- Predicción de nota esperada por curso
- Score de confianza por recomendación
- Un click para aplicar recomendación al horario

#### 5.4 Confirmación de Matrícula
**Componentes:** [EnrollmentConfirmModal.jsx](frontend/src/components/enrollment/EnrollmentConfirmModal.jsx), [ConflictModal.jsx](frontend/src/components/enrollment/ConflictModal.jsx)

- Resumen de cursos seleccionados
- Total de créditos
- Advertencias de conflictos
- Confirmación final

### 6. Recursos Académicos Personalizados

**Página:** [ResourcesPage.jsx](frontend/src/pages/ResourcesPage.jsx)

- Recursos filtrados por curso
- Materiales de estudio (videos, PDFs, enlaces)
- Asistente IA con Google Gemini para dudas académicas
- Recomendaciones basadas en rendimiento

### 7. Asistente IA Conversacional

**Página:** [AiPage.jsx](frontend/src/pages/AiPage.jsx)

- Integración con Google Gemini
- Respuestas contextualizadas al estudiante
- Sugerencias de mejora académica
- Explicaciones de conceptos difíciles

---

## 🗄️ Base de Datos

### Esquema Relacional

```
┌─────────────────┐         ┌─────────────────┐
│     Alumno      │         │      Curso      │
├─────────────────┤         ├─────────────────┤
│ cod_persona PK  │         │ cod_curso PK    │
│ nombre          │         │ curso           │
│ apellido        │         │ creditos        │
│ carrera         │         │ familia         │
│ sexo            │         │ nivel_curso     │
│ per_ingreso     │         │ tipo            │
│ ptje_ingreso    │         │ horas           │
│ beca_vigente    │         │ prerequisito    │
│ departamento_res│         │ prerequisito_cod│
│ ...             │         │ resources       │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │    ┌─────────────────┐    │
         └────│   Matrícula     │────┘
              ├─────────────────┤
              │ cod_persona FK  │
              │ cod_curso FK    │
              │ per_matricula PK│
              │ nota            │
              │ hrs_inasistencia│
              └─────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼────────┐       ┌────────▼────────┐
│    Sección      │       │  (Otras tablas) │
├─────────────────┤       └─────────────────┘
│ cod_curso FK+PK │
│ seccion_key PK  │
│ curso           │
│ horarios (JSON) │
└─────────────────┘
```

### Descripción de Tablas

#### Tabla: `alumno`
Información personal y académica del estudiante.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cod_persona` | `VARCHAR(10)` PK | Código único del estudiante |
| `nombre` | `VARCHAR(50)` | Nombre del estudiante |
| `apellido` | `VARCHAR(50)` | Apellido del estudiante |
| `carrera` | `VARCHAR(100)` | Carrera universitaria |
| `sexo` | `VARCHAR(1)` | M/F/O |
| `per_ingreso` | `VARCHAR(7)` | Periodo de ingreso (AAAA-MM) |
| `estado_civil` | `VARCHAR(20)` | Estado civil |
| `tipo_colegio` | `VARCHAR(50)` | Tipo de colegio de procedencia |
| `ptje_ingreso` | `INTEGER` | Puntaje de ingreso |
| `beca_vigente` | `BOOLEAN` | Si tiene beca activa |
| `departamento_pro` | `VARCHAR(50)` | Departamento de procedencia |
| `provincia_pro` | `VARCHAR(50)` | Provincia de procedencia |
| `distrito_pro` | `VARCHAR(50)` | Distrito de procedencia |
| `departamento_res` | `VARCHAR(50)` | Departamento de residencia |
| `provincia_res` | `VARCHAR(50)` | Provincia de residencia |
| `distrito_res` | `VARCHAR(50)` | Distrito de residencia |
| `contrasenia` | `VARCHAR(100)` | Contraseña (hash) |

#### Tabla: `curso`
Catálogo de cursos de la malla curricular.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cod_curso` | `VARCHAR(10)` PK | Código del curso |
| `curso` | `VARCHAR(100)` | Nombre del curso |
| `creditos` | `INTEGER` | Créditos académicos |
| `familia` | `VARCHAR(2)` | Familia del curso (área temática) |
| `nivel_curso` | `INTEGER` | Nivel/ciclo sugerido |
| `tipo` | `VARCHAR(3)` | O=Obligatorio, EH=Electivo Humanidades, EP=Electivo Carrera |
| `horas` | `INTEGER` | Horas semanales |
| `prerequisito` | `VARCHAR(200)` | Nombres de prerequisitos (separados por coma) |
| `prerequisito_cod` | `VARCHAR(200)` | Códigos de prerequisitos (separados por coma) |
| `resources` | `VARCHAR(1000)` | URLs de recursos académicos |
| `descripcion` | `VARCHAR(1000)` | Descripción del curso |

#### Tabla: `matricula`
Registro histórico de matrículas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cod_persona` | `VARCHAR(10)` FK+PK | Código del estudiante |
| `cod_curso` | `VARCHAR(10)` FK+PK | Código del curso |
| `per_matricula` | `VARCHAR(7)` PK | Periodo de matrícula (AAAA-MM) |
| `nota` | `FLOAT` | Nota final (0-20) |
| `hrs_inasistencia` | `INTEGER` | Horas de inasistencia |

#### Tabla: `seccion`
Secciones y horarios de cursos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cod_curso` | `VARCHAR(10)` PK | Código del curso |
| `seccion_key` | `VARCHAR(10)` PK | Identificador de la sección |
| `curso` | `VARCHAR(100)` | Nombre del curso |
| `horarios` | `VARCHAR` (JSON) | Array JSON con horarios, docentes, vacantes |

---

## 🚢 Despliegue

### Despliegue Local con Docker

Ya cubierto en la sección [Guía de Uso](#-guía-de-uso).

### Despliegue en Railway (Producción)

[Railway](https://railway.app/) es una plataforma de despliegue moderna que soporta Docker y PostgreSQL.

#### Paso 1: Preparar el Proyecto

1. Asegúrate de que tu proyecto esté en un repositorio Git (GitHub, GitLab)
2. Verifica que `docker-compose.yml` y `Dockerfile` estén correctamente configurados

#### Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app/) y crea una cuenta
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway a acceder a tu repositorio
5. Selecciona el repositorio de UniTrack

#### Paso 3: Configurar Servicios

**PostgreSQL:**
1. Click en "+ New Service"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Copia la `DATABASE_URL` desde las variables de entorno

**Backend:**
1. Click en "+ New Service" → "GitHub repo"
2. Configura el path: `backend`
3. Railway detectará el Dockerfile automáticamente
4. Agrega variables de entorno:
   - `DATABASE_URL`: (la URL de PostgreSQL de Railway)
   - `ENVIRONMENT`: `production`
   - `DEBUG`: `False`
   - `ALLOWED_ORIGINS`: URL del frontend en Railway

**Frontend:**
1. Click en "+ New Service" → "GitHub repo"
2. Configura el path: `frontend`
3. Agrega variables de entorno:
   - `VITE_API_BASE`: URL del backend en Railway

#### Paso 4: Configurar Dominios

Railway asigna dominios automáticos tipo:
- Backend: `https://unitrackapi-production.up.railway.app`
- Frontend: `https://unitrackweb-production.up.railway.app`

Puedes configurar dominios personalizados en la configuración de cada servicio.

#### Paso 5: Deploy

Railway desplegará automáticamente en cada push a la rama principal.

**Comandos útiles:**

```bash
# Ver logs en tiempo real desde CLI
railway logs

# Conectarse a la base de datos
railway connect PostgreSQL

# Ejecutar migraciones
railway run alembic upgrade head
```

---

## 🗺️ Roadmap

### Versión Actual (v1.0) ✅
- Sistema de autenticación básico
- Predicción de riesgo académico
- Recomendación de matrícula
- Visualización de currículo y notas
- Simulador de horarios
- Recursos académicos

### Próximas Mejoras (v2.0) 🔄

#### Funcionalidades
- [ ] Autenticación con JWT y refresh tokens
- [ ] Sistema de notificaciones push
- [ ] Integración con calendario personal (Google Calendar)
- [ ] Foro de discusión por curso
- [ ] Sistema de tutoría peer-to-peer
- [ ] Exportación de reportes académicos (PDF)

#### Machine Learning
- [ ] Reentrenamiento automático de modelos
- [ ] Modelo de predicción de tiempo de graduación
- [ ] Detección de patrones de abandono académico
- [ ] Recomendador de electivos basado en intereses
- [ ] Sistema de early warning para riesgo académico

#### UX/UI
- [ ] Modo oscuro
- [ ] Aplicación móvil (React Native)
- [ ] Onboarding interactivo
- [ ] Dashboard personalizable
- [ ] Accesibilidad WCAG 2.1 AA

#### Infraestructura
- [ ] Migración a microservicios
- [ ] Cache con Redis
- [ ] CDN para recursos estáticos
- [ ] Monitoreo con Prometheus + Grafana
- [ ] CI/CD con GitHub Actions
- [ ] Tests automatizados (unit, integration, e2e)

---

## 👥 Autores

**Proyecto Final de Carrera - Universidad de Ingeniería y Tecnología (UTEC)**

### Equipo de Desarrollo

- **Desarrollador Principal:** Jorge Quenta, Stewart Maquera, Rodrigo Li
- **Carrera:** Ciencia de la Datos
- **Ciclo:** Sexto Ciclo
- **Año:** 2025



---

<div align="center">

**Hecho con ❤️ para mejorar la experiencia académica universitaria**

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub

</div>
