import requests
import time
import random
import json

API_URL = "http://localhost:8000/api/telemetry"

PATIENTS = ["P001", "P002", "P003"]

def generate_vitals(patient_id, condition="normal"):
    """
    Generates synthetic data based on condition.
    Conditions: normal, critical_spo2, arrhythmia
    """
    base_hr = 75
    base_spo2 = 98
    base_sys = 120
    base_dia = 80
    
    if condition == "critical_spo2":
        base_spo2 = random.randint(85, 94)
        base_hr = random.randint(80, 110) # Compensatory tachycardia
    elif condition == "arrhythmia":
        base_hr = random.choice([45, 130, random.randint(60, 100)])
    
    return {
        "patient_id": patient_id,
        "timestamp": time.time(),
        "sensors": {
            "heart_rate": base_hr + random.randint(-2, 2),
            "spo2": min(100, base_spo2 + random.randint(-1, 1)),
            "bp_systolic": base_sys + random.randint(-5, 5),
            "bp_diastolic": base_dia + random.randint(-3, 3),
            "activity": random.choice(["resting", "walking", "sitting"])
        },
        "medication_event": None
    }

def main():
    print(f"Starting Sensor Simulation -> {API_URL}")
    print("Press CTRL+C to stop.")
    
    try:
        while True:
            for pid in PATIENTS:
                # Simulate P001 as unstable
                condition = "normal"
                if pid == "P001" and random.random() < 0.3:
                    condition = "critical_spo2"
                
                data = generate_vitals(pid, condition)
                try:
                    resp = requests.post(API_URL, json=data)
                    print(f"[{pid}] Sent: {data['sensors']['heart_rate']}bpm, {data['sensors']['spo2']}% -> {resp.status_code}")
                except Exception as e:
                    print(f"Error sending data: {e}")
            
            time.sleep(2) # Send every 2 seconds
    except KeyboardInterrupt:
        print("Stopping simulation.")

if __name__ == "__main__":
    main()
