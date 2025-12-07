import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    Info,
    Settings,
    Activity,
    FileText,
    ChevronDown,
    ChevronUp,
    Database
} from 'lucide-react';

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    data: Record<string, string>;
    defaultOpen?: boolean;
}

const MetadataSection: React.FC<SectionProps> = ({ title, icon, data, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (Object.keys(data).length === 0) return null;

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-3 bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    {icon}
                    <span>{title}</span>
                    <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-200 px-2 py-0.5 rounded-full">
                        {Object.keys(data).length}
                    </span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {isOpen && (
                <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(data).map(([key, value]) => (
                            <div key={key} className="flex flex-col border-b border-slate-100 pb-2 last:border-0">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    {key.replace(/:$/, '')}
                                </span>
                                <span className="text-sm text-slate-800 font-medium break-words">
                                    {value || '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const MetadataPanel: React.FC = () => {
    const { data } = useData();

    if (!data || Object.keys(data.metadata).length === 0) {
        return null;
    }

    // Group metadata by category
    const headerInfo: Record<string, string> = {};
    const settingsInfo: Record<string, string> = {};
    const resultsInfo: Record<string, string> = {};
    const otherInfo: Record<string, string> = {};

    Object.entries(data.metadata).forEach(([key, value]) => {
        const lowerKey = key.toLowerCase();

        if (lowerKey.includes('substation') || lowerKey.includes('bay') ||
            lowerKey.includes('employee') || lowerKey.includes('sap') ||
            lowerKey.includes('breaker type') || lowerKey.includes('serial') ||
            lowerKey.includes('manufacturer') || lowerKey.includes('test date')) {
            headerInfo[key] = value;
        } else if (lowerKey.includes('trigger') || lowerKey.includes('sampling') ||
            lowerKey.includes('range') || lowerKey.includes('plot length') ||
            lowerKey.includes('delay') || lowerKey.includes('current range') ||
            lowerKey.includes('pressure') || lowerKey.includes('voltage')) {
            settingsInfo[key] = value;
        } else if (lowerKey.includes('travel') || lowerKey.includes('velocity') ||
            lowerKey.includes('rebound') || lowerKey.includes('coil current')) {
            resultsInfo[key] = value;
        } else {
            otherInfo[key] = value;
        }
    });

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3 px-1">
                <Database className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Test Metadata</h2>
            </div>

            <MetadataSection
                title="Equipment & Test Details"
                icon={<Info className="w-4 h-4 text-blue-500" />}
                data={headerInfo}
                defaultOpen={true}
            />

            <MetadataSection
                title="Settings & Configuration"
                icon={<Settings className="w-4 h-4 text-slate-500" />}
                data={settingsInfo}
            />

            <MetadataSection
                title="Measurement Results"
                icon={<Activity className="w-4 h-4 text-green-500" />}
                data={resultsInfo}
            />

            <MetadataSection
                title="Additional Information"
                icon={<FileText className="w-4 h-4 text-orange-500" />}
                data={otherInfo}
            />
        </div>
    );
};
