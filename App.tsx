import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChartPanel } from './components/ChartPanel';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { extractDataFromDocument } from './services/geminiService';
import { parseFileToText } from './utils/fileHelper';
import type { ChartDataResponse, MimeType } from './types';
import { Header } from './components/Header';
import { Welcome } from './components/Welcome';
import { SUPPORTED_FILE_TYPES } from './constants';

const App: React.FC = () => {
  const [chartDataSets, setChartDataSets] = useState<[ChartDataResponse | null, ChartDataResponse | null]>([null, null]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileNames, setFileNames] = useState<[string | null, string | null]>([null, null]);

  const handleFilesUpload = useCallback(async (files: [File, File]) => {
    for (const file of files) {
      if (!SUPPORTED_FILE_TYPES.includes(file.type as MimeType)) {
        setError(`Unsupported file type: ${file.name}. Please upload one of: .pdf, .docx, .xlsx`);
        return;
      }
    }

    setError(null);
    setChartDataSets([null, null]);
    setIsLoading(true);
    setFileNames([files[0].name, files[1].name]);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          const textContent = await parseFileToText(file);
          if (!textContent.trim()) {
            throw new Error(`Could not extract any text from ${file.name}. It might be empty or a scanned image.`);
          }
          const result = await extractDataFromDocument(textContent);
          
          if (!result || !result.chartData || result.chartData.length === 0 || !result.nameKey || !result.dataKeys || result.dataKeys.length === 0) {
            throw new Error(`AI could not find any chartable data in ${file.name}. Please try a different file with clear tabular data.`);
          }
          return result;
        })
      );
      
      setChartDataSets([results[0], results[1]]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setChartDataSets([null, null]);
    setError(null);
    setIsLoading(false);
    setFileNames([null, null]);
  };

  const hasData = chartDataSets[0] && chartDataSets[1];
  const loadingFileName = fileNames[0] && fileNames[1] ? `${fileNames[0]} & ${fileNames[1]}` : 'your documents';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          {isLoading && <Loader fileName={loadingFileName} />}
          {error && <ErrorMessage message={error} onClear={handleReset} />}
          
          {!isLoading && !error && !hasData && (
            <div className="text-center">
                <Welcome />
                <FileUpload onFilesUpload={handleFilesUpload} disabled={isLoading} />
            </div>
          )}
          
          {!isLoading && !error && hasData && (
            <ChartPanel dataSets={chartDataSets as [ChartDataResponse, ChartDataResponse]} fileNames={fileNames as [string, string]} onReset={handleReset} />
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Gemini AI. Visualizations by Recharts.</p>
      </footer>
    </div>
  );
};

export default App;
