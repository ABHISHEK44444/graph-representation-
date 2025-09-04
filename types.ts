
export enum ChartType {
  Bar = 'Bar',
  Table = 'Table',
}

export type ChartDataPoint = {
  [key: string]: string | number;
};

export type ChartDataResponse = {
  chartData: ChartDataPoint[];
  nameKey: string;
  dataKeys: string[];
};

export enum MimeType {
    PDF = "application/pdf",
    DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}