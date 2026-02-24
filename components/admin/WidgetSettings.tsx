/* eslint-disable */
'use client';

import { useWidgetConfig } from './WidgetConfigContext';
import { Layout, BarChart, PieChart, Check } from 'lucide-react';

export default function WidgetSettings() {
    const { config, updateConfig, saveConfig } = useWidgetConfig();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Dashboard Visibility</h2>
                <div className="space-y-4">
                    <Toggle
                        label="Show Map"
                        checked={config.showPollingStationMap}
                        onChange={v => updateConfig('showPollingStationMap', v)}
                    />
                    <Toggle
                        label="Show Party Performance"
                        checked={config.showPartyPerformance}
                        onChange={v => updateConfig('showPartyPerformance', v)}
                    />
                    <Toggle
                        label="Show Category Distribution"
                        checked={config.showCategoryDistribution}
                        onChange={v => updateConfig('showCategoryDistribution', v)}
                    />
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Chart Types</h2>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium mb-2">Party Performance Chart</label>
                        <div className="flex gap-2">
                            <ChartOption
                                type="bar"
                                selected={config.partyPerformanceChartType === 'bar'}
                                onClick={() => updateConfig('partyPerformanceChartType', 'bar')}
                            />
                            <ChartOption
                                type="pie"
                                selected={config.partyPerformanceChartType === 'pie'}
                                onClick={() => updateConfig('partyPerformanceChartType', 'pie')}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Category Dist. Chart</label>
                        <div className="flex gap-2">
                            <ChartOption
                                type="bar"
                                selected={config.categoryDistributionChartType === 'bar'}
                                onClick={() => updateConfig('categoryDistributionChartType', 'bar')}
                            />
                            <ChartOption
                                type="pie"
                                selected={config.categoryDistributionChartType === 'pie'}
                                onClick={() => updateConfig('categoryDistributionChartType', 'pie')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={saveConfig}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
                <Check size={18} /> Save Configuration
            </button>
        </div>
    );
}

function Toggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium text-gray-700">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function ChartOption({ type, selected, onClick }: { type: 'bar' | 'pie', selected: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 w-24 transition-all ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200 text-gray-500'
                }`}
        >
            {type === 'bar' ? <BarChart size={24} /> : <PieChart size={24} />}
            <span className="text-xs uppercase font-bold">{type}</span>
        </button>
    );
}
