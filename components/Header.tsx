import React from 'react';
import { ChartIcon } from './icons';

export const Header: React.FC = () => {
    return (
        <header className="flex items-center justify-center p-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
                <ChartIcon className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Data Visualizer <span className="text-indigo-600">AI</span>
                </h1>
            </div>
        </header>
    );
};