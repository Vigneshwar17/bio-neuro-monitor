import React from 'react';
import { Heart, Activity, Thermometer, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, unit, icon: Icon, status }) => {
    const getStatusColor = (s) => {
        if (s === 'Critical') return 'bg-red-900/50 border-red-500 text-red-200';
        if (s === 'Warning') return 'bg-yellow-900/50 border-yellow-500 text-yellow-200';
        return 'bg-gray-800 border-gray-700 text-gray-200';
    };

    return (
        <div className={`p-4 rounded-lg border ${getStatusColor(status)} transition-all duration-300`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-sm">{title}</span>
                <Icon size={18} className="opacity-70" />
            </div>
            <div className="text-3xl font-bold">
                {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
            </div>
        </div>
    );
};

const PatientCard = ({ id, data }) => {
    if (!data || !data.latest_data) return <div className="p-4 bg-gray-800 rounded">Waiting for data...</div>;

    const vitals = data.latest_data.sensors;
    const analysis = data.analysis;

    return (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Patient {id}</h2>
                    <p className="text-gray-400 text-sm">ID: {data.latest_data.patient_id}</p>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-300 border border-blue-800">
                        Neuron Activity: {(analysis.neuron_activity_level * 100).toFixed(0)}%
                    </div>
                </div>
            </div>

            {analysis.anomalies.length > 0 && (
                <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg flex gap-2 items-center text-red-300 animate-pulse">
                    <AlertTriangle size={20} />
                    <span className="font-bold">ALERT: {analysis.anomalies.join(', ')}</span>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                    title="Heart Rate"
                    value={vitals.heart_rate}
                    unit="bpm"
                    icon={Heart}
                    status={analysis.status === 'Critical' || analysis.status === 'Warning' ? analysis.status : 'Normal'}
                />
                <MetricCard
                    title="SpO2"
                    value={vitals.spo2}
                    unit="%"
                    icon={Activity}
                    status={vitals.spo2 < 95 ? 'Warning' : 'Normal'}
                />
                <MetricCard
                    title="Blood Pressure"
                    value={`${vitals.bp_systolic}/${vitals.bp_diastolic}`}
                    unit="mmHg"
                    icon={Activity}
                    status={vitals.bp_systolic > 140 ? 'Warning' : 'Normal'}
                />
                <MetricCard
                    title="Activity"
                    value={vitals.activity}
                    unit=""
                    icon={Thermometer}
                    status="Normal"
                />
            </div>
        </div>
    );
};

export default function Dashboard({ data }) {
    if (!data) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                Waiting for live telemetry...
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {Object.keys(data).map(pid => (
                <PatientCard key={pid} id={pid} data={data[pid]} />
            ))}
        </div>
    );
}
