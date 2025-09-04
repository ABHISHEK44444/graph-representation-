
import { GoogleGenAI } from "@google/genai";
import type { ChartDataResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

const promptTemplate = `
You are an expert data analyst. A user has provided you with the text content extracted from a document. Your task is to analyze this content, find the primary dataset suitable for visualization, and convert it into a structured JSON format. The data could be in tables (represented as CSV), lists, or paragraphs. Focus on quantifiable information.

The output must be a JSON object with three keys:
1.  "chartData": An array of objects, where each object represents a data point (e.g., a row in a table). Ensure all numerical values are converted to numbers, not strings.
2.  "nameKey": A string representing the key in "chartData" objects that should be used for labels (e.g., the x-axis in a bar chart). This should be a categorical or time-based field.
3.  "dataKeys": An array of strings, where each string is a key in "chartData" objects that corresponds to a numerical value to be plotted.

Example: If the document text contains sales figures, the output should be similar to this:
{
  "chartData": [
    { "month": "January", "sales": 1200, "expenses": 800 },
    { "month": "February", "sales": 1500, "expenses": 900 }
  ],
  "nameKey": "month",
  "dataKeys": ["sales", "expenses"]
}

Here is the document content:
---
{DOCUMENT_CONTENT}
---

Now, analyze the text and provide the JSON output. If no usable data is found, return an empty structure like {"chartData": [], "nameKey": "", "dataKeys": []}.
`;

export const extractDataFromDocument = async (textContent: string): Promise<ChartDataResponse> => {
    try {
        const prompt = promptTemplate.replace('{DOCUMENT_CONTENT}', textContent);
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        
        let jsonString = response.text;
        
        // FIX: Add a check to ensure the response text is not empty or undefined.
        if (!jsonString) {
            throw new Error("The AI response was empty. This can happen if the content is blocked for safety reasons or if the model could not find any data to process.");
        }

        // Clean the response to ensure it's valid JSON.
        // The model might return the JSON wrapped in markdown ```json ... ``` or with leading text.
        const startIndex = jsonString.indexOf('{');
        const endIndex = jsonString.lastIndexOf('}');
        
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
            throw new Error("AI response did not contain a valid JSON object.");
        }
        
        jsonString = jsonString.substring(startIndex, endIndex + 1);

        const parsedData = JSON.parse(jsonString);

        // Sanitize data: Ensure numeric values are numbers, handling potential formatting like commas.
        if (parsedData.chartData && Array.isArray(parsedData.chartData) && parsedData.dataKeys) {
            parsedData.chartData = parsedData.chartData.map((row: any) => {
                const newRow = { ...row };
                parsedData.dataKeys.forEach((key: string) => {
                     if (newRow[key] !== undefined && typeof newRow[key] === 'string') {
                        // Remove commas before parsing to handle formatted numbers
                        const num = parseFloat(newRow[key].replace(/,/g, ''));
                        if (!isNaN(num)) {
                            newRow[key] = num;
                        }
                    }
                });
                return newRow;
            });
        }

        return parsedData as ChartDataResponse;

    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's response. The data structure might be invalid or incomplete.");
        }
        if (error.message && (error.message.includes('xhr error') || error.message.toLowerCase().includes('failed to fetch'))) {
            throw new Error('A network error occurred while communicating with the AI. Please check your connection and try again.');
        }
        if (error.message && (error.message.includes('AI response') || error.message.includes('The AI response was empty'))) {
            throw error;
        }
        throw new Error("An unexpected error occurred while processing the document with the AI. The model may not have been able to find usable data. Please try again or use a different file.");
    }
};
