// FIX: MimeType is an enum used at runtime in the switch statement, so it cannot be a type-only import.
import { MimeType } from '../types';

// These libraries are loaded from script tags in index.html
declare const pdfjsLib: any;
declare const mammoth: any;
declare const XLSX: any;

const readArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const parsePdf = async (file: File): Promise<string> => {
    const arrayBuffer = await readArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((item: any) => item.str).join(' ');
        textContent += '\n\n'; // Add space between pages
    }
    return textContent;
};

const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await readArrayBuffer(file);
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

const parseXlsx = async (file: File): Promise<string> => {
    const arrayBuffer = await readArrayBuffer(file);
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
        fullText += `Sheet: ${sheetName}\n\n`;
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        fullText += csv + '\n\n';
    });
    return fullText;
};

export const parseFileToText = async (file: File): Promise<string> => {
    switch (file.type as MimeType) {
        case MimeType.PDF:
            return parsePdf(file);
        case MimeType.DOCX:
            return parseDocx(file);
        case MimeType.XLSX:
            return parseXlsx(file);
        default:
            throw new Error('Unsupported file type for parsing.');
    }
};