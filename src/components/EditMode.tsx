import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { useData } from '../context/DataContext';
import { convertValue, getUnitType } from '../utils/unitConversion';
import { Download, ArrowLeft, RotateCcw, ZoomIn } from 'lucide-react';

export const EditMode: React.FC = () => {
    const navigate = useNavigate();
    const { data, selectedY, unitPrefs } = useData();

    // Store modified data - initialize with original data
    const [modifiedSeries, setModifiedSeries] = useState<Record<string, number[]>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Zoom range for editing
    const [editRange, setEditRange] = useState<[number, number]>([0, 100]);
    const [zoomStart, setZoomStart] = useState('0');
    const [zoomEnd, setZoomEnd] = useState('100');

    // Initialize modified series when data loads
    useEffect(() => {
        if (data) {
            const initial: Record<string, number[]> = {};
            Object.keys(data.series).forEach(key => {
                initial[key] = [...data.series[key]];
            });
            setModifiedSeries(initial);
            setEditRange([0, Math.min(100, data.time.length - 1)]);
            setZoomEnd(Math.min(100, data.time.length - 1).toString());
        }
    }, [data]);

    // Apply zoom range
    const handleApplyZoom = () => {
        if (!data) return;
        const start = Math.max(0, parseInt(zoomStart) || 0);
        const end = Math.min(data.time.length - 1, parseInt(zoomEnd) || 100);
        if (start < end) {
            setEditRange([start, end]);
        }
    };

    // Handle point relayout (when user modifies the plot)
    const handleRelayout = useCallback((event: any) => {
        // This captures zoom/pan events
        console.log('Relayout event:', event);
    }, []);

    // Handle point click for editing
    const [editingPoint, setEditingPoint] = useState<{
        seriesKey: string;
        index: number;
        currentValue: number;
    } | null>(null);
    const [newValue, setNewValue] = useState('');

    // This will be defined inline in the Plot component to access displayIndices

    const handleApplyEdit = () => {
        if (!editingPoint) return;

        const val = parseFloat(newValue);
        if (isNaN(val)) return;

        const type = getUnitType(editingPoint.seriesKey);
        const targetUnit = unitPrefs[type];

        // Convert from display unit to base unit
        const scale = targetUnit === 'ms' ? 1000 :
            targetUnit === 'mA' ? 1000 :
                targetUnit === 'uA' ? 1000000 :
                    targetUnit === 'cm' ? 0.1 :
                        targetUnit === 'm' ? 0.001 :
                            targetUnit === 'mOhm' ? 0.001 :
                                targetUnit === 'Ohm' ? 0.000001 : 1;

        const baseValue = val / scale;

        setModifiedSeries(prev => {
            const newSeries = { ...prev };
            newSeries[editingPoint.seriesKey] = [...newSeries[editingPoint.seriesKey]];
            newSeries[editingPoint.seriesKey][editingPoint.index] = baseValue;
            return newSeries;
        });
        setHasChanges(true);
        setEditingPoint(null);
    };

    // Smooth selected region
    const handleSmooth = () => {
        if (!data || selectedY.length === 0) return;

        const [start, end] = editRange;

        setModifiedSeries(prev => {
            const newSeries = { ...prev };

            selectedY.forEach(seriesKey => {
                const series = [...newSeries[seriesKey]];

                // Simple moving average smoothing
                for (let i = start + 1; i < end; i++) {
                    const avg = (series[i - 1] + series[i] + series[i + 1]) / 3;
                    series[i] = avg;
                }

                newSeries[seriesKey] = series;
            });

            return newSeries;
        });
        setHasChanges(true);
    };

    // Reset to original data
    const handleReset = () => {
        if (data) {
            const reset: Record<string, number[]> = {};
            Object.keys(data.series).forEach(key => {
                reset[key] = [...data.series[key]];
            });
            setModifiedSeries(reset);
            setHasChanges(false);
        }
    };

    // Export modified data as CSV
    const handleExport = () => {
        if (!data) return;

        // Build CSV content in Hyderabad format
        let csv = '';

        // Add metadata if present (without "METADATA" header, matching Hyderabad format)
        if (Object.keys(data.metadata).length > 0) {
            Object.entries(data.metadata).forEach(([key, value]) => {
                csv += `${key},${value},\r\n`;
            });
            csv += '\r\n';
        }

        // Add column headers with separator (matching Hyderabad format)
        // First, get all series keys
        const seriesKeys = Object.keys(modifiedSeries);

        // Build header row with separator column
        const headers = [...seriesKeys];
        csv += headers.join(',') + ', ,' + '\r\n';  // Add separator column

        // Add all data rows
        for (let i = 0; i < data.time.length; i++) {
            const row: string[] = [];

            // Add all series values
            seriesKeys.forEach(key => {
                row.push((modifiedSeries[key][i]?.toFixed(3) || '0.000'));
            });

            // Add data row with separator column and time
            csv += row.join(',') + ` ,${data.time[i].toFixed(2)},` + '\r\n';
        }

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dcrm_modified_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">No data loaded. Please load a file first.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back to Viewer
                    </button>
                </div>
            </div>
        );
    }

    if (selectedY.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">Please select at least one series to edit.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back to Viewer
                    </button>
                </div>
            </div>
        );
    }

    // Wait for modifiedSeries to be initialized
    if (Object.keys(modifiedSeries).length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="text-center">
                    <p className="text-slate-600">Loading data...</p>
                </div>
            </div>
        );
    }

    // Prepare plot data with reduced points for better interaction
    const [start, end] = editRange;
    const rangeSize = end - start + 1;

    // Downsample if too many points (keep every Nth point for display, but edit full data)
    const maxDisplayPoints = 500;
    const step = Math.max(1, Math.floor(rangeSize / maxDisplayPoints));

    const xData: number[] = [];
    const displayIndices: number[] = [];

    for (let i = start; i <= end; i += step) {
        xData.push(convertValue(data.time[i], 'time', unitPrefs.time));
        displayIndices.push(i);
    }

    const plotData = selectedY.map(yKey => {
        const type = getUnitType(yKey);
        const targetUnit = unitPrefs[type];

        // Safety check: ensure the series exists in modifiedSeries
        if (!modifiedSeries[yKey]) {
            return {
                x: xData,
                y: [],
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                name: targetUnit ? `${yKey} (${targetUnit})` : yKey,
                marker: { size: 6 },
                line: { width: 2 },
            };
        }

        const yData = displayIndices.map(i =>
            convertValue(modifiedSeries[yKey][i], type, targetUnit)
        );

        return {
            x: xData,
            y: yData,
            type: 'scatter' as const,
            mode: 'lines+markers' as const,
            name: targetUnit ? `${yKey} (${targetUnit})` : yKey,
            marker: { size: 6 },
            line: { width: 2 },
        };
    });

    return (
        <div className="flex flex-col h-screen bg-slate-100">
            {/* Header */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Viewer
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Edit Mode</h1>
                    {hasChanges && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                            Modified
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSmooth}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Smooth
                    </button>
                    <button
                        onClick={handleReset}
                        disabled={!hasChanges}
                        className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </header>

            {/* Zoom Controls */}
            <div className="mx-6 mt-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <ZoomIn className="w-5 h-5 text-slate-600" />
                        <span className="font-semibold text-slate-700">Zoom to Range:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">Start Index:</label>
                        <input
                            type="number"
                            value={zoomStart}
                            onChange={(e) => setZoomStart(e.target.value)}
                            className="w-24 px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max={data.time.length - 1}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-600">End Index:</label>
                        <input
                            type="number"
                            value={zoomEnd}
                            onChange={(e) => setZoomEnd(e.target.value)}
                            className="w-24 px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max={data.time.length - 1}
                        />
                    </div>
                    <button
                        onClick={handleApplyZoom}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Apply Zoom
                    </button>
                    <div className="text-sm text-slate-500">
                        Showing {rangeSize} points (downsampled to {xData.length} for display)
                    </div>
                </div>
            </div>

            {/* Edit Point Modal */}
            {editingPoint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Point Value</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Series: {editingPoint.seriesKey}
                                </label>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Index: {editingPoint.index}
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    New Value
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleApplyEdit();
                                        if (e.key === 'Escape') setEditingPoint(null);
                                    }}
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setEditingPoint(null)}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApplyEdit}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to Edit:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Click any point</strong> on the graph to edit its value directly</li>
                    <li>• <strong>Zoom to a specific range</strong> using the controls above (e.g., 0-100 for first 100 points)</li>
                    <li>• <strong>Use Plotly tools</strong> in the graph to zoom, pan, and select regions</li>
                    <li>• <strong>Click "Smooth"</strong> to apply smoothing to the visible range</li>
                    <li>• <strong>Click "Reset"</strong> to restore original values</li>
                    <li>• <strong>Click "Export CSV"</strong> to download ALL modified data (not just visible range)</li>
                </ul>
            </div>

            {/* Graph */}
            <div className="flex-1 p-6">
                <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <Plot
                        data={plotData}
                        layout={{
                            autosize: true,
                            title: {
                                text: `Edit Mode - Range: ${start} to ${end} (${rangeSize} points) - Click and drag points to edit`,
                                font: { size: 14 }
                            },
                            xaxis: {
                                title: { text: `Time (${unitPrefs.time})` },
                                showgrid: true,
                                fixedrange: false,
                            },
                            yaxis: {
                                title: { text: 'Value' },
                                showgrid: true,
                                fixedrange: false,
                            },
                            showlegend: true,
                            legend: { orientation: 'h', y: -0.15 },
                            margin: { l: 60, r: 20, t: 60, b: 80 },
                            hovermode: 'closest',
                            dragmode: 'pan',
                            datarevision: hasChanges ? Date.now() : 0,
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{
                            responsive: true,
                            displayModeBar: true,
                            modeBarButtonsToAdd: ['select2d', 'lasso2d'],
                            displaylogo: false,
                            edits: {
                                shapePosition: true,
                                annotationPosition: true,
                                annotationTail: true,
                                annotationText: true,
                                axisTitleText: true,
                                colorbarPosition: true,
                                colorbarTitleText: true,
                                legendPosition: true,
                                legendText: true,
                            },
                        }}
                        onClick={(event: any) => {
                            if (!data || !event.points || event.points.length === 0) return;

                            const point = event.points[0];
                            const seriesKey = selectedY[point.curveNumber];
                            const pointIndex = displayIndices[point.pointIndex];

                            // Get current value in display units
                            const type = getUnitType(seriesKey);
                            const targetUnit = unitPrefs[type];
                            const currentValue = convertValue(modifiedSeries[seriesKey][pointIndex], type, targetUnit);

                            setEditingPoint({
                                seriesKey,
                                index: pointIndex,
                                currentValue
                            });
                            setNewValue(currentValue.toFixed(2));
                        }}
                        onRelayout={handleRelayout}
                        onRestyle={(data) => {
                            console.log('Restyle event:', data);
                            // This captures when plot data is modified
                            if (data && data[0] && data[0].y) {
                                const traceIndex = data[1][0];
                                const seriesKey = selectedY[traceIndex];
                                const newYValues = data[0].y[0];

                                if (seriesKey && newYValues) {
                                    const type = getUnitType(seriesKey);
                                    const targetUnit = unitPrefs[type];
                                    const scale = targetUnit === 'ms' ? 1000 :
                                        targetUnit === 'mA' ? 1000 :
                                            targetUnit === 'uA' ? 1000000 :
                                                targetUnit === 'cm' ? 0.1 :
                                                    targetUnit === 'm' ? 0.001 :
                                                        targetUnit === 'mOhm' ? 0.001 :
                                                            targetUnit === 'Ohm' ? 0.000001 : 1;

                                    setModifiedSeries(prev => {
                                        const newSeries = { ...prev };
                                        newSeries[seriesKey] = [...newSeries[seriesKey]];

                                        // Update values for the visible range
                                        newYValues.forEach((val: number, idx: number) => {
                                            const actualIndex = displayIndices[idx];
                                            if (actualIndex !== undefined) {
                                                newSeries[seriesKey][actualIndex] = val / scale;
                                            }
                                        });

                                        return newSeries;
                                    });
                                    setHasChanges(true);
                                }
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
