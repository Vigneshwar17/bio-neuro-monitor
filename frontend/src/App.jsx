

import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import MedicalReports from './components/MedicalReports'
import Alerts from './components/Alerts'

function App() {
    const [data, setData] = useState(null)
    const [status, setStatus] = useState('Disconnected')
    const [activeTab, setActiveTab] = useState('dashboard') // dashboard, reports, alerts
    const [selectedPatientId, setSelectedPatientId] = useState(null)
    const [alerts, setAlerts] = useState([])

    useEffect(() => {
        // WebSocket Connection
        const ws = new WebSocket('ws://localhost:8000/ws')

        ws.onopen = () => {
            setStatus('Connected')
            console.log('Connected to Backend')
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)

                if (message.type === 'TELEMETRY_UPDATE') {
                    setData(prev => ({
                        ...prev,
                        [message.patient_id]: message.data
                    }))
                } else if (message.type === 'ALERT_NEW') {
                    // Flash alert or toast notification could go here
                    console.warn("New Alert:", message.alert)
                    // We can also trigger a refetch in the Alerts component by passing this down
                    // For now, let's append to a local list to show immediate feedback if needed, 
                    // though the Alert component fetches from DB.
                }
            } catch (e) {
                console.error(e)
            }
        }

        ws.onclose = () => setStatus('Disconnected')

        return () => ws.close()
    }, [])

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Neuromorphic Health Monitor
                    </h1>
                    <nav className="flex space-x-1 bg-gray-700/50 rounded-lg p-1">
                        {['dashboard', 'reports', 'alerts'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    {/* Patient Selector for Reports View */}
                    {activeTab === 'reports' && data && (
                        <select
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            className="bg-gray-700 text-white text-sm rounded border border-gray-600 px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            defaultValue=""
                        >
                            <option value="" disabled>Select Patient</option>
                            {Object.keys(data).map(pid => (
                                <option key={pid} value={pid}>{pid}</option>
                            ))}
                        </select>
                    )}

                    <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                        <div className={`w-2.5 h-2.5 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-xs text-gray-400 font-mono">{status}</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'dashboard' && (
                        <Dashboard data={data} />
                    )}

                    {activeTab === 'reports' && (
                        <MedicalReports patientId={selectedPatientId} />
                    )}

                    {activeTab === 'alerts' && (
                        <Alerts />
                    )}
                </div>
            </main>
        </div>
    )
}

export default App
