
# 🧩 Backend y Base de Datos — Plataforma Integral de Apoyo Académico Universitario (UniTrack)

## 🚀 Descripción General

Este módulo backend constituye el **núcleo funcional** de la plataforma **UniTrack**, diseñada para apoyar el éxito académico universitario mediante la integración de:
- Un **recomendador inteligente de matrícula**.
- Un **predictor de riesgo/desaprobación**.
- Un **gestor de recursos académicos personalizados**.

El backend expone APIs REST desarrolladas en **FastAPI**, con persistencia en **PostgreSQL**, organizadas según un modelo relacional centrado en el estudiante.

---

## 🏗️ Arquitectura General

**Stack principal:**
- **Backend:** FastAPI (Python 3.11+)
- **Base de datos:** PostgreSQL
- **ORM:** SQLAlchemy + Alembic (migraciones)
- **Contenedorización:** Docker / Railway
- **Documentación automática:** Swagger UI (`/docs`)

**Estructura de carpetas propuesta:**
```
backend/
│── app/
│   ├── core/          # Configuración (settings, conexión DB)
│   ├── models/        # Definición ORM (Estudiante, Curso, Matricula)
│   ├── schemas/       # Pydantic (serialización)
│   ├── routes/        # Endpoints API (auth, estudiante, curso, matricula)
│   ├── services/      # Lógica de negocio (recomendador, predictor, recursos)
│   ├── db/            # Sesión y migraciones
│   ├── utils/         # Helpers y validaciones
│── tests/
│── Dockerfile
│── requirements.txt
│── README.md
```

---

## 🧱 Diseño de Base de Datos

### Entidades Principales

#### 1️⃣ Estudiante
Tabla estática (se crea después del registro).

| Atributo | Tipo | Descripción |
|-----------|------|-------------|
| **cod_persona** | `VARCHAR(10)` | PK, identificador único del estudiante |
| sexo | `VARCHAR(1)` | M/F/O |
| per_ingreso | `VARCHAR(10)` | Periodo de ingreso (e.g. 2022-1) |
| estado_civil | `VARCHAR(20)` | Estado civil |
| tipo_colegio | `VARCHAR(30)` | Público / Privado |
| puntaje_ingreso | `FLOAT` | Nota de ingreso |
| beca_vigente | `BOOLEAN` | True si posee beca activa |
| fecha_nacimiento | `DATE` | Fecha de nacimiento |
| departamento_pro / provincia_pro / distrito_pro | `VARCHAR(50)` | Procedencia |
| departamento_res / provincia_res / distrito_res | `VARCHAR(50)` | Residencia actual |

---

#### 2️⃣ Curso
Tabla estática (desde la creación de la malla).

| Atributo | Tipo | Descripción |
|-----------|------|-------------|
| **cod_curso** | `VARCHAR(10)` | PK, código del curso |
| curso | `VARCHAR(100)` | Nombre del curso |
| creditos | `INT` | Créditos académicos |
| tipo_curso | `VARCHAR(20)` | Obligatorio / Electivo |
| hrs_curso | `INT` | Horas semanales |
| familia | `VARCHAR(50)` | Agrupación temática |
| cluster | `VARCHAR(50)` | Nivel de dificultad / categoría |
| nivel_curso | `INT` | Nivel académico o ciclo sugerido |

---

#### 3️⃣ Matrícula
Tabla dinámica (registro histórico de matrícula).

| Atributo | Tipo | Descripción |
|-----------|------|-------------|
| **per_matricula** | `VARCHAR(10)` | PK parcial (año-ciclo: 2024-1) |
| **cod_persona** | `FK → Estudiante.cod_persona` | |
| **cod_curso** | `FK → Curso.cod_curso` | |
| nota | `FLOAT` | Calificación final |
| hrs_inasistencia | `INT` | Horas de inasistencia |
| estado | `VARCHAR(20)` | Aprobado / Desaprobado / Retirado |
| tipo_de_ciclo | `VARCHAR(20)` | Regular / Verano / Extraordinario |

---

## 🔐 Autenticación Simplificada

Inicialmente el sistema **no utiliza contraseñas ni JWT**.  
El acceso al sistema se realiza ingresando el **código del estudiante (`cod_persona`)**.

**Ejemplo de flujo:**
1. El usuario ingresa su código en `/login`.
2. El backend valida si existe en la tabla `Estudiante`.
3. Si es válido, se guarda en sesión temporal (cookie o token local).

> 🔸 Esta autenticación se reemplazará en versiones posteriores por un sistema de credenciales seguro (JWT).

---

## 🔄 Endpoints Principales

| Módulo | Método | Ruta | Descripción |
|--------|---------|------|-------------|
| **Auth** | `POST` | `/api/v1/auth/login` | Validar código del estudiante |
| **Estudiantes** | `GET` | `/api/v1/estudiantes/{cod_persona}` | Obtener perfil |
|  | `PUT` | `/api/v1/estudiantes/{cod_persona}` | Actualizar datos |
| **Cursos** | `GET` | `/api/v1/cursos` | Listar cursos |
|  | `GET` | `/api/v1/cursos/{cod_curso}` | Detalle curso |
| **Matrícula** | `POST` | `/api/v1/matricula` | Registrar matrícula |
|  | `GET` | `/api/v1/matricula/{cod_persona}` | Obtener historial |
|  | `POST` | `/api/v1/matricula/simulador` | Simular “what-if” |
| **Recursos** | `POST` | `/api/v1/recursos/upload` | Subir recurso académico |
|  | `GET` | `/api/v1/recursos/recomendados` | Obtener lista personalizada |

---

## 🧰 Configuración Inicial

### Opción 1: Desarrollo Local con entorno virtual

```bash
# 1. Crear entorno virtual
python -m venv .venv

# 2. Activar entorno virtual
# En Windows:
.venv\Scripts\activate
# En Linux/Mac:
source .venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Copiar archivo de variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# 5. Inicializar base de datos con Alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# 6. Correr servidor local
uvicorn app.main:app --reload
```

### Opción 2: Desarrollo con Docker (Recomendado)

```bash
# 1. Construir y levantar los servicios
docker-compose up -d --build

# 2. Ver logs
docker-compose logs -f backend

# 3. Acceder al contenedor para ejecutar migraciones
docker-compose exec backend alembic revision --autogenerate -m "Initial migration"
docker-compose exec backend alembic upgrade head

# 4. Detener los servicios
docker-compose down

# 5. Detener y eliminar volúmenes (reiniciar DB)
docker-compose down -v
```

**La API estará disponible en:**
- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs
- Documentación alternativa (ReDoc): http://localhost:8000/redoc
- Base de datos PostgreSQL: localhost:5432

**Variables de entorno (.env):**
```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres123@localhost:5432/unitrackdb
PROJECT_NAME=UniTrack API
VERSION=1.0.0
ENVIRONMENT=development
DEBUG=True
```

---

## 📚 Uso de la API

### Ejemplos de Endpoints

#### 1. Login (Autenticación Simplificada)
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"cod_persona": "2021123456"}'
```

#### 2. Crear un Estudiante
```bash
curl -X POST "http://localhost:8000/api/v1/estudiantes/" \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "2021123456",
    "sexo": "M",
    "per_ingreso": "2021-1",
    "puntaje_ingreso": 18.5,
    "beca_vigente": true
  }'
```

#### 3. Listar Cursos
```bash
curl -X GET "http://localhost:8000/api/v1/cursos?limit=10"
```

#### 4. Registrar Matrícula
```bash
curl -X POST "http://localhost:8000/api/v1/matricula/" \
  -H "Content-Type: application/json" \
  -d '{
    "per_matricula": "2024-1",
    "cod_persona": "2021123456",
    "cod_curso": "CS101",
    "nota": 16.5,
    "estado": "Aprobado"
  }'
```

#### 5. Simular Matrícula (What-if)
```bash
curl -X POST "http://localhost:8000/api/v1/matricula/simulador" \
  -H "Content-Type: application/json" \
  -d '{
    "cod_persona": "2021123456",
    "cursos_simulados": ["CS101", "CS102", "MATH201"],
    "periodo": "2024-2"
  }'
```

---

## 🧪 Migraciones de Base de Datos

```bash
# Crear una nueva migración automáticamente
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones pendientes
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial de migraciones
alembic history

# Ver estado actual
alembic current
```

---

## 📁 Estructura del Proyecto Implementada

```
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py              # Configuración y variables de entorno
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py            # Conexión a PostgreSQL
│   ├── models/
│   │   ├── __init__.py
│   │   ├── estudiante.py          # Modelo ORM Estudiante
│   │   ├── curso.py               # Modelo ORM Curso
│   │   └── matricula.py           # Modelo ORM Matrícula
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── estudiante.py          # Schemas Pydantic Estudiante
│   │   ├── curso.py               # Schemas Pydantic Curso
│   │   ├── matricula.py           # Schemas Pydantic Matrícula
│   │   └── auth.py                # Schemas Pydantic Auth
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                # Endpoints de autenticación
│   │   ├── estudiantes.py         # Endpoints de estudiantes
│   │   ├── cursos.py              # Endpoints de cursos
│   │   └── matriculas.py          # Endpoints de matrículas
│   ├── services/                  # Lógica de negocio (futuro)
│   ├── utils/                     # Utilidades (futuro)
│   └── main.py                    # Aplicación FastAPI principal
├── alembic/
│   ├── versions/                  # Migraciones
│   ├── env.py                     # Configuración de Alembic
│   └── script.py.mako             # Plantilla de migraciones
├── tests/                         # Tests (futuro)
├── .env.example                   # Ejemplo de variables de entorno
├── .gitignore                     # Archivos ignorados por Git
├── alembic.ini                    # Configuración de Alembic
├── docker-compose.yml             # Configuración Docker Compose
├── Dockerfile                     # Imagen Docker
├── requirements.txt               # Dependencias Python
└── readme.md                      # Este archivo
```

---

## 📈 Roadmap Técnico

| Etapa | Objetivo | Estado |
|--------|-----------|--------|
| E1 | Modelado relacional y migraciones | ✅ |
| E2 | Endpoints base CRUD + Login simplificado | ✅ |
| E3 | Integración del modelo de recomendación | 🔄 |
| E4 | Módulo de recursos académicos con NLP | ⏳ |
| E5 | Monitoreo y reentrenamiento automático | ⏳ |

---

## ⚙️ Licencia
MIT License — © 2025 Universidad de Ingeniería y Tecnología (UTEC).  
Uso académico y de investigación permitido bajo atribución.
