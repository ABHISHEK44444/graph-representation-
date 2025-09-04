
import { GoogleGenAI } from "@google/genai";
import type { ChartDataResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

const promptTemplate = `
You are an expert data analysis engine. Your task is to convert raw text from a document into a specific JSON format for charting.

**CRITICAL JSON OUTPUT RULES:**
Your entire response must be a single JSON object with the following keys: \`chartData\`, \`nameKey\`, and \`dataKeys\`.

1.  **\`nameKey\` (string): The primary categorical key for the chart's X-axis.**
    *   **PRIORITY 1 (Best):** Find the column that contains the most detailed textual descriptions (e.g., "Product Name", "Task Description", "Details"). This should be your first choice for \`nameKey\`.
    *   **PRIORITY 2 (Fallback):** If no highly descriptive column exists, use a general categorical or time-based column (e.g., "Month", "Year", "Category"). This is an acceptable fallback.
    *   **INVALID:** Do not use a column with purely numerical data (e.g., "Sales", "Price") or unique identifiers as the \`nameKey\`.

2.  **\`dataKeys\` (array of strings): The numerical keys for the chart's Y-axis.**
    *   This MUST be an array of keys that point to columns containing ONLY NUMERICAL data.
    *   The \`nameKey\` cannot be included in \`dataKeys\`.

3.  **\`chartData\` (array of objects): The raw data.**
    *   Each object in the array represents a row from the source data.
    *   Values corresponding to keys listed in \`dataKeys\` MUST be converted to numbers (e.g., remove currency symbols like '$', commas, and parse "1,234.50" as 1234.5).

**EXAMPLE 1: DESCRIPTIVE DATA**
Source Data Columns: \`Details | Month | Cost\`
Correct JSON Output:
{
  "chartData": [
    { "Details": "SSD replacement", "Month": "Jan", "Cost": 250 },
    { "Details": "BIOS reset", "Month": "Jan", "Cost": 50 }
  ],
  "nameKey": "Details",
  "dataKeys": ["Cost"]
}
*Explanation: "Details" is the best descriptive column (Priority 1), so it becomes the \`nameKey\`. "Cost" is numerical, so it goes into \`dataKeys\`. "Month" is just other data.*

**EXAMPLE 2: TIME-SERIES DATA**
Source Data Columns: \`Month | Sales\`
Correct JSON Output:
{
  "chartData": [
    { "Month": "Jan", "Sales": 5000 },
    { "Month": "Feb", "Sales": 7500 }
  ],
  "nameKey": "Month",
  "dataKeys": ["Sales"]
}
*Explanation: No descriptive column exists, so the time-based "Month" column is used as the fallback \`nameKey\` (Priority 2).*

Now, analyze the following document text and produce the JSON. If no chartable data is found, return \`{"chartData": [], "nameKey": "", "dataKeys": []}\`.
---
{DOCUMENT_CONTENT}
---

Provide only the JSON object as a response.
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

        // Validate, filter, and sanitize the data from the AI to prevent non-numeric keys in the metric selector.
        if (parsedData.chartData && Array.isArray(parsedData.chartData) && parsedData.dataKeys && Array.isArray(parsedData.dataKeys) && parsedData.chartData.length > 0) {
            // Filter dataKeys to ensure they only point to columns that are entirely numeric.
            const validDataKeys = parsedData.dataKeys.filter((key: string) => {
                // A key is valid if it's not the nameKey and ALL of its values are numeric.
                return key !== parsedData.nameKey && parsedData.chartData.every((row: any) => {
                    const value = row[key];
                    if (value === undefined || value === null || value === '') return true; // Allow sparse data
                    if (typeof value === 'number') return true;
                    if (typeof value === 'string') {
                        const cleanedValue = value.replace(/[\$,]/g, ''); // Handle dollar signs and commas
                        // Check if it's a valid finite number
                        return !isNaN(parseFloat(cleanedValue)) && isFinite(Number(cleanedValue));
                    }
                    return false; // Reject keys with non-numeric values (e.g., objects, booleans).
                });
            });

            parsedData.dataKeys = validDataKeys;
            
            // Sanitize the chartData: ensure all values for the valid dataKeys are numbers.
            parsedData.chartData = parsedData.chartData.map((row: any) => {
                const newRow = { ...row };
                validDataKeys.forEach((key: string) => {
                    const value = newRow[key];
                    if (value !== undefined && value !== null && value !== '') {
                         if (typeof value === 'string') {
                            const num = parseFloat(value.replace(/[\$,]/g, '')); // Handle dollar signs and commas
                            newRow[key] = isNaN(num) ? null : num;
                         } else if (typeof value !== 'number') {
                            // If it's not a string or number (e.g. boolean), nullify it for safety.
                            newRow[key] = null;
                         }
                    } else {
                        // Standardize all forms of "empty" to null for charting libraries.
                        newRow[key] = null;
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
