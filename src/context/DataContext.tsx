import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { DCRMData } from '../utils/dataParser';

interface DataContextType {
    data: DCRMData | null;
    setData: (data: DCRMData | null) => void;
    selectedX: string;
    setSelectedX: (x: string) => void;
    selectedY: string[];
    setSelectedY: (y: string[]) => void;
    range: [number, number]; // Row indices
    setRange: (range: [number, number]) => void;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    showLegend: boolean;
    setShowLegend: (show: boolean) => void;
    unitPrefs: Record<string, string>;
    setUnitPrefs: (prefs: Record<string, string>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<DCRMData | null>(null);
    const [selectedX, setSelectedX] = useState<string>('Time');
    const [selectedY, setSelectedY] = useState<string[]>([]);
    const [range, setRange] = useState<[number, number]>([0, 0]);
    const [showGrid, setShowGrid] = useState(true);
    const [showLegend, setShowLegend] = useState(true);
    const [unitPrefs, setUnitPrefs] = useState<Record<string, string>>({
        current: 'A',
        travel: 'mm',
        resistance: 'uOhm',
        time: 'ms'
    });

    return (
        <DataContext.Provider value={{
            data, setData,
            selectedX, setSelectedX,
            selectedY, setSelectedY,
            range, setRange,
            showGrid, setShowGrid,
            showLegend, setShowLegend,
            unitPrefs, setUnitPrefs
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
