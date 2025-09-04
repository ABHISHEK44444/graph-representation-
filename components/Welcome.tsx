import React from 'react';

export const Welcome: React.FC = () => {
    return (
        <div className="mb-8 animate-fade-in">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
                Turn Data into Insight
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload a document, and let AI automatically detect and visualize your data. It's that simple.
            </p>
        </div>
    );
};