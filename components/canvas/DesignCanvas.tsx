'use client';

import { useState, useRef, useId, useCallback, useEffect, useReducer } from 'react';

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
  | { type: 'UNDO' }
  | { type: 'REDO' };

type ToolMode = 'select' | 'pan' | 'erase';

// Default empty canvas
const DEFAULT_NODES: CanvasNode[] = [];
const DEFAULT_CONNECTIONS: Connection[] = [];

interface DesignCanvasProps {
  initialNodes?: CanvasNode[];
  initialConnections?: Connection[];
  onSave?: (nodes: CanvasNode[], connections: Connection[]) => void;
  readOnly?: boolean;
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
    default:
      return state;
  }
}

export function DesignCanvas({
  initialNodes = DEFAULT_NODES,
  initialConnections = DEFAULT_CONNECTIONS,
  onSave,
  readOnly = false
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

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

  // Tool mode
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  // Zoom and pan
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
        label: component.type,
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
  }, []);

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
                {/* Delete button - visible when selected */}
                {isSelected && (
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
                {node.label && (
                  <div className="absolute -bottom-8 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {node.label}
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
