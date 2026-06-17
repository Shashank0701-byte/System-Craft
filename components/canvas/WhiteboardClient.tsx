'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────────

type ToolType = 'pen' | 'line' | 'rect' | 'circle' | 'arrow' | 'eraser' | 'text';

interface Point {
    x: number;
    y: number;
}

interface WhiteboardElement {
    id: string;
    type: ToolType;
    points: Point[];       // freehand, line, arrow use this
    color: string;
    strokeWidth: number;
    // rect/circle bounding box
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    // text
    text?: string;
    fontSize?: number;
}

interface WhiteboardData {
    elements: WhiteboardElement[];
    viewport: { x: number; y: number; zoom: number };
}

interface WhiteboardProps {
    initialData?: string;
    onSave?: (data: string) => void;
    readOnly?: boolean;
}

// ─── Constants ─────────────────────────────────────────────────

const COLORS = [
    '#ffffff', '#f87171', '#fb923c', '#fbbf24', '#a3e635',
    '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
];

const STROKE_WIDTHS = [2, 4, 6, 10];

const genId = () => Math.random().toString(36).slice(2, 10);

// ─── Component ─────────────────────────────────────────────────

export default function WhiteboardClient({ initialData, onSave, readOnly = false }: WhiteboardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [elements, setElements] = useState<WhiteboardElement[]>([]);
    const [history, setHistory] = useState<WhiteboardElement[][]>([]);
    const [future, setFuture] = useState<WhiteboardElement[][]>([]);
    const [tool, setTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#ffffff');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

    // Drawing state (refs to avoid re-renders during draw)
    const isDrawingRef = useRef(false);
    const isPanningRef = useRef(false);
    const currentElementRef = useRef<WhiteboardElement | null>(null);
    const startPointRef = useRef<Point>({ x: 0, y: 0 });
    const lastPanRef = useRef<Point>({ x: 0, y: 0 });
    const spaceDownRef = useRef(false);
    const elementsRef = useRef(elements);
    const viewportRef = useRef(viewport);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoadRef = useRef(true);

    // Text input state
    const [textInput, setTextInput] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
    const [textValue, setTextValue] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);

    // Keep refs in sync
    useEffect(() => { elementsRef.current = elements; }, [elements]);
    useEffect(() => { viewportRef.current = viewport; }, [viewport]);

    // ─── Load initial data ─────────────────────────────────────
    useEffect(() => {
        if (!initialData) return;
        try {
            const parsed: WhiteboardData = JSON.parse(initialData);
            if (parsed.elements) setElements(parsed.elements);
            if (parsed.viewport) setViewport(parsed.viewport);
        } catch {
            // ignore invalid data
        }
    }, [initialData]);

    // ─── Auto-save on element changes ──────────────────────────
    useEffect(() => {
        if (!onSave || readOnly) return;
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
        }

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            const data: WhiteboardData = { elements, viewport };
            onSave(JSON.stringify(data));
        }, 1500);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [elements, viewport, onSave, readOnly]);

    // ─── Canvas resize ─────────────────────────────────────────
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
    }, []);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    // ─── Canvas coordinate conversion ──────────────────────────
    const screenToCanvas = useCallback((clientX: number, clientY: number): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const vp = viewportRef.current;
        return {
            x: (clientX - rect.left - vp.x) / vp.zoom,
            y: (clientY - rect.top - vp.y) / vp.zoom,
        };
    }, []);

    // ─── Drawing functions ─────────────────────────────────────
    const drawElement = useCallback((ctx: CanvasRenderingContext2D, el: WhiteboardElement) => {
        ctx.save();
        ctx.strokeStyle = el.color;
        ctx.fillStyle = el.color;
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (el.type) {
            case 'pen': {
                if (el.points.length < 2) break;
                ctx.beginPath();
                ctx.moveTo(el.points[0].x, el.points[0].y);
                for (let i = 1; i < el.points.length; i++) {
                    ctx.lineTo(el.points[i].x, el.points[i].y);
                }
                ctx.stroke();
                break;
            }
            case 'line': {
                if (el.points.length < 2) break;
                ctx.beginPath();
                ctx.moveTo(el.points[0].x, el.points[0].y);
                ctx.lineTo(el.points[1].x, el.points[1].y);
                ctx.stroke();
                break;
            }
            case 'arrow': {
                if (el.points.length < 2) break;
                const [start, end] = el.points;
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.stroke();

                // Arrowhead
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const headLen = Math.max(12, el.strokeWidth * 3);
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
                break;
            }
            case 'rect': {
                if (el.width == null || el.height == null || el.x == null || el.y == null) break;
                ctx.strokeRect(el.x, el.y, el.width, el.height);
                break;
            }
            case 'circle': {
                if (el.width == null || el.height == null || el.x == null || el.y == null) break;
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                const rx = Math.abs(el.width / 2);
                const ry = Math.abs(el.height / 2);
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'text': {
                if (!el.text || el.x == null || el.y == null) break;
                ctx.font = `${el.fontSize || 18}px Inter, sans-serif`;
                ctx.fillText(el.text, el.x, el.y);
                break;
            }
        }
        ctx.restore();
    }, []);

    // ─── Render all elements ───────────────────────────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        const vp = viewportRef.current;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw dot grid
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        const gridSize = 24 * vp.zoom;
        const offsetX = vp.x % gridSize;
        const offsetY = vp.y % gridSize;
        for (let x = offsetX; x < w; x += gridSize) {
            for (let y = offsetY; y < h; y += gridSize) {
                ctx.fillRect(x - 1, y - 1, 2, 2);
            }
        }
        ctx.restore();

        // Apply viewport transform
        ctx.save();
        ctx.translate(vp.x, vp.y);
        ctx.scale(vp.zoom, vp.zoom);

        // Draw committed elements
        for (const el of elementsRef.current) {
            drawElement(ctx, el);
        }

        // Draw current in-progress element
        if (currentElementRef.current) {
            drawElement(ctx, currentElementRef.current);
        }

        ctx.restore();
    }, [drawElement]);

    // ─── Animation loop ────────────────────────────────────────
    const animFrameRef = useRef<number>(0);
    const renderLoop = useCallback(() => {
        render();
        animFrameRef.current = requestAnimationFrame(renderLoop);
    }, [render]);

    useEffect(() => {
        animFrameRef.current = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [renderLoop]);

    // ─── History helpers ───────────────────────────────────────
    const pushHistory = useCallback((prev: WhiteboardElement[]) => {
        setHistory(h => [...h.slice(-50), prev]); // keep last 50
        setFuture([]);
    }, []);

    const handleUndo = useCallback(() => {
        setHistory(h => {
            if (h.length === 0) return h;
            const prev = h[h.length - 1];
            const rest = h.slice(0, -1);
            setFuture(f => [...f, elementsRef.current]);
            setElements(prev);
            return rest;
        });
    }, []);

    const handleRedo = useCallback(() => {
        setFuture(f => {
            if (f.length === 0) return f;
            const next = f[f.length - 1];
            const rest = f.slice(0, -1);
            setHistory(h => [...h, elementsRef.current]);
            setElements(next);
            return rest;
        });
    }, []);

    const handleClear = useCallback(() => {
        pushHistory(elementsRef.current);
        setElements([]);
    }, [pushHistory]);

    // ─── Eraser hit-test ───────────────────────────────────────
    const hitTest = useCallback((point: Point, el: WhiteboardElement): boolean => {
        const threshold = Math.max(10, el.strokeWidth);
        switch (el.type) {
            case 'pen': {
                return el.points.some(p =>
                    Math.hypot(p.x - point.x, p.y - point.y) < threshold
                );
            }
            case 'line':
            case 'arrow': {
                if (el.points.length < 2) return false;
                const [a, b] = el.points;
                const len = Math.hypot(b.x - a.x, b.y - a.y);
                if (len === 0) return Math.hypot(point.x - a.x, point.y - a.y) < threshold;
                const t = Math.max(0, Math.min(1, ((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / (len * len)));
                const proj = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
                return Math.hypot(point.x - proj.x, point.y - proj.y) < threshold;
            }
            case 'rect': {
                if (el.x == null || el.y == null || el.width == null || el.height == null) return false;
                const minX = Math.min(el.x, el.x + el.width) - threshold;
                const maxX = Math.max(el.x, el.x + el.width) + threshold;
                const minY = Math.min(el.y, el.y + el.height) - threshold;
                const maxY = Math.max(el.y, el.y + el.height) + threshold;
                return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
            }
            case 'circle': {
                if (el.x == null || el.y == null || el.width == null || el.height == null) return false;
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                const dist = Math.hypot(point.x - cx, point.y - cy);
                const r = Math.max(Math.abs(el.width), Math.abs(el.height)) / 2;
                return Math.abs(dist - r) < threshold;
            }
            case 'text': {
                if (el.x == null || el.y == null || !el.text) return false;
                const tw = el.text.length * (el.fontSize || 18) * 0.6;
                const th = (el.fontSize || 18) * 1.2;
                return point.x >= el.x - 4 && point.x <= el.x + tw + 4 && point.y >= el.y - th && point.y <= el.y + 4;
            }
            default:
                return false;
        }
    }, []);

    // ─── Mouse handlers ────────────────────────────────────────
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (readOnly) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Pan with middle mouse or space+left
        if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
            isPanningRef.current = true;
            lastPanRef.current = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
            return;
        }

        if (e.button !== 0) return;

        const point = screenToCanvas(e.clientX, e.clientY);

        if (tool === 'eraser') {
            const prev = [...elementsRef.current];
            const remaining = elementsRef.current.filter(el => !hitTest(point, el));
            if (remaining.length !== prev.length) {
                pushHistory(prev);
                setElements(remaining);
            }
            isDrawingRef.current = true;
            return;
        }

        if (tool === 'text') {
            const rect = canvas.getBoundingClientRect();
            setTextInput({ x: e.clientX - rect.left, y: e.clientY - rect.top, visible: true });
            setTextValue('');
            startPointRef.current = point;
            setTimeout(() => textInputRef.current?.focus(), 10);
            return;
        }

        isDrawingRef.current = true;
        startPointRef.current = point;

        const newEl: WhiteboardElement = {
            id: genId(),
            type: tool,
            points: [point],
            color,
            strokeWidth,
        };

        if (tool === 'rect' || tool === 'circle') {
            newEl.x = point.x;
            newEl.y = point.y;
            newEl.width = 0;
            newEl.height = 0;
        }

        currentElementRef.current = newEl;
        canvas.setPointerCapture(e.pointerId);
    }, [tool, color, strokeWidth, readOnly, screenToCanvas, hitTest, pushHistory]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (isPanningRef.current) {
            const dx = e.clientX - lastPanRef.current.x;
            const dy = e.clientY - lastPanRef.current.y;
            lastPanRef.current = { x: e.clientX, y: e.clientY };
            setViewport(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
            return;
        }

        if (!isDrawingRef.current) return;
        const point = screenToCanvas(e.clientX, e.clientY);

        if (tool === 'eraser') {
            const prev = [...elementsRef.current];
            const remaining = elementsRef.current.filter(el => !hitTest(point, el));
            if (remaining.length !== prev.length) {
                if (history.length === 0 || history[history.length - 1] !== prev) {
                    pushHistory(prev);
                }
                setElements(remaining);
            }
            return;
        }

        const el = currentElementRef.current;
        if (!el) return;

        if (el.type === 'pen') {
            el.points.push(point);
        } else if (el.type === 'line' || el.type === 'arrow') {
            el.points = [startPointRef.current, point];
        } else if (el.type === 'rect' || el.type === 'circle') {
            el.x = Math.min(startPointRef.current.x, point.x);
            el.y = Math.min(startPointRef.current.y, point.y);
            el.width = Math.abs(point.x - startPointRef.current.x);
            el.height = Math.abs(point.y - startPointRef.current.y);
        }
    }, [tool, screenToCanvas, hitTest, pushHistory, history]);

    const handlePointerUp = useCallback(() => {
        if (isPanningRef.current) {
            isPanningRef.current = false;
            const canvas = canvasRef.current;
            if (canvas) canvas.style.cursor = spaceDownRef.current ? 'grab' : 'default';
            return;
        }

        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        if (tool === 'eraser') return;

        const el = currentElementRef.current;
        if (!el) return;

        // Don't commit tiny/empty elements
        if (el.type === 'pen' && el.points.length < 2) {
            currentElementRef.current = null;
            return;
        }
        if ((el.type === 'rect' || el.type === 'circle') && (el.width! < 2 && el.height! < 2)) {
            currentElementRef.current = null;
            return;
        }

        pushHistory(elementsRef.current);
        setElements(prev => [...prev, el]);
        currentElementRef.current = null;
    }, [tool, pushHistory]);

    // ─── Text commit ───────────────────────────────────────────
    const commitText = useCallback(() => {
        if (!textValue.trim()) {
            setTextInput(v => ({ ...v, visible: false }));
            return;
        }
        pushHistory(elementsRef.current);
        setElements(prev => [...prev, {
            id: genId(),
            type: 'text' as ToolType,
            points: [],
            color,
            strokeWidth,
            text: textValue,
            fontSize: 18,
            x: startPointRef.current.x,
            y: startPointRef.current.y,
        }]);
        setTextInput(v => ({ ...v, visible: false }));
        setTextValue('');
    }, [textValue, color, strokeWidth, pushHistory]);

    // ─── Scroll zoom ───────────────────────────────────────────
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setViewport(v => {
                const newZoom = Math.max(0.1, Math.min(5, v.zoom * delta));
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return { ...v, zoom: newZoom };
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                return {
                    x: mx - (mx - v.x) * (newZoom / v.zoom),
                    y: my - (my - v.y) * (newZoom / v.zoom),
                    zoom: newZoom,
                };
            });
        } else {
            // Pan
            setViewport(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
        }
    }, []);

    // ─── Keyboard shortcuts ────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                spaceDownRef.current = true;
                if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            }
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !textInput.visible) {
                switch (e.key) {
                    case 'p': setTool('pen'); break;
                    case 'l': setTool('line'); break;
                    case 'r': setTool('rect'); break;
                    case 'c': setTool('circle'); break;
                    case 'a': setTool('arrow'); break;
                    case 'e': setTool('eraser'); break;
                    case 't': setTool('text'); break;
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                spaceDownRef.current = false;
                if (canvasRef.current) canvasRef.current.style.cursor = 'default';
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleUndo, handleRedo, textInput.visible]);

    // ─── Tool icon helper ──────────────────────────────────────
    const ToolBtn = ({ t, icon, label }: { t: ToolType; icon: string; label: string }) => (
        <button
            onClick={() => setTool(t)}
            title={label}
            className={`size-9 flex items-center justify-center rounded-lg transition-all ${
                tool === t
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
        </button>
    );

    // ─── Render ────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className="absolute inset-0 bg-[#1A1825] select-none"
            style={{ touchAction: 'none' }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ cursor: tool === 'eraser' ? 'crosshair' : tool === 'text' ? 'text' : 'default' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onWheel={handleWheel}
            />

            {/* Floating text input */}
            {textInput.visible && (
                <input
                    ref={textInputRef}
                    type="text"
                    value={textValue}
                    onChange={e => setTextValue(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') commitText();
                        if (e.key === 'Escape') setTextInput(v => ({ ...v, visible: false }));
                    }}
                    onBlur={commitText}
                    className="absolute bg-transparent border border-primary/60 rounded px-2 py-1 text-white text-sm outline-none"
                    style={{ left: textInput.x, top: textInput.y, minWidth: 120, zIndex: 60 }}
                    autoFocus
                />
            )}

            {/* ─── Bottom Toolbar ─────────────────────────── */}
            {!readOnly && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-2 bg-[#0f0e17]/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    {/* Drawing Tools */}
                    <ToolBtn t="pen" icon="draw" label="Pen (P)" />
                    <ToolBtn t="line" icon="pen_size_1" label="Line (L)" />
                    <ToolBtn t="arrow" icon="arrow_right_alt" label="Arrow (A)" />
                    <ToolBtn t="rect" icon="rectangle" label="Rectangle (R)" />
                    <ToolBtn t="circle" icon="circle" label="Circle (C)" />
                    <ToolBtn t="text" icon="title" label="Text (T)" />

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <ToolBtn t="eraser" icon="ink_eraser" label="Eraser (E)" />

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Color Palette */}
                    <div className="flex items-center gap-1">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                title={c}
                                className={`size-5 rounded-full border-2 transition-all ${
                                    color === c ? 'border-primary scale-125' : 'border-transparent hover:scale-110'
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Stroke Width */}
                    <div className="flex items-center gap-1">
                        {STROKE_WIDTHS.map(w => (
                            <button
                                key={w}
                                onClick={() => setStrokeWidth(w)}
                                title={`${w}px`}
                                className={`flex items-center justify-center size-7 rounded-lg transition-all ${
                                    strokeWidth === w
                                        ? 'bg-primary/20 ring-1 ring-primary/40'
                                        : 'hover:bg-white/10'
                                }`}
                            >
                                <div
                                    className="rounded-full bg-white"
                                    style={{ width: Math.min(w + 2, 14), height: Math.min(w + 2, 14) }}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    {/* Undo / Redo / Clear */}
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        title="Undo (Ctrl+Z)"
                        className={`size-9 flex items-center justify-center rounded-lg transition-all ${
                            history.length > 0 ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>undo</span>
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={future.length === 0}
                        title="Redo (Ctrl+Y)"
                        className={`size-9 flex items-center justify-center rounded-lg transition-all ${
                            future.length > 0 ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>redo</span>
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={elements.length === 0}
                        title="Clear Canvas"
                        className={`size-9 flex items-center justify-center rounded-lg transition-all ${
                            elements.length > 0 ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-slate-600 cursor-not-allowed'
                        }`}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_sweep</span>
                    </button>
                </div>
            )}
        </div>
    );
}
