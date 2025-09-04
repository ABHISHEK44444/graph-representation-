import React, { useState, useEffect, useMemo } from 'react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Cell, LabelList, ComposedChart } from 'recharts';
import type { ChartDataResponse } from '../types';
import { CHART_COLORS } from '../constants';
import { BarChartIcon, ResetIcon, TableIcon } from './icons';

interface ChartPanelProps {
  dataSets: [ChartDataResponse, ChartDataResponse];
  fileNames: [string, string];
  onReset: () => void;
}

// Helper function to calculate lighter/darker shades of a color
const shadeColor = (color: string, percent: number) => {
    // FIX: Add a guard to prevent crashes if the color prop is undefined or not a valid hex string.
    if (!color || !color.startsWith('#')) {
        return color || '#cccccc'; // Return original value or a fallback gray
    }
    
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = Math.round(R * (100 + percent) / 100);
    G = Math.round(G * (100 + percent) / 100);
    B = Math.round(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
};

// Custom shape component for the 3D cylindrical bars
const CylindricalBar = (props: any) => {
    const { fill, x, y, width, height } = props;

    // Add a guard for the fill prop to prevent crashes.
    const safeFill = fill || '#cccccc';

    if (height <= 0 || width <= 0) return null; // Don't render if there's no height/width

    const safeWidth = Math.max(width, 1);
    const ellipseHeight = Math.min(Math.max(8, safeWidth * 0.2), height); // Ensure ellipse isn't taller than the bar
    const bodyHeight = height - ellipseHeight;

    const lighterFill = shadeColor(safeFill, 20);
    const darkerFill = shadeColor(safeFill, -20);
    const gradientId = `gradient-${safeFill.replace(/#/g, '')}`;

    return (
        <g>
            {/* Reflection / Shadow */}
            <ellipse
                cx={x + safeWidth / 2}
                cy={y + height + 4}
                rx={safeWidth / 2}
                ry={ellipseHeight / 1.5}
                fill={safeFill}
                opacity="0.2"
                filter="url(#blur-effect)"
            />
            {/* Main Body */}
            <rect
                x={x}
                y={y + ellipseHeight / 2}
                width={safeWidth}
                height={bodyHeight}
                fill={`url(#${gradientId})`}
            />
            {/* Bottom part of cylinder */}
            <ellipse
                cx={x + safeWidth / 2}
                cy={y + height}
                rx={safeWidth / 2}
                ry={ellipseHeight / 2}
                fill={darkerFill}
            />
            {/* Top Cap */}
            <ellipse
                cx={x + safeWidth / 2}
                cy={y + ellipseHeight / 2}
                rx={safeWidth / 2}
                ry={ellipseHeight / 2}
                fill={lighterFill}
                stroke={shadeColor(safeFill, -5)}
                strokeWidth={0.5}
            />
        </g>
    );
};

// Custom Tooltip for Cartesian Charts (Bar, Line, Area)
const CustomCartesianTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg text-sm w-max">
                <p className="label font-bold text-gray-900 mb-2">{`${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                         <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: pld.fill || pld.stroke }}></div>
                            <span className="capitalize text-gray-700">{pld.name}: </span>
                         </div>
                        <span className="font-semibold ml-4 text-gray-800">{typeof pld.value === 'number' ? pld.value.toLocaleString() : pld.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const TabButton: React.FC<{
  label: string;
  fileName: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, fileName, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-indigo-600 text-white shadow'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
        title={fileName}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const DataKeySelector: React.FC<{ dataKeys: string[], selectedKey: string, onSelect: (key: string) => void }> = ({ dataKeys, selectedKey, onSelect }) => {
    return (
        <div className="relative">
            <label htmlFor="metric-select" className="sr-only">Select metric</label>
            <select
                id="metric-select"
                value={selectedKey}
                onChange={(e) => onSelect(e.target.value)}
                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md pl-3 pr-8 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 block w-full appearance-none transition"
            >
                {dataKeys.map(key => (
                    <option key={key} value={key} className="bg-white">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </option>
                ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
    );
};


const BarChartView: React.FC<{ data: ChartDataResponse }> = ({ data }) => {
    const { chartData, nameKey, dataKeys } = data;
    const [barDataKey, setBarDataKey] = useState<string>(dataKeys[0] || '');

    useEffect(() => {
        if (!dataKeys.includes(barDataKey)) {
            setBarDataKey(dataKeys[0] || '');
        }
    }, [dataKeys, barDataKey]);

    const barDefs = useMemo(() => (
        <defs>
            {CHART_COLORS.map((color) => {
                const gradientId = `gradient-${color.replace(/#/g, '')}`;
                return (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={shadeColor(color, -20)} />
                        <stop offset="50%" stopColor={shadeColor(color, 15)} />
                        <stop offset="100%" stopColor={shadeColor(color, -20)} />
                    </linearGradient>
                );
            })}
             <filter id="blur-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
        </defs>
    ), []);

    return (
        <div className="flex flex-col gap-4 h-full">
            {dataKeys.length > 1 && (
                <div className="flex justify-end">
                    <DataKeySelector
                        dataKeys={dataKeys}
                        selectedKey={barDataKey}
                        onSelect={setBarDataKey}
                    />
                </div>
            )}
            <div className="flex-grow h-96 md:h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 20 }}>
                        {barDefs}
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis dataKey={nameKey} stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomCartesianTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.6)' }} />
                        <Bar dataKey={barDataKey} shape={<CylindricalBar />} barSize={100}>
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                            <LabelList
                                dataKey={barDataKey}
                                position="top"
                                offset={10}
                                formatter={(value: number) => typeof value === 'number' ? value.toLocaleString() : ''}
                                style={{ fill: '#374151', fontSize: 12, fontWeight: 600 }}
                            />
                        </Bar>
                        <Line
                            type="monotone"
                            dataKey={barDataKey}
                            stroke={CHART_COLORS[3]} /* Amber 500 */
                            strokeWidth={2}
                            dot={{ stroke: CHART_COLORS[3], strokeWidth: 2, r: 4, fill: 'white' }}
                            activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS[3] }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const TableView: React.FC<{ data: ChartDataResponse }> = ({ data }) => {
    const { chartData, nameKey, dataKeys } = data;
    const headers = [nameKey, ...dataKeys];
    return (
        <div className="w-full rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {header.charAt(0).toUpperCase() + header.slice(1)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {chartData.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                            {headers.map(header => (
                                <td key={`${rowIndex}-${header}`} className="px-6 py-4 text-sm text-gray-700 break-words">
                                    {typeof row[header] === 'number' ? (row[header] as number).toLocaleString() : row[header]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export const ChartPanel: React.FC<ChartPanelProps> = ({ dataSets, fileNames, onReset }) => {
    const [activeTab, setActiveTab] = useState<'chart1' | 'chart2' | 'table1' | 'table2'>('chart1');
    
    const tabs = [
        { id: 'chart1', label: 'Chart 1', icon: <BarChartIcon className="w-5 h-5" />, fileName: fileNames[0] },
        { id: 'chart2', label: 'Chart 2', icon: <BarChartIcon className="w-5 h-5" />, fileName: fileNames[1] },
        { id: 'table1', label: 'Table 1', icon: <TableIcon className="w-5 h-5" />, fileName: fileNames[0] },
        { id: 'table2', label: 'Table 2', icon: <TableIcon className="w-5 h-5" />, fileName: fileNames[1] },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'chart1': return <BarChartView data={dataSets[0]} />;
            case 'chart2': return <BarChartView data={dataSets[1]} />;
            case 'table1': return <TableView data={dataSets[0]} />;
            case 'table2': return <TableView data={dataSets[1]} />;
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full animate-fade-in">
            <div className="p-2 sm:p-4 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
                    {tabs.map(tab => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            fileName={tab.fileName}
                            icon={tab.icon}
                            isActive={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                        />
                    ))}
                </div>
            </div>
            <div className="p-4">
                {renderContent()}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-xl">
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
                >
                    <ResetIcon className="w-5 h-5" />
                    Analyze New Files
                </button>
            </div>
        </div>
    );
};
