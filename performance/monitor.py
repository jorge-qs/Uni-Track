import psutil
import time
import csv
import argparse
import os
from datetime import datetime

def get_process_by_name(process_name):
    """
    Finds a process by name. Returns the first match.
    """
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if name matches or if cmdline contains the name (useful for python scripts)
            if process_name.lower() in proc.info['name'].lower():
                return proc
            if proc.info['cmdline'] and any(process_name.lower() in arg.lower() for arg in proc.info['cmdline']):
                return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return None

def monitor_resources(process_name, output_file, interval=1):
    """
    Monitors CPU and RAM usage of a process and writes to CSV.
    """
    print(f"Waiting for process '{process_name}' to start...")
    process = None
    # Wait up to 30 seconds for the process to appear
    timeout = 30
    start_wait = time.time()
    
    while process is None:
        process = get_process_by_name(process_name)
        if process is None:
            if time.time() - start_wait > timeout:
                print(f"Timeout waiting for process '{process_name}'")
                return
            time.sleep(1)
    
    print(f"Attached to process {process.pid} ({process.name()})")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['timestamp', 'cpu_percent', 'memory_rss_mb', 'memory_vms_mb'])
        
        print(f"Monitoring... Press Ctrl+C to stop.")
        try:
            while process.is_running():
                # CPU percent since last call
                cpu = process.cpu_percent(interval=interval)
                
                # Memory info
                mem = process.memory_info()
                rss_mb = mem.rss / (1024 * 1024)
                vms_mb = mem.vms / (1024 * 1024)
                
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                
                writer.writerow([timestamp, cpu, round(rss_mb, 2), round(vms_mb, 2)])
                f.flush()
                
        except (psutil.NoSuchProcess, KeyboardInterrupt):
            print("Process ended or monitoring stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monitor process resources")
    parser.add_argument("--process", type=str, default="uvicorn", help="Process name to monitor")
    parser.add_argument("--output", type=str, default="metrics/system_metrics.csv", help="Output CSV file")
    parser.add_argument("--interval", type=float, default=1.0, help="Sampling interval in seconds")
    
    args = parser.parse_args()
    monitor_resources(args.process, args.output, args.interval)
