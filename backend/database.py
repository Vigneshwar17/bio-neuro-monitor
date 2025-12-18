import sqlite3
import json
from datetime import datetime

DB_NAME = "medical.db"

def init_db():
    """Initialize the database with tables if they don't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # Patient Table (Basic info)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT,
            age INTEGER,
            medical_history TEXT
        )
    ''')
    
    # Seed some patients if empty
    cursor.execute("SELECT count(*) FROM patients")
    if cursor.fetchone()[0] == 0:
        patients = [
            ("P001", "John Doe", 65, "Hypertension, Type 2 Diabetes"),
            ("P002", "Jane Smith", 72, "Arrhythmia"),
            ("P003", "Bob Wilson", 58, "None")
        ]
        cursor.executemany("INSERT INTO patients VALUES (?, ?, ?, ?)", patients)
    
    # Telemetry Data Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp REAL,
            heart_rate INTEGER,
            spo2 INTEGER,
            bp_systolic INTEGER,
            bp_diastolic INTEGER,
            activity TEXT,
            raw_data TEXT,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')
    
    # Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT,
            timestamp REAL,
            alert_type TEXT,
            severity TEXT,
            message TEXT,
            acknowledged INTEGER DEFAULT 0,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized.")

def save_telemetry(data):
    """Save raw telemetry data."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    sensors = data.get("sensors", {})
    
    cursor.execute('''
        INSERT INTO telemetry 
        (patient_id, timestamp, heart_rate, spo2, bp_systolic, bp_diastolic, activity, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get("patient_id"),
        data.get("timestamp"),
        sensors.get("heart_rate"),
        sensors.get("spo2"),
        sensors.get("bp_systolic"),
        sensors.get("bp_diastolic"),
        sensors.get("activity"),
        json.dumps(data)
    ))
    
    conn.commit()
    conn.close()

def save_alert(patient_id, alert_type, severity, message):
    """Save a medical alert."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO alerts (patient_id, timestamp, alert_type, severity, message)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        patient_id,
        datetime.now().timestamp(),
        alert_type,
        severity,
        message
    ))
    
    alert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return alert_id

def get_recent_alerts(limit=10, active_only=False):
    """Fetch recent alerts."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT * FROM alerts"
    if active_only:
        query += " WHERE acknowledged = 0"
    query += " ORDER BY timestamp DESC LIMIT ?"
    
    cursor.execute(query, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_patient_history(patient_id, limit=50):
    """Fetch recent telemetry for a patient."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM telemetry 
        WHERE patient_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (patient_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def acknowledge_alert(alert_id):
    """Mark an alert as acknowledged."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()
