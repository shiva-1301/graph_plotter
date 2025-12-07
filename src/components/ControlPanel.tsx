import React from 'react';
import { useData } from '../context/DataContext';
import { ChevronDown, ChevronRight, Settings, Activity, Zap, Move, Layers, Download, Ruler } from 'lucide-react';
import Papa from 'papaparse';
import { UNITS } from '../utils/unitConversion';

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    return (
        <div className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 font-medium text-slate-700">
                    {icon}
                    {title}
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {isOpen && <div className="p-3 bg-white">{children}</div>}
        </div>
    );
};

export const ControlPanel: React.FC = () => {
    const {
        data, selectedY, setSelectedY,
        selectedX, setSelectedX,
        range, setRange,
        showGrid, setShowGrid,
        showLegend, setShowLegend,
        unitPrefs, setUnitPrefs
    } = useData();

    if (!data) return <div className="p-4 text-slate-400">Load a file to see controls</div>;

    const xOptions = ['Time', 'Index', ...Object.keys(data.series)];

    const handleExportCSV = () => {
        if (!data) return;

        const start = range[0];
        const end = range[1] + 1;

        const exportData = data.time.slice(start, end).map((t, i) => {
            const row: Record<string, number> = { Time: t };
            Object.keys(data.series).forEach(key => {
                row[key] = data.series[key][start + i];
            });
            return row;
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'dcrm_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleY = (key: string) => {
        if (selectedY.includes(key)) {
            setSelectedY(selectedY.filter(k => k !== key));
        } else {
            setSelectedY([...selectedY, key]);
        }
    };

    const renderCheckbox = (key: string) => (
        <label key={key} className="flex items-center gap-2 mb-1 cursor-pointer hover:text-blue-600">
            <input
                type="checkbox"
                checked={selectedY.includes(key)}
                onChange={() => toggleY(key)}
                className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm truncate" title={key}>{key}</span>
        </label>
    );

    return (
        <div className="h-full overflow-y-auto p-4 bg-white border-r border-slate-200 w-80 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Controls</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">X-Axis</label>
                <select
                    value={selectedX}
                    onChange={(e) => setSelectedX(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    {xOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            <Section title="Graph Options" icon={<Settings size={18} />}>
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
                    <span className="text-sm">Show Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showLegend} onChange={e => setShowLegend(e.target.checked)} />
                    <span className="text-sm">Show Legend</span>
                </label>
            </Section>

            <Section title="Unit Settings" icon={<Ruler size={18} />}>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Current</label>
                        <select
                            value={unitPrefs.current}
                            onChange={e => setUnitPrefs({ ...unitPrefs, current: e.target.value })}
                            className="w-full text-xs p-1 border rounded"
                        >
                            {UNITS.current.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Travel</label>
                        <select
                            value={unitPrefs.travel}
                            onChange={e => setUnitPrefs({ ...unitPrefs, travel: e.target.value })}
                            className="w-full text-xs p-1 border rounded"
                        >
                            {UNITS.travel.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Resistance</label>
                        <select
                            value={unitPrefs.resistance}
                            onChange={e => setUnitPrefs({ ...unitPrefs, resistance: e.target.value })}
                            className="w-full text-xs p-1 border rounded"
                        >
                            {UNITS.resistance.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Time</label>
                        <select
                            value={unitPrefs.time}
                            onChange={e => setUnitPrefs({ ...unitPrefs, time: e.target.value })}
                            className="w-full text-xs p-1 border rounded"
                        >
                            {UNITS.time.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </Section>

            <Section title="Data Range" icon={<Activity size={18} />}>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Start: {range[0]}</span>
                        <span>End: {range[1]}</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={data.time.length - 1}
                        value={range[0]}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (val < range[1]) setRange([val, range[1]]);
                        }}
                        className="w-full"
                    />
                    <input
                        type="range"
                        min={0}
                        max={data.time.length - 1}
                        value={range[1]}
                        onChange={e => {
                            const val = parseInt(e.target.value);
                            if (val > range[0]) setRange([range[0], val]);
                        }}
                        className="w-full"
                    />
                    <button
                        className="mt-2 text-xs text-blue-600 hover:underline"
                        onClick={() => setRange([0, data.time.length - 1])}
                    >
                        Reset Range
                    </button>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </Section>

            {data.groups.coilCurrents.length > 0 && (
                <Section title="Coil Currents" icon={<Zap size={18} />}>
                    {data.groups.coilCurrents.map(renderCheckbox)}
                </Section>
            )}

            {data.groups.contactTravel.length > 0 && (
                <Section title="Contact Travel" icon={<Move size={18} />}>
                    {data.groups.contactTravel.map(renderCheckbox)}
                </Section>
            )}

            {data.groups.dcrmResistance.length > 0 && (
                <Section title="DCRM Resistance" icon={<Layers size={18} />}>
                    {data.groups.dcrmResistance.map(renderCheckbox)}
                </Section>
            )}

            {data.groups.dcrmCurrent.length > 0 && (
                <Section title="DCRM Current" icon={<Activity size={18} />}>
                    {data.groups.dcrmCurrent.map(renderCheckbox)}
                </Section>
            )}

            {data.groups.others.length > 0 && (
                <Section title="Other Channels" icon={<Activity size={18} />}>
                    {data.groups.others.map(renderCheckbox)}
                </Section>
            )}
        </div>
    );
};
