import React from 'react';

const loadingMessages = [
    "Warming up the AI model...",
    "Analyzing document structure...",
    "Extracting tabular data...",
    "Identifying key metrics...",
    "Building visualization...",
    "Almost there..."
];

export const Loader: React.FC<{ fileName: string }> = ({ fileName }) => {
    const [messageIndex, setMessageIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-md animate-fade-in border border-gray-200">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing "{fileName}"</h2>
            <p className="text-gray-600 transition-opacity duration-500">{loadingMessages[messageIndex]}</p>
        </div>
    );
};