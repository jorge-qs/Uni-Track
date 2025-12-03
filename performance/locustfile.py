from locust import HttpUser, task, between, events
import json
import random
import csv
import os

# Global lists to store valid codes
VALID_STUDENT_CODES = []
VALID_COURSE_CODES = []

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """
    Load student and course codes from CSV before the test starts.
    """
    global VALID_STUDENT_CODES, VALID_COURSE_CODES
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load Student Codes
    student_csv_path = os.path.join(base_dir, "..", "backend", "data", "df_estudiante_final.csv")
    if os.path.exists(student_csv_path):
        try:
            with open(student_csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if 'COD_PERSONA' in row:
                        VALID_STUDENT_CODES.append(row['COD_PERSONA'])
            print(f"Loaded {len(VALID_STUDENT_CODES)} valid student codes.")
        except Exception as e:
            print(f"Failed to load student codes: {e}")
    else:
        print(f"Error: Student CSV file not found at {student_csv_path}")

    # Load Course Codes
    course_csv_path = os.path.join(base_dir, "..", "backend", "data", "df_curso_final_con_recursos.csv")
    if os.path.exists(course_csv_path):
        try:
            with open(course_csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if 'COD_CURSO' in row:
                        VALID_COURSE_CODES.append(row['COD_CURSO'])
            print(f"Loaded {len(VALID_COURSE_CODES)} valid course codes.")
        except Exception as e:
            print(f"Failed to load course codes: {e}")
    else:
        print(f"Error: Course CSV file not found at {course_csv_path}")

class EduTrackUser(HttpUser):
    # Simula un tiempo de espera humano entre acciones (1 a 5 segundos)
    wait_time = between(1, 5)

    @task(1)
    def view_dashboard(self):
        """
        Simula una carga ligera: El usuario ve su panel principal.
        Prueba la velocidad de respuesta de la base de datos (Lectura).
        """
        self.client.get("/", name="Get Root/Dashboard")

    @task(3)
    def predict_dropout_risk(self):
        """
        Simula una carga pesada: El sistema debe correr el modelo de ML.
        Aquí es donde probamos el rendimiento de LightGBM/XGBoost.
        """
        # Select Student Code
        if VALID_STUDENT_CODES:
            cod_persona = random.choice(VALID_STUDENT_CODES)
        else:
            cod_persona = str(random.randint(1000, 9999))

        # Select Course Code
        if VALID_COURSE_CODES:
            cod_curso = random.choice(VALID_COURSE_CODES)
        else:
            cod_curso = "CURSO-" + str(random.randint(100, 999))

        # Datos simulados para el endpoint de predicción
        payload = {
            "cod_persona": cod_persona,
            "cod_curso": cod_curso,
            "per_matricula": "2025-1"
        }
        
        headers = {'Content-Type': 'application/json'}
        
        # Enviamos la petición POST al endpoint de predicción real
        self.client.post(
            "/api/v1/prediccion/predecir", 
            json=payload, 
            headers=headers, 
            name="Inference: Predict Risk"
        )