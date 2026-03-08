import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const MatrixDisplay = ({ hex }) => {
    if (hex === undefined || hex === null) return <span className="text-gray-400 italic">-</span>;

    let cleanHex = '';
    if (typeof hex === 'string') {
        cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    } else if (Array.isArray(hex)) {
        try {
            cleanHex = hex.flat(Infinity).map(v => {
                if (typeof v === 'number') return v.toString(16).padStart(2, '0');
                return String(v).replace(/[^0-9a-fA-F]/g, '');
            }).join('');
        } catch (e) {
            // fallback
        }
    }

    if (cleanHex.length === 32) {
        const bytes = [];
        for (let i = 0; i < 32; i += 2) {
            bytes.push(cleanHex.slice(i, i + 2));
        }

        // Column-major order common in AES
        const grid = [
            [bytes[0], bytes[4], bytes[8], bytes[12]],
            [bytes[1], bytes[5], bytes[9], bytes[13]],
            [bytes[2], bytes[6], bytes[10], bytes[14]],
            [bytes[3], bytes[7], bytes[11], bytes[15]]
        ];

        return (
            <div className="inline-block border border-gray-300 rounded-md p-1.5 bg-gray-50 shadow-sm overflow-x-auto">
                {grid.map((row, rIdx) => (
                    <div key={rIdx} className="flex space-x-1 mb-1 last:mb-0">
                        {row.map((cell, cIdx) => (
                            <div key={cIdx} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 text-xs font-mono rounded text-gray-700 shadow-sm">
                                {cell.toLowerCase()}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    // Fallback for non-16-byte hex or other objects
    const displayStr = typeof hex === 'object' ? JSON.stringify(hex) : String(hex);
    return <code className="break-all font-mono text-xs text-gray-600 bg-gray-100 p-2 rounded block whitespace-pre-wrap">{displayStr}</code>;
};

const RoundRow = ({ label, standardValue, dynamicValue }) => (
    <div className="grid grid-cols-2 gap-4 border-t border-gray-200 py-4">
        <div>
            <h5 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">{label}</h5>
            <MatrixDisplay hex={standardValue} />
        </div>
        <div>
            <h5 className="text-sm font-semibold text-blue-500 mb-2 uppercase tracking-wider">{label}</h5>
            <MatrixDisplay hex={dynamicValue} />
        </div>
    </div>
);

const RoundSection = ({ roundIndex, stdRounds = [], dynRounds = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    const std = stdRounds.find(r => String(r.round) === String(roundIndex)) || {};
    const dyn = dynRounds.find(r => String(r.round) === String(roundIndex)) || {};

    const hasContent = Object.keys(std).length > 0 || Object.keys(dyn).length > 0;

    return (
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden bg-white shadow-sm transition-all">
            <button
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg font-bold text-gray-800">Round {roundIndex}</span>
                {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>

            {isOpen && hasContent && (
                <div className="p-4 bg-white">
                    <div className="grid grid-cols-2 gap-4 pb-4">
                        <div>
                            <h4 className="font-bold text-gray-700 text-center bg-gray-200 py-2 rounded">Standard AES</h4>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-700 text-center bg-blue-100 py-2 rounded">Dynamic AES</h4>
                        </div>
                    </div>

                    {(std.sub_bytes || dyn.sub_bytes) && (
                        <RoundRow label="SubBytes" standardValue={std.sub_bytes} dynamicValue={dyn.sub_bytes} />
                    )}
                    {(std.shift_rows || dyn.shift_rows) && (
                        <RoundRow label="ShiftRows" standardValue={std.shift_rows} dynamicValue={dyn.shift_rows} />
                    )}
                    {(std.mix_columns || dyn.mix_columns) && (
                        <RoundRow label="MixColumns" standardValue={std.mix_columns} dynamicValue={dyn.mix_columns} />
                    )}
                    {(std.add_round_key || dyn.add_round_key) && (
                        <RoundRow label="AddRoundKey" standardValue={std.add_round_key} dynamicValue={dyn.add_round_key} />
                    )}
                </div>
            )}
            {isOpen && !hasContent && (
                <div className="p-8 text-center text-gray-500 italic">No operation data available for this round.</div>
            )}
        </div>
    );
};

export default function AESRoundDashboard({ data, onBack }) {
    if (!data) return null;

    const {
        plaintext_hex = 'N/A',
        standard_aes = { rounds: [] },
        dynamic_aes = { rounds: [] },
        visualization = {}
    } = data;

    const labels = visualization.round_labels || [];
    const stdKeysStr = visualization.standard_keys || [];
    const dynKeysStr = visualization.dynamic_keys || [];
    const lfsrValsStr = visualization.lfsr_values || [];

    // Table Data
    const tableData = labels.map((label, idx) => ({
        round: label,
        stdKey: stdKeysStr[idx] || '-',
        lfsr: lfsrValsStr[idx] || '-',
        dynKey: dynKeysStr[idx] || '-'
    }));

    // Chart Data format: safe parsing if hex to get a basic sum/metric for visualization purposes
    const parseMetric = (hexStr) => {
        if (!hexStr || hexStr === '-') return 0;
        // Get numeric representation of first 4 bytes for plotting a trend
        const sub = hexStr.substring(0, 8);
        return parseInt(sub, 16) || 0;
    };

    const chartData = labels.map((label, idx) => ({
        round: label.toString(),
        standardMetric: parseMetric(stdKeysStr[idx]),
        dynamicMetric: parseMetric(dynKeysStr[idx]),
        lfsrMetric: parseMetric(lfsrValsStr[idx])
    }));

    // Discover all unique rounds to iterate
    const maxRounds = Math.max(
        ...standard_aes.rounds.map(r => r.round),
        ...dynamic_aes.rounds.map(r => r.round),
        0
    );

    const roundsList = Array.from({ length: maxRounds + 1 }, (_, i) => i);

    return (
        <div className="w-full min-h-screen bg-slate-50 font-sans p-4 sm:p-6 lg:p-8">
            {/* 1. HEADER SECTION */}
            <div className="mb-8 p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <button onClick={onBack} className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Main
                    </button>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        AES vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dynamic AES Key Evolution Analysis</span>
                    </h1>
                    <div className="mt-4 flex items-center bg-gray-100 p-3 rounded-lg border border-gray-200 inline-flex">
                        <span className="text-gray-600 text-sm font-semibold mr-3 uppercase tracking-wider">Plaintext (HEX)</span>
                        <code className="text-gray-900 font-mono font-bold bg-white px-2 py-1 rounded shadow-sm">
                            {plaintext_hex}
                        </code>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 2. KEY EVOLUTION COMPARISON TABLE */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2 overflow-x-auto">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-2 h-6 bg-blue-500 rounded mr-3"></span> Key Evolution Comparison Table
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-gray-600 uppercase tracking-wider">Round</th>
                                    <th className="px-6 py-3 font-bold text-gray-600 uppercase tracking-wider">Standard AES Key</th>
                                    <th className="px-6 py-3 font-bold text-indigo-600 uppercase tracking-wider">LFSR Output</th>
                                    <th className="px-6 py-3 font-bold text-blue-600 uppercase tracking-wider">Dynamic AES Key</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 font-mono">
                                {tableData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-bold text-gray-800">{row.round}</td>
                                        <td className="px-6 py-3 text-gray-600" title={row.stdKey}>
                                            {row.stdKey.substring(0, 16)}...
                                        </td>
                                        <td className="px-6 py-3 text-indigo-600 bg-indigo-50/30" title={row.lfsr}>
                                            {row.lfsr !== '-' ? row.lfsr.substring(0, 16) + '...' : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-blue-600 font-bold bg-blue-50/30" title={row.dynKey}>
                                            {row.dynKey.substring(0, 16)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. VISUALIZATION CHARTS */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-2 h-6 bg-purple-500 rounded mr-3"></span> Key Evolution Trend
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">Metric representing key index distribution over rounds</p>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => val.toExponential(1)} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => value.toExponential(4)}
                                />
                                <Legend iconType="circle" />
                                <Line type="monotone" name="Standard Key" dataKey="standardMetric" stroke="#9CA3AF" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" name="Dynamic Key" dataKey="dynamicMetric" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <span className="w-2 h-6 bg-indigo-500 rounded mr-3"></span> LFSR Output Distribution
                    </h2>
                    <p className="text-xs text-gray-500 mb-4">Pseudorandom variation per round</p>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="round" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(val) => val.toExponential(1)} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => value.toExponential(4)}
                                    cursor={{ fill: '#F3F4F6' }}
                                />
                                <Legend iconType="circle" />
                                <Bar name="LFSR Value (pseudorandom scale)" dataKey="lfsrMetric" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. ROUND OPERATIONS TABLE */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    <span className="w-2 h-6 bg-teal-500 rounded mr-3"></span> Round Operations Table
                </h2>
                <div className="space-y-4">
                    {roundsList.map(roundIdx => (
                        <RoundSection
                            key={roundIdx}
                            roundIndex={roundIdx}
                            stdRounds={standard_aes.rounds}
                            dynRounds={dynamic_aes.rounds}
                        />
                    ))}
                </div>
            </div>

        </div>
    );
}
