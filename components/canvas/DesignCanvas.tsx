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

type ToolMode = 'select' | 'pan';

// Initial demo nodes
const INITIAL_NODES: CanvasNode[] = [
  { id: '1', type: 'Client', icon: 'smartphone', x: 160, y: 150, label: 'Mobile App' },
  { id: '2', type: 'LB', icon: 'alt_route', x: 420, y: 150, label: 'Nginx LB' },
  { id: '3', type: 'Server', icon: 'dns', x: 680, y: 150, label: 'API Cluster' },
  { id: '4', type: 'Cache', icon: 'bolt', x: 840, y: 50, label: 'Redis' },
  { id: '5', type: 'SQL', icon: 'database', x: 840, y: 290, label: 'PostgreSQL' },
];

// Initial connections
const INITIAL_CONNECTIONS: Connection[] = [
  { id: 'c1', from: '1', to: '2' },
  { id: 'c2', from: '2', to: '3' },
  { id: 'c3', from: '3', to: '4' },
  { id: 'c4', from: '3', to: '5' },
];

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

export function DesignCanvas() {
  const arrowId = useId();
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // History state with reducer (atomic updates)
  const [historyState, dispatch] = useReducer(historyReducer, {
    past: [],
    present: { nodes: INITIAL_NODES, connections: INITIAL_CONNECTIONS },
    future: [],
  });

  const { nodes, connections } = historyState.present;
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('5');

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

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
    setSelectedNodeId(null);
    setTempNodes(null);
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
    setSelectedNodeId(null);
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
    e.stopPropagation();

    if (toolMode === 'pan') return;

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
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggedNodeId(nodeId);
    setTempNodes([...nodes]); // Start with current nodes for dragging

    const scale = zoom / 100;
    setDragOffset({
      x: e.clientX / scale - node.x,
      y: e.clientY / scale - node.y,
    });
  }, [nodes, toolMode, zoom]);

  // Handle completing a connection (mouse up on another node)
  const handleNodeMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();

    if (isDrawingConnection && connectionStart && connectionStart !== nodeId) {
      const exists = connections.some(
        (c) => (c.from === connectionStart && c.to === nodeId) ||
          (c.from === nodeId && c.to === connectionStart)
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
    if (draggedNodeId && toolMode === 'select' && tempNodes) {
      const scale = zoom / 100;
      const newX = e.clientX / scale - dragOffset.x;
      const newY = e.clientY / scale - dragOffset.y;

      setTempNodes(
        tempNodes.map((node) =>
          node.id === draggedNodeId
            ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
            : node
        )
      );
    }
  }, [draggedNodeId, dragOffset, isDrawingConnection, isPanning, panStart, toolMode, zoom, tempNodes]);

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
    if (target.closest('[data-node]')) {
      return; // Don't deselect when clicking on nodes
    }
    setSelectedNodeId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected node
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && document.activeElement === canvasRef.current) {
        const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
        const newConnections = connections.filter((c) => c.from !== selectedNodeId && c.to !== selectedNodeId);
        saveToHistory(newNodes, newConnections);
        setSelectedNodeId(null);
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
  }, [selectedNodeId, nodes, connections, saveToHistory, handleUndo, handleRedo]);

  return (
    <main
      ref={canvasRef}
      tabIndex={0}
      className={`flex-1 relative bg-white dark:bg-[#0f1115] overflow-hidden transition-colors outline-none ${isDragOver ? 'ring-2 ring-inset ring-primary/50 bg-primary/5' : ''
        } ${isPanning ? 'cursor-grabbing' : toolMode === 'pan' ? 'cursor-grab' : draggedNodeId ? 'cursor-grabbing' : isDrawingConnection ? 'cursor-crosshair' : 'cursor-default'}`}
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
        {/* Connecting Lines (SVG Layer) - using overflow visible for unlimited canvas */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <marker id={arrowId} markerHeight="7" markerWidth="10" orient="auto" refX="9" refY="3.5">
              <polygon fill="#4f4b64" points="0 0, 10 3.5, 0 7"></polygon>
            </marker>
          </defs>

          {/* Existing connections */}
          {connections.map((conn) => (
            <path
              key={conn.id}
              d={getConnectionPath(conn.from, conn.to)}
              fill="none"
              markerEnd={`url(#${arrowId})`}
              stroke="#4f4b64"
              strokeWidth="2"
              className="opacity-60"
            />
          ))}

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
        <div className="absolute inset-0 z-10">
          {displayNodes.map((node) => {
            const colors = getColorClasses(node.type);
            const isSelected = node.id === selectedNodeId;

            return (
              <div
                key={node.id}
                data-node
                style={{ left: node.x, top: node.y }}
                className={`absolute w-[60px] h-[60px] bg-white dark:bg-[#1e1e24] shadow-lg rounded-xl flex flex-col items-center justify-center cursor-move group select-none transition-shadow ${isSelected
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#0f1115] shadow-[0_0_20px_rgba(71,37,244,0.3)] z-20'
                    : 'border-2 border-transparent hover:border-primary'
                  }`}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
              >
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

        {/* Live Cursor (Simulated) */}
        <div className="absolute left-[520px] top-[240px] z-50 pointer-events-none transition-all duration-700 ease-in-out">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#F43F5E" stroke="white" strokeWidth="2"></path>
          </svg>
          <div className="absolute left-4 top-4 bg-[#F43F5E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm whitespace-nowrap">
            Alex M.
          </div>
        </div>
      </div>

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-border-dark p-1.5 rounded-full shadow-xl flex items-center gap-1 z-30">
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
