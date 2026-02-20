'use client';

import { useState, useRef, useId, useCallback, useEffect, useReducer, MutableRefObject } from 'react';

// Color mapping for different component types
const COLOR_MAP: Record<string, { text: string; darkText: string }> = {
  Client: { text: 'text-blue-500', darkText: 'dark:text-blue-400' },
  Server: { text: 'text-purple-500', darkText: 'dark:text-purple-400' },
  Function: { text: 'text-indigo-500', darkText: 'dark:text-indigo-400' },
  LB: { text: 'text-orange-500', darkText: 'dark:text-orange-400' },
  CDN: { text: 'text-teal-500', darkText: 'dark:text-teal-400' },
  SQL: { text: 'text-emerald-500', darkText: 'dark:text-emerald-400' },
  Cache: { text: 'text-red-500', darkText: 'dark:text-red-400' },
  Blob: { text: 'text-yellow-600', darkText: 'dark:text-yellow-400' },
  Queue: { text: 'text-pink-500', darkText: 'dark:text-pink-400' },
  Kafka: { text: 'text-cyan-500', darkText: 'dark:text-cyan-400' },
};

// Friendly default labels assigned when a component is dropped onto the canvas
const DEFAULT_LABELS: Record<string, string> = {
  Client: 'Client App',
  Server: 'App Server',
  Function: 'Lambda',
  LB: 'Load Balancer',
  CDN: 'CDN',
  SQL: 'SQL Database',
  Cache: 'Redis Cache',
  Blob: 'Blob Storage',
  Queue: 'Message Queue',
  Kafka: 'Event Stream',
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
  onSave?: (nodes: CanvasNode[], connections: Connection[]) => void;
  readOnly?: boolean;
  /** Live ref to current canvas state — updated on every change */
  stateRef?: MutableRefObject<CanvasStateRef | null>;
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
      // Replace present without pushing old state into undo history.
      // Used for programmatic loads (e.g. async initial data) that aren't user edits.
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
  onSave,
  readOnly = false,
  stateRef
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

  // Sync reducer when initial data arrives asynchronously (e.g. result page fetch)
  const initialDataLoadedRef = useRef(initialNodes.length > 0 || initialConnections.length > 0);
  useEffect(() => {
    // Skip if data was already present at mount time (already in reducer initial state)
    if (initialDataLoadedRef.current) return;
    // Only sync once when real data arrives
    if (initialNodes.length > 0 || initialConnections.length > 0) {
      initialDataLoadedRef.current = true;
      dispatch({ type: 'RESET', payload: { nodes: initialNodes, connections: initialConnections } });
    }
  }, [initialNodes, initialConnections]);

  // Keep stateRef in sync so parent can read current canvas state at any time
  useEffect(() => {
    if (stateRef) {
      stateRef.current = { nodes, connections };
    }
  }, [nodes, connections, stateRef]);

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Inline label editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const labelInputRef = useRef<HTMLInputElement>(null);
  // Guards against blur re-firing handleLabelSubmit after Enter/Escape already resolved the edit
  const editResolvedRef = useRef(false);
  // Signals the debounced save effect to skip one cycle after an immediate save
  const skipNextDebouncedSaveRef = useRef(false);

  // Tool mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // Zoom and pan
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Auto-fit: in readOnly mode, calculate zoom & pan to show all nodes
  const hasAutoFitRef = useRef(false);
  useEffect(() => {
    if (!readOnly || hasAutoFitRef.current || nodes.length === 0) return;
    const container = canvasRef.current;
    if (!container) return;

    const NODE_SIZE = 60;
    const PADDING = 60; // px around the bounding box

    // Bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + NODE_SIZE);
      maxY = Math.max(maxY, node.y + NODE_SIZE);
    }

    const contentW = maxX - minX + PADDING * 2;
    const contentH = maxY - minY + PADDING * 2;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    // Container has no dimensions yet (layout hasn't painted). We intentionally
    // don't set hasAutoFitRef.current = true so the effect retries on the next
    // render once the container has non-zero dimensions.
    // Alternative: use a ResizeObserver or requestAnimationFrame retry loop.
    if (containerW === 0 || containerH === 0) return;

    // Scale to fit, clamped between 50% and 100%
    const scaleX = containerW / contentW;
    const scaleY = containerH / contentH;
    const fitScale = Math.min(scaleX, scaleY, 1); // never zoom in past 100%
    const clampedScale = Math.max(0.5, Math.round(fitScale * 100) / 100);

    // Center the content
    const offsetX = (containerW - contentW * clampedScale) / 2 - (minX - PADDING) * clampedScale;
    const offsetY = (containerH - contentH * clampedScale) / 2 - (minY - PADDING) * clampedScale;

    setZoom(Math.round(clampedScale * 100));
    setPanOffset({ x: offsetX, y: offsetY });
    hasAutoFitRef.current = true;
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

  // Use tempNodes while dragging, otherwise use history nodes
  const displayNodes = tempNodes ?? nodes;

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Save to history
  const saveToHistory = useCallback((newNodes: CanvasNode[], newConnections: Connection[]) => {
    dispatch({ type: 'SET', payload: { nodes: newNodes, connections: newConnections } });
  }, []);

  // Debounced auto-save to database
  useEffect(() => {
    if (!onSave) return;

    // If an immediate save was already triggered (e.g. label edit), skip this cycle
    if (skipNextDebouncedSaveRef.current) {
      skipNextDebouncedSaveRef.current = false;
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 2 seconds
    saveTimeoutRef.current = setTimeout(() => {
      onSave(nodes, connections);
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
    setSelectedConnectionId(null);
    setTempNodes(null);
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setTempNodes(null);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  // Get color classes for node type
  const getColorClasses = (type: string) => {
    return COLOR_MAP[type] || { text: 'text-slate-500', darkText: 'dark:text-slate-400' };
  };

  // Calculate path between two nodes
  const getConnectionPath = (fromId: string, toId: string): string => {
    const nodeList = displayNodes;
    const fromNode = nodeList.find((n) => n.id === fromId);
    const toNode = nodeList.find((n) => n.id === toId);
    if (!fromNode || !toNode) return '';

    const fromX = fromNode.x + 60;
    const fromY = fromNode.y + 30;
    const toX = toNode.x;
    const toY = toNode.y + 30;

    const midX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  };

  // Get path for connection being drawn
  const getDrawingPath = (): string => {
    if (!connectionStart) return '';
    const fromNode = displayNodes.find((n) => n.id === connectionStart);
    if (!fromNode) return '';

    const scale = zoom / 100;
    const fromX = fromNode.x + 60;
    const fromY = fromNode.y + 30;
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
      const x = (e.clientX - rect.left - panOffset.x) / scale - 30;
      const y = (e.clientY - rect.top - panOffset.y) / scale - 30;

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
      setSelectedConnectionId(null); // Clear connection selection
    } catch (err) {
      console.error('Failed to parse dropped component:', err);
    }
  }, [nodes, connections, zoom, panOffset, saveToHistory]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  // Handle canvas mouse down (for panning)
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [toolMode, panOffset]);

  // Handle starting to draw a connection (Shift+Click on node)
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();

    if (toolMode === 'pan') return;

    // Erase mode: immediately delete node on click
    if (toolMode === 'erase') {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newConnections = connections.filter((c) => c.from !== nodeId && c.to !== nodeId);
      saveToHistory(newNodes, newConnections);
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
      return;
    }

    // Shift+Click to start drawing a connection
    if (e.shiftKey) {
      setIsDrawingConnection(true);
      setConnectionStart(nodeId);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    // Normal click to select and prepare for drag
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null); // Clear connection selection
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggedNodeId(nodeId);
    setTempNodes([...nodes]); // Start with current nodes for dragging

    const scale = zoom / 100;
    setDragOffset({
      x: e.clientX / scale - node.x,
      y: e.clientY / scale - node.y,
    });
  }, [nodes, connections, toolMode, zoom, saveToHistory]);

  // Handle completing a connection (mouse up on another node)
  const handleNodeMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();

    if (isDrawingConnection && connectionStart && connectionStart !== nodeId) {
      // Only check for exact same connection (same direction), allow bidirectional connections
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

    // Save dragged node position
    if (draggedNodeId && tempNodes) {
      saveToHistory(tempNodes, connections);
      setTempNodes(null);
    }

    setIsDrawingConnection(false);
    setConnectionStart(null);
    setDraggedNodeId(null);
  }, [isDrawingConnection, connectionStart, connections, nodes, draggedNodeId, tempNodes, saveToHistory]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (readOnly && !isPanning) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Handle panning
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // Update mouse position for connection drawing
    if (isDrawingConnection) {
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    // Handle node dragging - update tempNodes
    if (draggedNodeId && toolMode === 'select') {
      const scale = zoom / 100;
      const newX = e.clientX / scale - dragOffset.x;
      const newY = e.clientY / scale - dragOffset.y;

      // Use functional updater to avoid stale closure
      setTempNodes((prev) =>
        prev?.map((node) =>
          node.id === draggedNodeId
            ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
            : node
        ) ?? null
      );
    }
  }, [draggedNodeId, dragOffset, isDrawingConnection, isPanning, panStart, toolMode, zoom]);

  // Handle mouse up on canvas
  const handleMouseUp = useCallback(() => {
    // Save dragged node position to history
    if (draggedNodeId && tempNodes) {
      saveToHistory(tempNodes, connections);
      setTempNodes(null);
    }
    setDraggedNodeId(null);
    setIsDrawingConnection(false);
    setConnectionStart(null);
    setIsPanning(false);
  }, [draggedNodeId, tempNodes, connections, saveToHistory]);

  // Handle canvas click to deselect - but not if clicking on a node
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on canvas background, not on nodes
    const target = e.target as HTMLElement;
    if (target.closest('[data-node]') || target.closest('[data-connection]')) {
      return; // Don't deselect when clicking on nodes or connections
    }
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setEditingNodeId(null); // Cancel any open label editor
  }, []);

  // Handle double-click on a node's label to start editing
  const handleLabelDoubleClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (readOnly) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    editResolvedRef.current = false; // Reset for the new edit session
    setEditingNodeId(nodeId);
    setEditingLabel(node.label || '');
    // Focus the input on next render
    setTimeout(() => labelInputRef.current?.focus(), 0);
  }, [readOnly, nodes]);

  // Commit the edited label and trigger an immediate save
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
    editResolvedRef.current = true; // Prevent onBlur from re-running this
    setEditingNodeId(null);

    // Bypass the 2-second debounce — save immediately so labels persist faster
    if (onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      skipNextDebouncedSaveRef.current = true; // Suppress the debounced echo
      onSave(newNodes, connections);
    }
  }, [editingLabel, nodes, connections, saveToHistory, onSave]);

  // Delete selected node or connection
  const handleDeleteSelected = useCallback(() => {
    if (readOnly) return;
    if (selectedNodeId) {
      const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
      const newConnections = connections.filter((c) => c.from !== selectedNodeId && c.to !== selectedNodeId);
      saveToHistory(newNodes, newConnections);
      setSelectedNodeId(null);
    } else if (selectedConnectionId) {
      const newConnections = connections.filter((c) => c.id !== selectedConnectionId);
      saveToHistory(nodes, newConnections);
      setSelectedConnectionId(null);
    }
  }, [selectedNodeId, selectedConnectionId, nodes, connections, saveToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      // Delete selected node or connection
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        // Don't delete if user is typing in an input
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
          return;
        }

        if (selectedNodeId || selectedConnectionId) {
          e.preventDefault();
          handleDeleteSelected();
        }
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (fixed: use toLowerCase for shift+z)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, handleDeleteSelected, handleUndo, handleRedo]);

  return (
    <main
      ref={canvasRef}
      tabIndex={0}
      className={`flex-1 relative bg-white dark:bg-[#0f1115] overflow-hidden transition-colors outline-none ${isDragOver ? 'ring-2 ring-inset ring-primary/50 bg-primary/5' : ''
        } ${isPanning ? 'cursor-grabbing' : toolMode === 'pan' ? 'cursor-grab' : toolMode === 'erase' ? 'cursor-crosshair' : draggedNodeId ? 'cursor-grabbing' : isDrawingConnection ? 'cursor-crosshair' : 'cursor-default'}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* Grid Background (fixed) */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Instructions Tooltip */}
      {!readOnly && (
        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg z-50 max-w-xs">
          <p className="font-medium mb-1">Controls:</p>
          <ul className="space-y-0.5 text-white/80">
            <li>• Drag from palette to add</li>
            <li>• Click & drag nodes to move</li>
            <li>• <kbd className="bg-white/20 px-1 rounded">Shift</kbd>+Click to draw arrows</li>
            <li>• <kbd className="bg-white/20 px-1 rounded">Delete</kbd> to remove selected</li>
            <li>• <kbd className="bg-white/20 px-1 rounded">Ctrl+Z</kbd> Undo / <kbd className="bg-white/20 px-1 rounded">Ctrl+Y</kbd> Redo</li>
          </ul>
        </div>
      )}

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
          <div className="bg-primary/10 border-2 border-dashed border-primary rounded-xl px-6 py-4">
            <span className="text-primary font-medium">Drop component here</span>
          </div>
        </div>
      )}

      {/* Zoomable/Pannable Content */}
      <div
        ref={contentRef}
        data-canvas-content
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
        }}
      >
        {/* Connecting Lines (SVG Layer) - visible lines below nodes */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <marker id={arrowId} markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
              <polygon fill="#4f4b64" points="0 0, 10 3.5, 0 7"></polygon>
            </marker>
          </defs>

          {/* Visible connection lines */}
          {connections.map((conn) => {
            const isSelected = conn.id === selectedConnectionId;
            const pathD = getConnectionPath(conn.from, conn.to);
            return (
              <path
                key={conn.id}
                d={pathD}
                fill="none"
                markerEnd={`url(#${arrowId})`}
                stroke={isSelected ? '#4725f4' : '#4f4b64'}
                strokeWidth={isSelected ? 3 : 2}
                className={`pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-60'}`}
              />
            );
          })}

          {/* Connection being drawn */}
          {isDrawingConnection && connectionStart && (
            <path
              d={getDrawingPath()}
              fill="none"
              stroke="#4725f4"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="opacity-80"
            />
          )}
        </svg>

        {/* Canvas Nodes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {displayNodes.map((node) => {
            const colors = getColorClasses(node.type);
            const isSelected = node.id === selectedNodeId;

            return (
              <div
                key={node.id}
                data-node
                style={{ left: node.x, top: node.y }}
                className={`absolute w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group select-none transition-shadow pointer-events-auto ${isSelected
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#0f1115] shadow-[0_0_20px_rgba(71,37,244,0.3)] z-20'
                  : 'border-2 border-transparent hover:border-primary'
                  }`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
              >
                {/* Delete button - visible when selected and not readOnly */}
                {isSelected && !readOnly && (
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSelected();
                    }}
                    className="absolute -top-3 -right-3 size-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg z-30 cursor-pointer transition-colors"
                    title="Delete node"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                )}
                <span
                  className={`material-symbols-outlined ${colors.text} ${colors.darkText}`}
                  style={{ fontSize: '28px' }}
                >
                  {node.icon}
                </span>

                {/* Always-visible label below node */}
                {editingNodeId === node.id ? (
                  <input
                    ref={labelInputRef}
                    type="text"
                    value={editingLabel}
                    maxLength={25}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLabelSubmit(node.id);
                      if (e.key === 'Escape') {
                        editResolvedRef.current = true;
                        setEditingNodeId(null);
                      }
                      e.stopPropagation(); // prevent canvas hotkeys
                    }}
                    onBlur={() => {
                      if (editResolvedRef.current) return; // Already handled by Enter/Escape
                      handleLabelSubmit(node.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-24 text-center text-[10px] font-medium bg-white dark:bg-[#1e1e24] border border-primary rounded px-1 py-0.5 text-slate-800 dark:text-white outline-none shadow-lg z-30"
                  />
                ) : (
                  <div
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-semibold tracking-wide whitespace-nowrap max-w-[90px] truncate text-center px-1.5 py-0.5 rounded-full ${node.label
                        ? isSelected
                          ? 'bg-primary/15 text-primary'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        : 'bg-transparent text-slate-400/60 dark:text-slate-600 italic'
                      } ${readOnly ? 'pointer-events-none' : 'cursor-text'}`}
                    title={node.label || node.type}
                    onDoubleClick={(e) => handleLabelDoubleClick(e, node.id)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {node.label || node.type}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Connection click targets (between visible lines and nodes so clicks reach them but don't block nodes) */}
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
                  }
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-border-dark p-1.5 rounded-full shadow-xl flex items-center gap-1 z-30">
        {!readOnly && (
          <>
            {/* Pan Tool */}
            <button
              onClick={() => setToolMode('pan')}
              className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${toolMode === 'pan' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
                }`}
              title="Pan Tool (drag to move canvas)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pan_tool</span>
            </button>

            {/* Select Tool */}
            <button
              onClick={() => setToolMode('select')}
              className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${toolMode === 'select' ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
                }`}
              title="Select Tool (click to select, drag to move nodes)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>near_me</span>
            </button>

            {/* Erase Tool */}
            <button
              onClick={() => setToolMode('erase')}
              className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${toolMode === 'erase' ? 'bg-red-500/15 text-red-500' : 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
                }`}
              title="Erase Tool (click any node or connection to delete)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>ink_eraser</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-1"></div>

            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${canUndo
                ? 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
              title="Undo (Ctrl+Z)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>undo</span>
            </button>

            {/* Redo */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${canRedo
                ? 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
                : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
              title="Redo (Ctrl+Y)"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>redo</span>
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-border-dark mx-1"></div>
          </>
        )}

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 25}
          className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${zoom > 25
            ? 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
          title="Zoom Out"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
        </button>

        {/* Zoom Level */}
        <span className="text-xs font-mono text-slate-500 w-10 text-center">{zoom}%</span>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 200}
          className={`size-8 flex items-center justify-center rounded-full transition-colors cursor-pointer ${zoom < 200
            ? 'hover:bg-slate-100 dark:hover:bg-[#2b2839] text-slate-600 dark:text-slate-400'
            : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            }`}
          title="Zoom In"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
        </button>
      </div>
    </main>
  );
}
