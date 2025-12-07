import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useData } from '../context/DataContext';
import { getUnitType, convertValue } from '../utils/unitConversion';

export const GraphViewer: React.FC = () => {
    const { data, selectedX, selectedY, range, showGrid, showLegend, unitPrefs } = useData();

    const plotData = useMemo(() => {
        if (!data) return { data: [], xTitle: '' };

        // Slice data based on range
        const start = range[0];
        const end = range[1] + 1; // Slice is exclusive at end

        // Get X data
        let xData: number[] = [];
        let xTitle = selectedX;

        if (selectedX === 'Time') {
            const targetUnit = unitPrefs.time;
            xData = data.time.slice(start, end).map(v => convertValue(v, 'time', targetUnit));
            xTitle = `Time (${targetUnit})`;
        } else if (selectedX === 'Index') {
            xData = Array.from({ length: end - start }, (_, i) => start + i);
        } else {
            const type = getUnitType(selectedX);
            const targetUnit = unitPrefs[type];
            xData = (data.series[selectedX]?.slice(start, end) || []).map(v => convertValue(v, type, targetUnit));
            xTitle = targetUnit ? `${selectedX} (${targetUnit})` : selectedX;
        }

        const seriesData = selectedY.map(yKey => {
            const type = getUnitType(yKey);
            const targetUnit = unitPrefs[type];
            const yData = (data.series[yKey]?.slice(start, end) || []).map(v => convertValue(v, type, targetUnit));

            return {
                x: xData,
                y: yData,
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: targetUnit ? `${yKey} (${targetUnit})` : yKey,
                line: { shape: 'spline' as const }, // Smooth lines
            };
        });

        return {
            data: seriesData,
            xTitle
        };
    }, [data, selectedX, selectedY, range, unitPrefs]);

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50 text-slate-400">
                No data loaded
            </div>
        );
    }

    return (
        <div className="w-full h-full p-4 bg-white rounded-xl shadow-sm border border-slate-200">
            <Plot
                data={plotData.data}
                layout={{
                    autosize: true,
                    title: { text: 'DCRM Analysis' },
                    xaxis: {
                        title: { text: plotData.xTitle },
                        showgrid: showGrid,
                        zeroline: false,
                    },
                    yaxis: {
                        title: { text: 'Value' },
                        showgrid: showGrid,
                        zeroline: false,
                    },
                    showlegend: showLegend,
                    legend: { orientation: 'h', y: -0.2 },
                    margin: { l: 50, r: 20, t: 40, b: 50 },
                    hovermode: 'closest',
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{
                    responsive: true,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                }}
            />
        </div>
    );
};
