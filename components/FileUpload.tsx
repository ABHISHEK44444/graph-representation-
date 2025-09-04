import React, { useState, useCallback } from 'react';
import { UploadIcon, FileIcon, CloseIcon } from './icons';

interface FileUploadProps {
  onFilesUpload: (files: [File, File]) => void;
  disabled: boolean;
}

const FileDropZone: React.FC<{
    file: File | null;
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    disabled: boolean;
    title: string;
}> = ({ file, onFileSelect, onFileRemove, disabled, title }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
        e.target.value = ''; // Reset input
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [disabled, onFileSelect]);

    const dragDropClasses = isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-gray-50';

    return (
        <div className="w-full">
            <h3 className="font-semibold text-gray-800 mb-2 text-center">{title}</h3>
            <div
                className={`relative w-full p-6 border-2 border-dashed rounded-xl transition-all duration-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${file ? 'border-green-500 bg-green-50' : dragDropClasses}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {!file && (
                    <>
                        <input
                            type="file"
                            id={`file-upload-${title.replace(/\s+/g, '-')}`}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                            accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            disabled={disabled}
                        />
                        <label htmlFor={`file-upload-${title.replace(/\s+/g, '-')}`} className="flex flex-col items-center justify-center space-y-2 text-center">
                            <UploadIcon className="w-10 h-10 text-gray-400" />
                            <p className="text-md font-semibold text-gray-700">
                                <span className="text-indigo-600">Click to upload</span>
                            </p>
                            <p className="text-sm text-gray-500">or drag and drop</p>
                        </label>
                    </>
                )}
                {file && (
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 min-w-0">
                            <FileIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                        </div>
                        <button onClick={onFileRemove} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors flex-shrink-0">
                            <CloseIcon className="w-5 h-5" />
                            <span className="sr-only">Remove file</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, disabled }) => {
    const [files, setFiles] = useState<[File | null, File | null]>([null, null]);

    const handleFileSelect = (file: File, index: 0 | 1) => {
        const newFiles = [...files] as [File | null, File | null];
        newFiles[index] = file;
        setFiles(newFiles);
    };

    const handleFileRemove = (index: 0 | 1) => {
        const newFiles = [...files] as [File | null, File | null];
        newFiles[index] = null;
        setFiles(newFiles);
    };

    const handleAnalyze = () => {
        if (files[0] && files[1]) {
            onFilesUpload([files[0], files[1]]);
        }
    };

    const canAnalyze = files[0] !== null && files[1] !== null && !disabled;

    return (
        <div className="mt-8 w-full max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileDropZone
                    file={files[0]}
                    onFileSelect={(file) => handleFileSelect(file, 0)}
                    onFileRemove={() => handleFileRemove(0)}
                    disabled={disabled}
                    title="First Data File"
                />
                <FileDropZone
                    file={files[1]}
                    onFileSelect={(file) => handleFileSelect(file, 1)}
                    onFileRemove={() => handleFileRemove(1)}
                    disabled={disabled}
                    title="Second Data File"
                />
            </div>
            <p className="text-sm text-gray-500 text-center max-w-lg">
                Upload two related documents (PDF, DOCX, or XLSX). The AI will analyze both to generate visualizations.
            </p>
            <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300"
            >
                Analyze Files
            </button>
        </div>
    );
};
