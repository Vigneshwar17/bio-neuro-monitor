from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import json
import asyncio
from neuromorphic import NeuromorphicProcessor
import database

app = FastAPI(title="Neuromorphic Health Monitor")

# Initialize Database
database.init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State (Simulated Database) -> Keeping for in-memory speed, but DB is primary for history
patients: Dict[str, Dict] = {}
processor = NeuromorphicProcessor()
active_connections: List[WebSocket] = []

@app.get("/")
def read_root():
    return {"status": "System Online", "module": "Neuromorphic Monitor"}

@app.post("/api/telemetry")
async def receive_telemetry(data: dict):
    """
    Receive sensor data from IoT devices (Simulation).
    Format:
    {
        "patient_id": "P001",
        "timestamp": 1234567890,
        "sensors": {
            "heart_rate": 78,
            "spo2": 98,
            "bp_systolic": 120,
            "bp_diastolic": 80,
            "activity": "resting"
        },
        "medication_event": null
    }
    """
    patient_id = data.get("patient_id")
    
    # Process data through Neuromorphic module
    analysis_result = processor.process_stream(patient_id, data)
    
    # 1. Save Telemetry to DB
    database.save_telemetry(data)
    
    # 2. Check for alerts and save if any
    if analysis_result["status"] in ["Warning", "Critical"]:
        for anomaly in analysis_result["anomalies"]:
            # Check if we recently alerted for this to avoid spam? 
            # For now, just save all, frontend can filter.
            database.save_alert(
                patient_id, 
                anomaly, 
                analysis_result["status"], 
                f"Detected {anomaly} during {data['sensors']['activity']}"
            )
            
            # Broadcast Alert immediately
            await broadcast_update({
                "type": "ALERT_NEW",
                "patient_id": patient_id,
                "alert": {
                    "type": anomaly,
                    "severity": analysis_result["status"],
                    "message": f"Detected {anomaly}"
                }
            })
    
    # Update local in-memory state
    patients[patient_id] = {
        "latest_data": data,
        "analysis": analysis_result
    }
    
    # Broadcast to frontend
    await broadcast_update({
        "type": "TELEMETRY_UPDATE",
        "patient_id": patient_id,
        "data": patients[patient_id]
    })
    
    return {"status": "processed", "analysis": analysis_result}

@app.get("/api/patients")
def get_patients():
    return patients

@app.get("/api/history/{patient_id}")
def get_patient_history(patient_id: str):
    history = database.get_patient_history(patient_id)
    return history

@app.get("/api/alerts")
def get_alerts():
    return database.get_recent_alerts(limit=20)

@app.post("/api/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int):
    database.acknowledge_alert(alert_id)
    return {"status": "success"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_update(message: dict):
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass
