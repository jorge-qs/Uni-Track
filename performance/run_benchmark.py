import subprocess
import time
import os
import sys
import argparse
import csv
import statistics

def run_benchmark(users=10, spawn_rate=2, duration="30s", host="http://localhost:8000"):
    """
    Runs Locust benchmark and system monitor in parallel, then aggregates and reports results.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    metrics_dir = os.path.join(base_dir, "metrics")
    os.makedirs(metrics_dir, exist_ok=True)
    
    monitor_script = os.path.join(base_dir, "monitor.py")
    locust_file = os.path.join(base_dir, "locustfile.py")
    
    print("--- Starting Benchmark ---")
    
    # 1. Start Resource Monitor in background
    print("Starting Resource Monitor...")
    # We assume 'uvicorn' is the process name. If running locally with python, it might be 'python'.
    # The monitor script now has a timeout to wait for the process.
    monitor_cmd = [sys.executable, monitor_script, "--process", "uvicorn", "--output", os.path.join(metrics_dir, "system_metrics.csv")]
    monitor_process = subprocess.Popen(monitor_cmd)
    
    # Give it a moment to initialize
    time.sleep(2)
    
    # 2. Run Locust
    print(f"Starting Locust: {users} users, spawn rate {spawn_rate}, duration {duration}")
    locust_csv_prefix = os.path.join(metrics_dir, "locust_stats")
    
    # Clean up old files to avoid confusion
    for f in os.listdir(metrics_dir):
        if f.startswith("locust_stats") and f.endswith(".csv"):
            os.remove(os.path.join(metrics_dir, f))

    locust_cmd = [
        sys.executable, "-m", "locust",
        "-f", locust_file,
        "--headless",
        "-u", str(users),
        "-r", str(spawn_rate),
        "--run-time", duration,
        "--host", host,
        "--csv", locust_csv_prefix,
        "--only-summary" 
    ]
    
    try:
        subprocess.run(locust_cmd, check=True)
        print("Locust finished successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Locust failed with error: {e}")
    finally:
        # 3. Stop Monitor
        print("Stopping Resource Monitor...")
        monitor_process.terminate()
        try:
            monitor_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            monitor_process.kill()
            
    print(f"Benchmark complete. Processing results...")
    print("-" * 60)
    
    # 4. Analyze Results
    analyze_results(metrics_dir)

def analyze_results(metrics_dir):
    """
    Reads the generated CSV files and prints the requested metrics.
    """
    # File paths
    locust_stats_file = os.path.join(metrics_dir, "locust_stats_stats.csv")
    system_metrics_file = os.path.join(metrics_dir, "system_metrics.csv")
    
    # --- 1. Parse Locust Stats ---
    rps = 0.0
    median_response = 0.0
    p95_response = 0.0
    inference_latency = "N/A"
    
    if os.path.exists(locust_stats_file):
        with open(locust_stats_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # "Aggregated" row contains the global stats
                if row['Name'] == 'Aggregated':
                    rps = float(row['Requests/s'])
                    median_response = float(row['50%'])
                    p95_response = float(row['95%'])
                
                # "Inference: Predict Risk" row contains the specific latency for ML model
                if row['Name'] == 'Inference: Predict Risk':
                    inference_latency = float(row['50%']) # Using Median for "Latencia de Inferencia"
                    # Alternatively we could use Mean or p95 depending on strict definition, 
                    # but Median is a good standard for "typical" latency.
    else:
        print(f"Error: Could not find {locust_stats_file}")

    # --- 2. Parse System Metrics ---
    avg_cpu = 0.0
    max_ram = 0.0
    
    if os.path.exists(system_metrics_file):
        cpu_values = []
        ram_values = []
        with open(system_metrics_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    cpu_values.append(float(row['cpu_percent']))
                    ram_values.append(float(row['memory_rss_mb']))
                except ValueError:
                    continue
        
        if cpu_values:
            avg_cpu = statistics.mean(cpu_values)
        if ram_values:
            max_ram = max(ram_values)
    else:
        print(f"Warning: Could not find {system_metrics_file}. System metrics may be missing.")

    # --- 3. Report ---
    print("\n" + "="*30)
    print("   PERFORMANCE METRICS REPORT   ")
    print("="*30)
    print(f"{'Metric':<30} | {'Value':<15}")
    print("-" * 48)
    print(f"{'Requests per Second (RPS)':<30} | {rps:.2f}")
    print(f"{'Median Response Time (ms)':<30} | {median_response:.2f}")
    print(f"{'95th Percentile Response (ms)':<30} | {p95_response:.2f}")
    
    inf_val = f"{inference_latency:.2f}" if isinstance(inference_latency, float) else inference_latency
    print(f"{'Inference Latency (ms)':<30} | {inf_val}")
    
    print(f"{'RAM Footprint (Max RSS MB)':<30} | {max_ram:.2f}")
    print(f"{'Average CPU Usage (%)':<30} | {avg_cpu:.2f}")
    print("="*30 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Performance Benchmark")
    parser.add_argument("--users", type=int, default=50, help="Number of concurrent users")
    parser.add_argument("--spawn-rate", type=int, default=5, help="User spawn rate")
    parser.add_argument("--duration", type=str, default="1m", help="Test duration (e.g. 1m, 30s)")
    parser.add_argument("--host", type=str, default="http://localhost:8000", help="Target host")
    
    args = parser.parse_args()
    run_benchmark(args.users, args.spawn_rate, args.duration, args.host)
