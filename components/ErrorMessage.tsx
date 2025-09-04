import React from 'react';
import { ErrorIcon, ResetIcon } from './icons';

interface ErrorMessageProps {
  message: string;
  onClear: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClear }) => {
  return (
    <div className="bg-red-50 text-red-700 p-6 rounded-xl flex flex-col items-center justify-center text-center animate-fade-in border border-red-200">
      <ErrorIcon className="w-12 h-12 mb-4 text-red-500" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">An Error Occurred</h3>
      <p className="max-w-md mb-6">{message}</p>
      <button
        onClick={onClear}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
      >
        <ResetIcon className="w-5 h-5" />
        Try Again
      </button>
    </div>
  );
};