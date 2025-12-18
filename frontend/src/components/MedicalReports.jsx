import { useState, useEffect } from 'react';

const MedicalReports = ({ patientId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/history/${patientId}`);
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    if (!patientId) return <div className="text-gray-400">Select a patient to view full report.</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-blue-400">Medical Report: {patientId}</h2>
                <button
                    onClick={fetchHistory}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse text-gray-400">Loading history...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="p-2">Time</th>
                                <th className="p-2">HR (bpm)</th>
                                <th className="p-2">SpO2 (%)</th>
                                <th className="p-2">BP (mmHg)</th>
                                <th className="p-2">Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No records found.</td></tr>
                            ) : (
                                history.map((record, idx) => (
                                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50 transition">
                                        <td className="p-2 text-sm text-gray-400">
                                            {new Date(record.timestamp * 1000).toLocaleString()}
                                        </td>
                                        <td className={`p-2 ${getVitalColor(record.heart_rate, 60, 100)}`}>
                                            {record.heart_rate}
                                        </td>
                                        <td className={`p-2 ${getVitalColor(record.spo2, 95, 100, true)}`}>
                                            {record.spo2}
                                        </td>
                                        <td className="p-2">
                                            {record.bp_systolic}/{record.bp_diastolic}
                                        </td>
                                        <td className="p-2 capitalize text-gray-300">
                                            {record.activity}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Helper for conditional coloring
const getVitalColor = (val, min, max, invert = false) => {
    if (val < min || val > max) return 'text-red-400 font-bold';
    return 'text-green-400';
};

export default MedicalReports;
