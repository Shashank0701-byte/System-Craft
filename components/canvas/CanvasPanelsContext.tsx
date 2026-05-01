'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// Node config stored per node type
export interface NodeConfig {
    nodeCount: number;       // 1-10 replicas/instances
    storageGb: number;       // 10-2000 GB
    readReplicas: boolean;
    shardingStrategy: string;
    consistencyModel: string;
}

const DEFAULT_CONFIG: NodeConfig = {
    nodeCount: 1,
    storageGb: 100,
    readReplicas: false,
    shardingStrategy: 'Consistent Hashing',
    consistencyModel: 'Strong Consistency',
};

export interface SelectedNodeInfo {
    id: string;
    type: string;
    label?: string;
    icon: string;
}

interface CanvasPanelsContextType {
    leftOpen: boolean;
    rightOpen: boolean;
    toggleLeft: () => void;
    toggleRight: () => void;
    closeAll: () => void;
    // Selected node
    selectedNode: SelectedNodeInfo | null;
    setSelectedNode: (node: SelectedNodeInfo | null) => void;
    // Per-node configs keyed by node id
    nodeConfigs: Record<string, NodeConfig>;
    updateNodeConfig: (nodeId: string, patch: Partial<NodeConfig>) => void;
    getNodeConfig: (nodeId: string) => NodeConfig;
}

const CanvasPanelsContext = createContext<CanvasPanelsContextType>({
    leftOpen: false,
    rightOpen: false,
    toggleLeft: () => { },
    toggleRight: () => { },
    closeAll: () => { },
    selectedNode: null,
    setSelectedNode: () => { },
    nodeConfigs: {},
    updateNodeConfig: () => { },
    getNodeConfig: () => DEFAULT_CONFIG,
});

export function CanvasPanelsProvider({ children }: { children: ReactNode }) {
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
    const [nodeConfigs, setNodeConfigs] = useState<Record<string, NodeConfig>>({});

    const toggleLeft = useCallback(() => {
        setLeftOpen(prev => !prev);
        setRightOpen(false);
    }, []);

    const toggleRight = useCallback(() => {
        setRightOpen(prev => !prev);
        setLeftOpen(false);
    }, []);

    const closeAll = useCallback(() => {
        setLeftOpen(false);
        setRightOpen(false);
    }, []);

    const updateNodeConfig = useCallback((nodeId: string, patch: Partial<NodeConfig>) => {
        setNodeConfigs(prev => ({
            ...prev,
            [nodeId]: { ...(prev[nodeId] ?? DEFAULT_CONFIG), ...patch },
        }));
    }, []);

    const getNodeConfig = useCallback((nodeId: string): NodeConfig => {
        return nodeConfigs[nodeId] ?? DEFAULT_CONFIG;
    }, [nodeConfigs]);

    const value = useMemo(() => ({
        leftOpen, rightOpen, toggleLeft, toggleRight, closeAll,
        selectedNode, setSelectedNode,
        nodeConfigs, updateNodeConfig, getNodeConfig,
    }), [leftOpen, rightOpen, toggleLeft, toggleRight, closeAll,
        selectedNode, nodeConfigs, updateNodeConfig, getNodeConfig]);

    return (
        <CanvasPanelsContext.Provider value={value}>
            {children}
        </CanvasPanelsContext.Provider>
    );
}

export const useCanvasPanels = () => useContext(CanvasPanelsContext);
