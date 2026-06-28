'use client';

import { useState, useRef, useId, useCallback, useEffect, useReducer, MutableRefObject } from 'react';
import { IConstraintChange } from '@/src/lib/db/models/InterviewSession';
import { useSimulationEngine } from '@/src/hooks/useSimulationEngine';
import { SimulationResult } from '@/src/lib/simulation/engine';
import { SimulationControls } from './SimulationControls';
import { useCanvasPanels } from './CanvasPanelsContext';
import { Whiteboard } from './Whiteboard';

// Color mapping for different component types
const COLOR_MAP: Record<string, { text: string; darkText: string }> = {
  Client: { text: 'text-blue-400', darkText: 'dark:text-blue-400' },
  Server: { text: 'text-purple-400', darkText: 'dark:text-purple-400' },
  Function: { text: 'text-indigo-400', darkText: 'dark:text-indigo-400' },
  Worker: { text: 'text-violet-400', darkText: 'dark:text-violet-400' },
  Container: { text: 'text-sky-400', darkText: 'dark:text-sky-400' },
  Gateway: { text: 'text-amber-400', darkText: 'dark:text-amber-400' },
  LB: { text: 'text-orange-400', darkText: 'dark:text-orange-400' },
  CDN: { text: 'text-teal-400', darkText: 'dark:text-teal-400' },
  DNS: { text: 'text-lime-400', darkText: 'dark:text-lime-400' },
  Firewall: { text: 'text-rose-400', darkText: 'dark:text-rose-400' },
  Proxy: { text: 'text-fuchsia-400', darkText: 'dark:text-fuchsia-400' },
  SQL: { text: 'text-emerald-400', darkText: 'dark:text-emerald-400' },
  NoSQL: { text: 'text-green-400', darkText: 'dark:text-green-400' },
  Cache: { text: 'text-red-400', darkText: 'dark:text-red-400' },
  Blob: { text: 'text-yellow-400', darkText: 'dark:text-yellow-400' },
  Search: { text: 'text-orange-400', darkText: 'dark:text-orange-400' },
  GraphDB: { text: 'text-indigo-400', darkText: 'dark:text-indigo-400' },
  Queue: { text: 'text-pink-400', darkText: 'dark:text-pink-400' },
  Kafka: { text: 'text-cyan-400', darkText: 'dark:text-cyan-400' },
  PubSub: { text: 'text-purple-400', darkText: 'dark:text-purple-400' },
  WebSocket: { text: 'text-teal-400', darkText: 'dark:text-teal-400' },
  Logger: { text: 'text-slate-300', darkText: 'dark:text-slate-300' },
  Metrics: { text: 'text-emerald-400', darkText: 'dark:text-emerald-400' },
  Tracer: { text: 'text-amber-400', darkText: 'dark:text-amber-400' },
  Auth: { text: 'text-sky-400', darkText: 'dark:text-sky-400' },
  WAF: { text: 'text-rose-400', darkText: 'dark:text-rose-400' },
  Vault: { text: 'text-violet-400', darkText: 'dark:text-violet-400' },
};

// Friendly default labels assigned when a component is dropped onto the canvas
const DEFAULT_LABELS: Record<string, string> = {
  Client: 'Client App',
  Server: 'App Server',
  Function: 'Lambda',
  Worker: 'Background Worker',
  Container: 'Container',
  Gateway: 'API Gateway',
  LB: 'Load Balancer',
  CDN: 'CDN',
  DNS: 'DNS',
  Firewall: 'Firewall',
  Proxy: 'Reverse Proxy',
  SQL: 'SQL Database',
  NoSQL: 'NoSQL DB',
  Cache: 'Redis Cache',
  Blob: 'Blob Storage',
  Search: 'Search Index',
  GraphDB: 'Graph DB',
  Queue: 'Message Queue',
  Kafka: 'Event Stream',
  PubSub: 'Pub/Sub',
  WebSocket: 'WebSocket',
  Logger: 'Log Aggregator',
  Metrics: 'Metrics',
  Tracer: 'Distributed Tracer',
  Auth: 'Auth Service',
  WAF: 'WAF',
  Vault: 'Secret Vault',
};

export type CanvasNode = {
  id: string;
  type: string;
  icon: string;
  x: number;
  y: number;
  label?: string;
};

export type Connection = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

type CanvasState = {
  nodes: CanvasNode[];
  connections: Connection[];
};

type HistoryState = {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
};

type HistoryAction =
  | { type: 'SET'; payload: CanvasState }
  | { type: 'RESET'; payload: CanvasState }
  | { type: 'UNDO' }
  | { type: 'REDO' };

type ToolMode = 'select' | 'pan' | 'erase';

// Default empty canvas
const DEFAULT_NODES: CanvasNode[] = [];
const DEFAULT_CONNECTIONS: Connection[] = [];

export interface CanvasStateRef {
  nodes: CanvasNode[];
  connections: Connection[];
}

interface DesignCanvasProps {
  initialNodes?: CanvasNode[];
  initialConnections?: Connection[];
  initialTargetRps?: number;
  initialWhiteboardData?: string;
  onSave?: (nodes: CanvasNode[], connections: Connection[], whiteboardData?: string) => void;
  readOnly?: boolean;
  /** Live ref to current canvas state — updated on every change */
  stateRef?: MutableRefObject<CanvasStateRef | null>;
  /** Array of active constraint changes to visually impact the canvas */
  activeConstraints?: IConstraintChange[];
  /** Callback fired when the simulation status changes so parent can validate */
  onSimulationChange?: (metrics: SimulationResult) => void;
  /** Whether to show the Whiteboard tab */
  enableWhiteboard?: boolean;
}

const MAX_HISTORY = 50;

// History reducer - handles undo/redo atomically
function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET': {
      const newPast = [...state.past, state.present];
      // Trim if exceeding max history
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return {
        past: newPast,
        present: action.payload,
        future: [], // Clear future on new action
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case 'RESET': {
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    }
    default:
      return state;
  }
}

export function DesignCanvas({
  initialNodes = DEFAULT_NODES,
  initialConnections = DEFAULT_CONNECTIONS,
  initialTargetRps = 10000,
  initialWhiteboardData,
  onSave,
  readOnly = false,
  stateRef,
  activeConstraints = [],
  onSimulationChange,
  enableWhiteboard = false,
}: DesignCanvasProps) {
  const arrowId = useId();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // History state with reducer (atomic updates)
  const [historyState, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { nodes: initialNodes, connections: initialConnections },
    future: [],
  });

  const { nodes, connections } = historyState.present;
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  // Panels context — sync selected node so PropertiesPanel can react
  const { setSelectedNode, activeView, setActiveView } = useCanvasPanels();

  const [whiteboardData, setWhiteboardData] = useState<string | undefined>(initialWhiteboardData);
  const whiteboardDataRef = useRef(whiteboardData);
  useEffect(() => { whiteboardDataRef.current = whiteboardData; }, [whiteboardData]);

  // Sync reducer when initial data arrives asynchronously
  const initialDataLoadedRef = useRef(initialNodes.length > 0 || initialConnections.length > 0);
  useEffect(() => {
    if (initialDataLoadedRef.current) return;
    if (initialNodes.length > 0 || initialConnections.length > 0) {
      initialDataLoadedRef.current = true;
      dispatch({ type: 'RESET', payload: { nodes: initialNodes, connections: initialConnections } });
    }
    if (initialWhiteboardData && !whiteboardDataRef.current) {
        setWhiteboardData(initialWhiteboardData);
    }
  }, [initialNodes, initialConnections, initialWhiteboardData]);

  // Keep stateRef in sync so parent can read current canvas state at any time
  useEffect(() => {
    if (stateRef) {
      stateRef.current = { nodes, connections };
    }
  }, [nodes, connections, stateRef]);

  // Simulation Engine State
  const [isSimulationRunningRaw, setIsSimulationRunning] = useState(false);
  const isSimulationRunning = isSimulationRunningRaw && !readOnly;
  const [targetRps, setTargetRps] = useState(initialTargetRps);

  // Keep targetRps in sync when the prop changes
  useEffect(() => {
    setTargetRps(initialTargetRps);
  }, [initialTargetRps]);

  const simulationMetrics = useSimulationEngine(nodes, connections, targetRps, isSimulationRunning);
  const bottleneckCount = Object.values(simulationMetrics.nodeMetrics).filter((m) => m.status === 'bottlenecked').length;
  const warningCount = Object.values(simulationMetrics.nodeMetrics).filter((m) => m.status === 'warning').length;

  // Expose simulation changes to parent
  useEffect(() => {
    if (onSimulationChange) {
        onSimulationChange(simulationMetrics);
    }
  }, [simulationMetrics, onSimulationChange]);

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Inline label editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Inline label editing state - Connections
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingConnectionLabel, setEditingConnectionLabel] = useState('');
  const connectionLabelInputRef = useRef<HTMLInputElement>(null);

  const editResolvedRef = useRef(false);
  const connectionEditResolvedRef = useRef(false);
  const skipNextDebouncedSaveRef = useRef(false);

  // Tool mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // Zoom and pan
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Auto-fit helper for readOnly mode
  useEffect(() => {
    if (!readOnly || nodes.length === 0) return;

    const container = canvasRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const NODE_WIDTH = 160;
          const NODE_HEIGHT = 64;
          const PADDING = 60;

          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const node of nodes) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + NODE_WIDTH);
            maxY = Math.max(maxY, node.y + NODE_HEIGHT);
          }

          const contentW = maxX - minX + PADDING * 2;
          const contentH = maxY - minY + PADDING * 2;

          const scaleX = width / contentW;
          const scaleY = height / contentH;
          const fitScale = Math.min(scaleX, scaleY, 1);
          const clampedScale = Math.max(0.5, Math.round(fitScale * 100) / 100);

          const offsetX = (width - contentW * clampedScale) / 2 - (minX - PADDING) * clampedScale;
          const offsetY = (height - contentH * clampedScale) / 2 - (minY - PADDING) * clampedScale;

          setZoom(Math.round(clampedScale * 100));
          setPanOffset({ x: offsetX, y: offsetY });
        }, 150);
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [readOnly, nodes]);

  // Drag state for moving nodes
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempNodes, setTempNodes] = useState<CanvasNode[] | null>(null);

  // Drop from palette
  const [isDragOver, setIsDragOver] = useState(false);

  // Connection drawing state
  const [isDrawingConnection, setIsDrawingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const displayNodes = tempNodes ?? nodes;
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const saveToHistory = useCallback((newNodes: CanvasNode[], newConnections: Connection[]) => {
    dispatch({ type: 'SET', payload: { nodes: newNodes, connections: newConnections } });
  }, []);

  // Debounced auto-save to database
  useEffect(() => {
    if (!onSave) return;
    if (skipNextDebouncedSaveRef.current) {
      skipNextDebouncedSaveRef.current = false;
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onSave(nodes, connections, whiteboardDataRef.current);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, connections, onSave]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
    setSelectedNodeId(null);
    setSelectedNode(null);
    setSelectedConnectionId(null);
    setTempNodes(null);
  }, [dispatch, setSelectedNode]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
    setSelectedNodeId(null);
    setSelectedNode(null);
    setSelectedConnectionId(null);
    setTempNodes(null);
  }, [dispatch, setSelectedNode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  // Get color classes for node type
  const getColorClasses = (type: string) => {
    return COLOR_MAP[type] || { text: 'text-slate-400', darkText: 'dark:text-slate-400' };
  };

  // Helper to compute connection endpoint coordinates (side-to-side graph lines routing)
  const getConnectionCoords = (fromId: string, toId: string) => {
    const nodeList = displayNodes;
    const fromNode = nodeList.find((n) => n.id === fromId);
    const toNode = nodeList.find((n) => n.id === toId);
    if (!fromNode || !toNode) return null;

    // Output from right edge center, input to left edge center
    return {
      fromX: fromNode.x + 160,
      fromY: fromNode.y + 32,
      toX: toNode.x,
      toY: toNode.y + 32
    };
  };

  // Calculate bezier path between two nodes
  const getConnectionPath = (fromId: string, toId: string): string => {
    const coords = getConnectionCoords(fromId, toId);
    if (!coords) return '';

    const { fromX, fromY, toX, toY } = coords;
    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  const getConnectionMidpoint = (fromId: string, toId: string): { x: number, y: number } | null => {
    const coords = getConnectionCoords(fromId, toId);
    if (!coords) return null;
    return { x: (coords.fromX + coords.toX) / 2, y: (coords.fromY + coords.toY) / 2 };
  };

  // Get path for connection being drawn
  const getDrawingPath = (): string => {
    if (!connectionStart) return '';
    const fromNode = displayNodes.find((n) => n.id === connectionStart);
    if (!fromNode) return '';

    const scale = zoom / 100;
    const fromX = fromNode.x + 160;
    const fromY = fromNode.y + 32;
    const toX = (mousePos.x - panOffset.x) / scale;
    const toY = (mousePos.y - panOffset.y) / scale;

    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  // Handle dropping a new component from palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsDragOver(false);

    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    try {
      const component = JSON.parse(data);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scale = zoom / 100;
      const x = (e.clientX - rect.left - panOffset.x) / scale - 80;
      const y = (e.clientY - rect.top - panOffset.y) / scale - 32;

      const newNode: CanvasNode = {
        id: generateId(),
        type: component.type,
        icon: component.icon,
        x: Math.max(0, x),
        y: Math.max(0, y),
        label: DEFAULT_LABELS[component.type] || component.type,
      };

      const newNodes = [...nodes, newNode];
      saveToHistory(newNodes, connections);
      setSelectedNodeId(newNode.id);
      setSelectedNode({ id: newNode.id, type: newNode.type, label: newNode.label, icon: newNode.icon });
      setSelectedConnectionId(null);
    } catch (err) {
      console.error('Failed to parse dropped component:', err);
    }
  }, [nodes, connections, zoom, panOffset, saveToHistory, readOnly, setSelectedNode]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [toolMode, panOffset]);

  // Handle node mouse down
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();

    if (toolMode === 'pan') return;

    if (toolMode === 'erase') {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newConnections = connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
      saveToHistory(newNodes, newConnections);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
      return;
    }

    if (e.shiftKey) {
      setIsDrawingConnection(true);
      setConnectionStart(nodeId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setSelectedNode({ id: node.id, type: node.type, label: node.label, icon: node.icon });

    setDraggedNodeId(nodeId);
    setTempNodes([...nodes]);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = zoom / 100;
    setDragOffset({
      x: (e.clientX - rect.left - panOffset.x) / scale - node.x,
      y: (e.clientY - rect.top - panOffset.y) / scale - node.y,
    });
  }, [nodes, connections, toolMode, zoom, panOffset, saveToHistory, readOnly, setSelectedNode]);

  // Handle node mouse up
  const handleNodeMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();

    if (isDrawingConnection && connectionStart && connectionStart !== nodeId) {
      const exists = connections.some(
        (c) => c.from === connectionStart && c.to === nodeId
      );

      if (!exists) {
        const newConnection: Connection = {
          id: `conn-${generateId()}`,
          from: connectionStart,
          to: nodeId,
        };
        const newConnections = [...connections, newConnection];
        saveToHistory(nodes, newConnections);
      }
    }

    if (draggedNodeId && tempNodes) {
      saveToHistory(tempNodes, connections);
      setTempNodes(null);
    }

    setIsDrawingConnection(false);
    setConnectionStart(null);
    setDraggedNodeId(null);
  }, [isDrawingConnection, connectionStart, connections, nodes, draggedNodeId, tempNodes, saveToHistory, readOnly]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (readOnly && !isPanning) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawingConnection) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (draggedNodeId && toolMode === 'select') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const scale = zoom / 100;
        const newX = (e.clientX - rect.left - panOffset.x) / scale - dragOffset.x;
        const newY = (e.clientY - rect.top - panOffset.y) / scale - dragOffset.y;

        setTempNodes((prev) =>
          prev?.map((node) =>
            node.id === draggedNodeId
              ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
              : node
          ) ?? null
        );
      }
    }
  }, [draggedNodeId, dragOffset, isDrawingConnection, isPanning, panStart, toolMode, zoom, panOffset, readOnly]);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId && tempNodes) {
      saveToHistory(tempNodes, connections);
      setTempNodes(null);
    }
    setDraggedNodeId(null);
    setIsDrawingConnection(false);
    setConnectionStart(null);
    setIsPanning(false);
  }, [draggedNodeId, tempNodes, connections, saveToHistory]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-node]') || target.closest('[data-connection]')) {
      return;
    }
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setSelectedNode(null);
    setEditingNodeId(null);
    setEditingConnectionId(null);
  }, [setSelectedNode]);

  const handleLabelDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    editResolvedRef.current = false;
    setEditingNodeId(nodeId);
    setEditingLabel(node.label || '');
    setTimeout(() => labelInputRef.current?.focus(), 0);
  }, [readOnly, nodes]);

  const handleLabelSubmit = useCallback((nodeId: string) => {
    const trimmed = editingLabel.trim();
    if (!trimmed) {
      editResolvedRef.current = true;
      setEditingNodeId(null);
      return;
    }
    const newNodes = nodes.map(n =>
      n.id === nodeId ? { ...n, label: trimmed } : n
    );
    saveToHistory(newNodes, connections);
    editResolvedRef.current = true;
    setEditingNodeId(null);

    if (onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      skipNextDebouncedSaveRef.current = true;
      onSave(newNodes, connections, whiteboardDataRef.current);
    }
  }, [editingLabel, nodes, connections, saveToHistory, onSave]);

  const handleConnectionLabelDoubleClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const conn = connections.find(c => c.id === connectionId);
    if (!conn) return;
    connectionEditResolvedRef.current = false;
    setEditingConnectionId(connectionId);
    setEditingConnectionLabel(conn.label || '');
    setTimeout(() => connectionLabelInputRef.current?.focus(), 0);
  }, [readOnly, connections]);

  const handleConnectionLabelSubmit = useCallback((connectionId: string) => {
    const trimmed = editingConnectionLabel.trim();
    const conn = connections.find(c => c.id === connectionId);
    if (!conn || trimmed === (conn.label || '')) {
      connectionEditResolvedRef.current = true;
      setEditingConnectionId(null);
      return;
    }

    const newConnections = connections.map(c =>
      c.id === connectionId ? { ...c, label: trimmed || undefined } : c
    );
    saveToHistory(nodes, newConnections);
    connectionEditResolvedRef.current = true;
    setEditingConnectionId(null);

    if (onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      skipNextDebouncedSaveRef.current = true;
      onSave(nodes, newConnections, whiteboardDataRef.current);
    }
  }, [editingConnectionLabel, nodes, connections, saveToHistory, onSave]);

  const handleDeleteSelected = useCallback(() => {
    if (readOnly) return;
    if (selectedNodeId) {
      const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const newConnections = connections.filter((c) => c.from !== selectedNodeId && c.to !== selectedNodeId);
      saveToHistory(newNodes, newConnections);
      setSelectedNodeId(null);
      setSelectedNode(null);
    } else if (selectedConnectionId) {
      const newConnections = connections.filter((c) => c.id !== selectedConnectionId);
      saveToHistory(nodes, newConnections);
      setSelectedConnectionId(null);
    }
  }, [selectedNodeId, selectedConnectionId, nodes, connections, saveToHistory, readOnly, setSelectedNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      if (activeView === 'whiteboard') return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (selectedNodeId || selectedConnectionId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (e.key.toLowerCase() === 'v') setToolMode('select');
        if (e.key.toLowerCase() === 'h') setToolMode('pan');
        if (e.key.toLowerCase() === 'e') setToolMode('erase');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, handleDeleteSelected, handleUndo, handleRedo, readOnly, activeView]);

  const handleWhiteboardSave = useCallback((data: string) => {
    setWhiteboardData(data);
    if (onSave) {
        onSave(nodes, connections, data);
    }
  }, [nodes, connections, onSave]);

  return (
    <main
      ref={canvasRef}
      tabIndex={0}
      className={`relative flex-1 bg-[#060810] overflow-hidden focus:outline-none select-none ${toolMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : toolMode === 'erase' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* View Toggle Tabs */}
      {enableWhiteboard && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex bg-[#0c0d16]/80 backdrop-blur-md p-1 rounded-lg border border-white/[0.06] shadow-lg font-mono text-[9px] uppercase tracking-wider">
            <button
                onClick={() => setActiveView('architecture')}
                className={`px-3 py-1 font-semibold rounded transition-all cursor-pointer ${
                    activeView === 'architecture' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-white/40 hover:text-white/80'
                }`}
            >
                Architecture
            </button>
            <button
                onClick={() => setActiveView('whiteboard')}
                className={`px-3 py-1 font-semibold rounded transition-all cursor-pointer ${
                    activeView === 'whiteboard' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-white/40 hover:text-white/80'
                }`}
            >
                Whiteboard
            </button>
          </div>
      )}

      {activeView === 'whiteboard' && enableWhiteboard ? (
        <div
            className="absolute inset-0 z-40 bg-[#060810]"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <Whiteboard
                initialData={whiteboardData}
                onSave={handleWhiteboardSave}
                readOnly={readOnly}
            />
        </div>
      ) : (
        <>
          {/* Blueprint Grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 211, 238, 0.015) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(34, 211, 238, 0.015) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
              opacity: zoom < 45 ? 0.2 : 0.85,
              transition: 'opacity 0.25s ease',
            }}
          />

          {/* Vignette Depth Shadow Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(6,8,16,0.6)_100%)]" />

          <style>{`
            @keyframes dash {
              to { stroke-dashoffset: -10; }
            }
          `}</style>
          
          {!readOnly && (
            <SimulationControls 
               isRunning={isSimulationRunning} 
               targetRps={targetRps} 
               globalStatus={simulationMetrics.globalStatus}
               bottleneckCount={bottleneckCount}
               warningCount={warningCount}
               onToggle={setIsSimulationRunning} 
               onChangeRps={setTargetRps} 
            />
          )}

          {/* Tooltip instructions */}
          {!readOnly && (
            <div className="absolute top-4 left-4 bg-[#0c0d16]/90 border border-white/[0.04] text-[8px] font-mono tracking-widest text-white/30 p-3 rounded-lg z-50 max-w-xs uppercase space-y-1.5 shadow-xl select-none">
              <p className="font-bold text-white/60 mb-2">OPERATIONAL CONSOLE</p>
              <ul className="space-y-1 text-white/30">
                <li>• Drag items from catalog</li>
                <li>• Click + drag nodes to move</li>
                <li>• Shift + click node to link</li>
                <li>• Delete key to decommission</li>
                <li>• Double click to name</li>
                <li>• Ctrl+Z Undo / Ctrl+Y Redo</li>
              </ul>
            </div>
          )}

          {/* Drop Zone Indicator */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-45">
              <div className="bg-cyan-500/5 border border-dashed border-cyan-500/20 rounded-xl px-6 py-4 font-mono text-[9px] tracking-wider uppercase text-cyan-400">
                Drop Component in Canvas
              </div>
            </div>
          )}

          {/* Zoomable/Pannable Content Area */}
          <div
            ref={contentRef}
            data-canvas-content
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
            }}
          >
            {/* Connecting Lines Layer */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <marker id={arrowId} markerHeight="5" markerWidth="7" orient="auto" refX="6" refY="2">
                  <polygon fill="rgba(34,211,238,0.45)" points="0 0, 7 2, 0 4"></polygon>
                </marker>
              </defs>

              {/* Active connections */}
              {connections.map((conn) => {
                const isSelected = conn.id === selectedConnectionId;
                const pathD = getConnectionPath(conn.from, conn.to);
                const edgeMetric = simulationMetrics.edgeMetrics[conn.id];
                const isFlowing = isSimulationRunning && edgeMetric && edgeMetric.trafficFlow > 0;

                return (
                  <g key={conn.id}>
                    <path
                      d={pathD}
                      fill="none"
                      markerEnd={`url(#${arrowId})`}
                      stroke={isSelected ? 'rgba(34, 211, 238, 0.8)' : 'rgba(148, 163, 184, 0.15)'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      className="transition-all duration-300"
                    />
                    {isFlowing && (
                      <>
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1.5"
                          strokeDasharray="4,6"
                          className="opacity-60 pointer-events-none"
                          style={{ animation: 'dash 1s linear infinite' }}
                        />
                        <circle r="1.5" fill="#22d3ee" className="opacity-100 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]">
                          <animateMotion
                            dur="0.8s"
                            repeatCount="indefinite"
                            path={pathD}
                          />
                        </circle>
                        <circle r="1.5" fill="#22d3ee" className="opacity-100 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]">
                          <animateMotion
                            dur="0.8s"
                            begin="0.4s"
                            repeatCount="indefinite"
                            path={pathD}
                          />
                        </circle>
                        <circle r="1.5" fill="#22d3ee" className="opacity-100 drop-shadow-[0_0_4px_rgba(34,211,238,0.8)]">
                          <animateMotion
                            dur="0.8s"
                            begin="0.2s"
                            repeatCount="indefinite"
                            path={pathD}
                          />
                        </circle>
                      </>
                    )}
                  </g>
                );
              })}

              {/* Pending connection layout */}
              {isDrawingConnection && connectionStart && (
                <path
                  d={getDrawingPath()}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                  className="opacity-50"
                />
              )}
            </svg>

            {/* Nodes Render Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {displayNodes.map((node) => {
                const colors = getColorClasses(node.type);
                const isSelected = node.id === selectedNodeId;

                const isImpacted = activeConstraints.some(c => c.impactedNodeId === node.id && c.status === 'active');
                const nodeMetric = simulationMetrics.nodeMetrics[node.id];
                const isBottlenecked = isSimulationRunning && nodeMetric?.status === 'bottlenecked';
                const isWarning = isSimulationRunning && nodeMetric?.status === 'warning';

                return (
                  <div
                    key={node.id}
                    data-node
                    style={{ transform: `translate(${node.x}px, ${node.y}px)`, willChange: 'transform' }}
                    className={`absolute top-0 left-0 w-[160px] h-[64px] rounded-xl flex items-center p-3 select-none bg-[#0c0d16]/90 backdrop-blur-md border transition-all duration-200 pointer-events-auto shadow-lg group ${
                      isImpacted
                        ? 'border-red-500/40 bg-red-500/[0.04] opacity-90 z-20'
                        : isBottlenecked
                        ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)] text-white z-20'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.08)] text-amber-400 z-20'
                        : isSelected
                        ? 'border-cyan-500/50 shadow-[0_0_25px_rgba(34,211,238,0.12)] bg-[#0c0d16] z-20'
                        : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-[#0c0d16] z-10'
                    }`}
                    onMouseDown={(e) => {
                      if (isImpacted) {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setSelectedNode({ id: node.id, type: node.type, label: node.label, icon: node.icon });
                        return;
                      }
                      handleNodeMouseDown(e, node.id);
                    }}
                    onMouseUp={(e) => {
                      if (isImpacted) {
                        e.stopPropagation();
                        return;
                      }
                      handleNodeMouseUp(e, node.id);
                    }}
                  >
                    {isBottlenecked && !isImpacted && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-500/90 text-[7px] text-white font-bold font-mono tracking-widest px-1.5 py-0.5 rounded shadow z-40 uppercase border border-red-400/20 whitespace-nowrap animate-pulse">
                        LIMIT REACHED
                      </div>
                    )}
                    
                    {isSimulationRunning && nodeMetric && node.type !== 'Client' && (
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/85 text-[7px] font-mono tracking-widest text-white/50 px-1 py-0.5 rounded shadow-md border border-white/[0.03] whitespace-nowrap uppercase">
                        {(nodeMetric.trafficIn / 1000).toFixed(1)}k / {(nodeMetric.capacity / 1000).toFixed(1)}k RPS
                      </div>
                    )}

                    {/* Left Icon Panel */}
                    <div className="flex-shrink-0 size-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mr-3 group-hover:bg-white/[0.05] transition-colors">
                      <span className={`material-symbols-outlined text-[16px] drop-shadow-md ${colors.text} ${colors.darkText}`}>
                        {node.icon}
                      </span>
                    </div>

                    {/* Center Text Panel */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                      {editingNodeId === node.id ? (
                        <input
                          ref={labelInputRef}
                          type="text"
                          value={editingLabel}
                          maxLength={20}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleLabelSubmit(node.id);
                            if (e.key === 'Escape') {
                              editResolvedRef.current = true;
                              setEditingNodeId(null);
                            }
                            e.stopPropagation();
                          }}
                          onBlur={() => {
                            if (editResolvedRef.current) return;
                            handleLabelSubmit(node.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="bg-[#060810] border border-cyan-500/50 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white outline-none w-full shadow-inner"
                        />
                      ) : (
                        <span
                          className="text-[9px] font-bold text-white/90 truncate uppercase tracking-wider font-mono cursor-text select-text drop-shadow-sm group-hover:text-white transition-colors"
                          onDoubleClick={(e) => handleLabelDoubleClick(e, node.id)}
                        >
                          {node.label || node.type}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 opacity-60">
                        <span className="text-[7px] font-mono text-white/50 uppercase tracking-widest">
                          GLOBAL-MUM
                        </span>
                        <span className="text-white/20 text-[6px]">·</span>
                        <span className="text-[7px] font-mono text-white/40 uppercase tracking-widest">
                          R:1
                        </span>
                      </div>
                    </div>

                    {/* Right Status LED Dot */}
                    <div className="absolute top-2.5 right-2.5 flex items-center">
                      <span className={`h-1.5 w-1.5 rounded-full ${isImpacted ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : isBottlenecked ? 'bg-red-500 animate-ping' : isWarning ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400/80 shadow-[0_0_6px_rgba(34,211,238,0.4)]'} transition-all duration-300`} />
                    </div>

                    {/* Delete button - top right when selected */}
                    {isSelected && !readOnly && (
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSelected();
                        }}
                        className="absolute -top-2.5 -right-2.5 size-5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center shadow-lg z-30 cursor-pointer transition-colors"
                        title="Delete node"
                      >
                        <span className="material-symbols-outlined text-[11px]">close</span>
                      </button>
                    )}

                    {isImpacted && (
                      <div className="absolute -top-2.5 -right-2.5 size-5 bg-red-600 border border-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-30 animate-pulse">
                        <span className="material-symbols-outlined text-[11px]">warning</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connection click targets layer */}
            <svg
              className="absolute inset-0 pointer-events-none z-[5]"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              {connections.map((conn) => {
                const pathD = getConnectionPath(conn.from, conn.to);
                return (
                  <path
                    key={conn.id}
                    data-connection
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className={`pointer-events-auto ${toolMode === 'erase' ? 'cursor-crosshair' : 'cursor-pointer'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (readOnly) return;
                      if (toolMode === 'erase') {
                        const newConnections = connections.filter((c) => c.id !== conn.id);
                        saveToHistory(nodes, newConnections);
                        setSelectedConnectionId(null);
                      } else {
                        setSelectedConnectionId(conn.id);
                        setSelectedNodeId(null);
                        setSelectedNode(null);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (readOnly || toolMode === 'erase') return;
                      handleConnectionLabelDoubleClick(e, conn.id);
                    }}
                  />
                );
              })}
            </svg>

            {/* Connection labels */}
            <div className="absolute inset-0 z-[15] pointer-events-none">
              {connections.map((conn) => {
                const midpoint = getConnectionMidpoint(conn.from, conn.to);
                if (!midpoint) return null;

                const isEditing = editingConnectionId === conn.id;
                const isSelected = selectedConnectionId === conn.id;

                return (
                  <div
                    key={`label-${conn.id}`}
                    className="absolute flex items-center justify-center"
                    style={{
                      left: midpoint.x,
                      top: midpoint.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {isEditing ? (
                      <input
                        ref={connectionLabelInputRef}
                        type="text"
                        value={editingConnectionLabel}
                        maxLength={25}
                        onChange={(e) => setEditingConnectionLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConnectionLabelSubmit(conn.id);
                          if (e.key === 'Escape') {
                            connectionEditResolvedRef.current = true;
                            setEditingConnectionId(null);
                          }
                          e.stopPropagation();
                        }}
                        onBlur={() => {
                          if (connectionEditResolvedRef.current) return;
                          handleConnectionLabelSubmit(conn.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="bg-[#0c0d16] border border-cyan-500/30 rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-white outline-none w-24 text-center pointer-events-auto"
                        placeholder="HTTP, GRPC"
                      />
                    ) : (
                      <>
                        {conn.label ? (
                          <div
                            className={`text-[8px] font-mono uppercase tracking-wider whitespace-nowrap px-1.5 py-0.5 rounded cursor-pointer shadow-sm transition-colors ${isSelected
                              ? 'bg-cyan-500 text-black font-semibold'
                              : 'bg-[#0c0d16]/90 text-white/50 border border-white/[0.04]'
                              } ${readOnly || toolMode === 'erase' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                            title={conn.label}
                            onClick={(e) => {
                              if (!readOnly) {
                                e.stopPropagation();
                                e.preventDefault();
                              }
                            }}
                            onDoubleClick={(e) => handleConnectionLabelDoubleClick(e, conn.id)}
                            onMouseDown={(e) => {
                              if (readOnly) return;
                              e.stopPropagation();
                              setSelectedConnectionId(conn.id);
                              setSelectedNodeId(null);
                              setSelectedNode(null);
                            }}
                          >
                            {conn.label}
                          </div>
                        ) : (
                          isSelected && !readOnly && (
                            <div
                              className={`text-[8px] font-mono uppercase tracking-wider whitespace-nowrap px-1.5 py-0.5 rounded cursor-pointer bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 transition-colors hover:bg-cyan-500/20 backdrop-blur-sm ${toolMode === 'erase' ? 'pointer-events-none' : 'pointer-events-auto'}`}
                              title="Add label"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConnectionLabelDoubleClick(e, conn.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              + LINK TAG
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating Canvas Controls (Linear/Figma styling) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0a0b10]/95 backdrop-blur-xl border border-white/[0.08] p-1.5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] flex items-center gap-1 z-30 font-mono text-[9px] uppercase tracking-wider transition-all duration-300">
            {!readOnly && (
              <>
                {/* Select Tool */}
                <button
                  onClick={() => setToolMode('select')}
                  className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${toolMode === 'select' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                    }`}
                  title="Select (V)"
                >
                  <span className="material-symbols-outlined text-[16px]">near_me</span>
                </button>

                {/* Pan Tool */}
                <button
                  onClick={() => setToolMode('pan')}
                  className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${toolMode === 'pan' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                    }`}
                  title="Pan (H)"
                >
                  <span className="material-symbols-outlined text-[16px]">pan_tool</span>
                </button>

                {/* Erase Tool */}
                <button
                  onClick={() => setToolMode('erase')}
                  className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${toolMode === 'erase' ? 'bg-red-500/15 text-red-400 shadow-sm' : 'text-white/40 hover:text-red-400 hover:bg-red-500/[0.02]'
                    }`}
                  title="Erase (E)"
                >
                  <span className="material-symbols-outlined text-[16px]">ink_eraser</span>
                </button>

                <div className="w-px h-5 bg-white/[0.06] mx-1.5 rounded-full"></div>

                {/* Undo */}
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${canUndo
                    ? 'text-white/40 hover:text-white/90 hover:bg-white/[0.04]'
                    : 'text-white/15 cursor-not-allowed'
                    }`}
                  title="Undo (Ctrl+Z)"
                >
                  <span className="material-symbols-outlined text-[16px]">undo</span>
                </button>

                {/* Redo */}
                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${canRedo
                    ? 'text-white/40 hover:text-white/90 hover:bg-white/[0.04]'
                    : 'text-white/15 cursor-not-allowed'
                    }`}
                  title="Redo (Ctrl+Y)"
                >
                  <span className="material-symbols-outlined text-[16px]">redo</span>
                </button>

                <div className="w-px h-5 bg-white/[0.06] mx-1.5 rounded-full"></div>
              </>
            )}

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${zoom > 25
                ? 'text-white/40 hover:text-white/90 hover:bg-white/[0.04]'
                : 'text-white/15 cursor-not-allowed'
                }`}
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>

            {/* Zoom Level */}
            <span className="text-[10px] font-mono font-medium text-white/50 w-12 text-center select-none">{zoom}%</span>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className={`size-8 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${zoom < 200
                ? 'text-white/40 hover:text-white/90 hover:bg-white/[0.04]'
                : 'text-white/15 cursor-not-allowed'
                }`}
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}