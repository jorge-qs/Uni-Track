import pandas as pd
import matplotlib.pyplot as plt
import argparse
import os
import glob

def generate_graphs(results_dir):
    """
    Generates graphs for RPS, Response Times, CPU, and RAM from CSV files in the results directory.
    """
    print(f"Generating graphs for: {results_dir}")
    
    # Files
    locust_history_file = os.path.join(results_dir, "locust_stats_stats_history.csv")
    system_metrics_file = os.path.join(results_dir, "system_metrics.csv")
    
    # Output directory for images
    output_dir = results_dir
    
    # --- 1. Locust Metrics (RPS, Response Time) ---
    if os.path.exists(locust_history_file):
        try:
            df_locust = pd.read_csv(locust_history_file)
            
            # Convert timestamp to datetime if possible, or use index
            if 'Timestamp' in df_locust.columns:
                df_locust['Timestamp'] = pd.to_datetime(df_locust['Timestamp'], unit='s')
                df_locust.set_index('Timestamp', inplace=True)
            
            # Filter for Aggregated stats
            df_agg = df_locust[df_locust['Name'] == 'Aggregated']
            
            # Graph 1: Requests per Second (RPS)
            plt.figure(figsize=(10, 6))
            plt.plot(df_agg.index, df_agg['Requests/s'], label='RPS', color='blue')
            plt.title('Requests per Second (RPS) Over Time')
            plt.xlabel('Time')
            plt.ylabel('RPS')
            plt.grid(True)
            plt.legend()
            plt.savefig(os.path.join(output_dir, "rps_graph.png"))
            plt.close()
            print("Generated rps_graph.png")
            
            # Graph 2: Response Times (Median & p95)
            plt.figure(figsize=(10, 6))
            plt.plot(df_agg.index, df_agg['50%'], label='Median Response Time', color='green')
            plt.plot(df_agg.index, df_agg['95%'], label='95th Percentile Response Time', color='orange')
            plt.title('Response Time Over Time')
            plt.xlabel('Time')
            plt.ylabel('Time (ms)')
            plt.grid(True)
            plt.legend()
            plt.savefig(os.path.join(output_dir, "response_time_graph.png"))
            plt.close()
            print("Generated response_time_graph.png")
            
            # Graph 3: Inference Latency (Specific Endpoint)
            df_inf = df_locust[df_locust['Name'] == 'Inference: Predict Risk']
            if not df_inf.empty:
                plt.figure(figsize=(10, 6))
                plt.plot(df_inf.index, df_inf['50%'], label='Median Inference Latency', color='purple')
                plt.title('Inference Latency Over Time (Predict Risk)')
                plt.xlabel('Time')
                plt.ylabel('Latency (ms)')
                plt.grid(True)
                plt.legend()
                plt.savefig(os.path.join(output_dir, "inference_latency_graph.png"))
                plt.close()
                print("Generated inference_latency_graph.png")
                
        except Exception as e:
            print(f"Error processing Locust history: {e}")
    else:
        print(f"Warning: Locust history file not found: {locust_history_file}")

    # --- 2. System Metrics (CPU, RAM) ---
    if os.path.exists(system_metrics_file):
        try:
            df_sys = pd.read_csv(system_metrics_file)
            df_sys['timestamp'] = pd.to_datetime(df_sys['timestamp'])
            df_sys.set_index('timestamp', inplace=True)
            
            # Graph 4: CPU Usage
            plt.figure(figsize=(10, 6))
            plt.plot(df_sys.index, df_sys['cpu_percent'], label='CPU Usage %', color='red')
            plt.title('CPU Usage Over Time')
            plt.xlabel('Time')
            plt.ylabel('CPU %')
            plt.grid(True)
            plt.legend()
            plt.savefig(os.path.join(output_dir, "cpu_usage_graph.png"))
            plt.close()
            print("Generated cpu_usage_graph.png")
            
            # Graph 5: RAM Usage
            plt.figure(figsize=(10, 6))
            plt.plot(df_sys.index, df_sys['memory_rss_mb'], label='RAM Usage (RSS)', color='brown')
            plt.title('RAM Usage Over Time')
            plt.xlabel('Time')
            plt.ylabel('Memory (MB)')
            plt.grid(True)
            plt.legend()
            plt.savefig(os.path.join(output_dir, "ram_usage_graph.png"))
            plt.close()
            print("Generated ram_usage_graph.png")
            
        except Exception as e:
            print(f"Error processing System metrics: {e}")
    else:
        print(f"Warning: System metrics file not found: {system_metrics_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Performance Graphs")
    parser.add_argument("--results", type=str, help="Path to results directory. Defaults to latest.")
    
    args = parser.parse_args()
    
    target_dir = args.results
    
    # If no directory specified, find the latest one
    if not target_dir:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        results_root = os.path.join(base_dir, "results")
        if os.path.exists(results_root):
            subdirs = [os.path.join(results_root, d) for d in os.listdir(results_root) if os.path.isdir(os.path.join(results_root, d))]
            if subdirs:
                target_dir = max(subdirs, key=os.path.getmtime)
                print(f"Using latest results directory: {target_dir}")
            else:
                print("No results found in performance/results/")
                exit(1)
        else:
             print("performance/results/ directory does not exist.")
             exit(1)
             
    generate_graphs(target_dir)
