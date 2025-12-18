import { useState, useEffect } from 'react';

const Alerts = ({ activeAlerts, onAcknowledge }) => {
    // We can also fetch historical alerts here if needed, but for now we display what's passed or fetch pending
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        fetchAlerts();
    }, [activeAlerts]); // Refetch if parent notifies of new one

    const fetchAlerts = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/alerts');
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error("Failed to fetch alerts", error);
        }
    };

    const handleAcknowledge = async (id) => {
        try {
            await fetch(`http://localhost:8000/api/alerts/${id}/acknowledge`, { method: 'POST' });
            // Optimistic update
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: 1 } : a));
            if (onAcknowledge) onAcknowledge(id);
        } catch (error) {
            console.error("Failed to ack alert", error);
        }
    };

    const pending = alerts.filter(a => !a.acknowledged);
    const history = alerts.filter(a => a.acknowledged);

    return (
        <div className="space-y-6">
            {/* Active Alerts */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-red-900/50">
                <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                    <span className="animate-pulse">⚠️</span> Active Alerts ({pending.length})
                </h2>

                <div className="space-y-3">
                    {pending.length === 0 ? (
                        <div className="text-gray-500 italic">No active alerts. System nominal.</div>
                    ) : (
                        pending.map(alert => (
                            <div key={alert.id} className="bg-red-900/20 border border-red-500/30 p-4 rounded flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-red-300">{alert.alert_type} - {alert.patient_id}</div>
                                    <div className="text-sm text-gray-400">{alert.message}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(alert.timestamp * 1000).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAcknowledge(alert.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Alert History */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 opacity-75 hover:opacity-100 transition">
                <h3 className="text-lg font-bold text-gray-400 mb-4">Resolved Alerts</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map(alert => (
                        <div key={alert.id} className="p-3 bg-gray-700/50 rounded flex justify-between items-center">
                            <span className="text-gray-300 text-sm">
                                <span className="font-bold text-gray-400">[{alert.patient_id}]</span> {alert.alert_type}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(alert.timestamp * 1000).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Alerts;
