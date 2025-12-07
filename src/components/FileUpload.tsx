import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseDCRMFile } from '../utils/dataParser';
import { useData } from '../context/DataContext';

export const FileUpload: React.FC = () => {
    const { setData, setSelectedY, setRange } = useData();

    const handleFile = useCallback(async (file: File) => {
        try {
            const parsedData = await parseDCRMFile(file);
            setData(parsedData);

            // Set default selections
            // Default Y: First Coil Current if available, else first series
            const defaultY = parsedData.groups.coilCurrents.length > 0
                ? [parsedData.groups.coilCurrents[0]]
                : [Object.keys(parsedData.series)[0]];

            setSelectedY(defaultY);
            setRange([0, parsedData.time.length - 1]);

        } catch (err) {
            console.error("Error parsing file:", err);
            alert("Failed to parse file. Please check the format.");
        }
    }, [setData, setSelectedY, setRange]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-lg font-medium text-slate-700">Drag & Drop DCRM CSV/XLSX here</p>
            <p className="text-sm text-slate-500 mb-4">or click to browse</p>
            <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="file-upload"
                onChange={onChange}
            />
            <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
            >
                Browse Files
            </label>
        </div>
    );
};
