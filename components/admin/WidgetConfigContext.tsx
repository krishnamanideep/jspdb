/* eslint-disable */
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type WidgetType = 'bar' | 'pie' | 'line';

export interface WidgetConfig {
    showPollingStationMap: boolean;
    showPartyPerformance: boolean;
    showCategoryDistribution: boolean;
    showVoterTurnout: boolean;
    partyPerformanceChartType: WidgetType;
    categoryDistributionChartType: WidgetType;
}

const defaultConfig: WidgetConfig = {
    showPollingStationMap: true,
    showPartyPerformance: true,
    showCategoryDistribution: true,
    showVoterTurnout: true,
    partyPerformanceChartType: 'bar',
    categoryDistributionChartType: 'pie',
};

const WidgetConfigContext = createContext<{
    config: WidgetConfig;
    updateConfig: (key: keyof WidgetConfig, value: any) => void;
    saveConfig: () => Promise<void>;
}>({
    config: defaultConfig,
    updateConfig: () => { },
    saveConfig: async () => { },
});

export function WidgetConfigProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<WidgetConfig>(defaultConfig);

    // Load config from Server (Firestore)
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const docRef = doc(db, 'settings', 'global_widget_config');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data && Object.keys(data).length > 0) {
                        setConfig(prev => ({ ...prev, ...data }));
                    }
                }
            } catch (e) {
                console.error("Failed to load global config:", e);
            }
        };
        loadConfig();
    }, []);

    const updateConfig = (key: keyof WidgetConfig, value: boolean | WidgetType) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
    };

    const saveConfig = async () => {
        try {
            await setDoc(doc(db, 'settings', 'global_widget_config'), config);
            alert('Configuration saved globally!');
        } catch (e) {
            console.error("Failed to save config remotely", e);
            alert('Failed to save configuration');
        }
    };

    return (
        <WidgetConfigContext.Provider value={{ config, updateConfig, saveConfig }}>
            {children}
        </WidgetConfigContext.Provider>
    );
}

export const useWidgetConfig = () => useContext(WidgetConfigContext);
