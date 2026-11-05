import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Edit3, Eraser, RotateCcw, RotateCw, Trash2, Smartphone, ShieldCheck } from 'lucide-react';

interface DrawingPadProps {
  initialDataUrl?: string | null;
  onChange: (dataUrl: string | null) => void;
}

const INK_COLORS = [
  { name: 'Tinta', value: '#1a1c29' },
  { name: 'Terracota', value: '#e8533a' },
  { name: 'Azul Marino', value: '#2563eb' },
  { name: 'Esmeralda', value: '#16a34a' },
  { name: 'Púrpura', value: '#9333ea' },
  { name: 'Ámbar', value: '#d97706' },
];

export const DrawingPad: React.FC<DrawingPadProps> = ({ initialDataUrl, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState<string>(INK_COLORS[0].value);
  const [lineWidth, setLineWidth] = useState<number>(2.5);
  const [penOnly, setPenOnly] = useState<boolean>(false);
  const [hasContent, setHasContent] = useState<boolean>(!!initialDataUrl);
  const isDrawing = useRef<boolean>(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, data];
    });
    setHistoryIndex((prev) => prev + 1);
    setHasContent(true);
    onChange(data);
  }, [historyIndex, onChange]);

  // Initialize canvas size and initial content
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasContent(true);
        setHistory([initialDataUrl]);
        setHistoryIndex(0);
      };
      img.src = initialDataUrl;
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [initialDataUrl]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // If Apple Pencil detected, auto-suggest or toggle penOnly
    if (e.pointerType === 'pen' && !penOnly) {
      setPenOnly(true);
    }

    if (penOnly && e.pointerType !== 'pen') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const pt = getCanvasCoords(e);
    lastPoint.current = pt;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pressure = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 6 : (e.pointerType === 'pen' ? 1 + pressure * 4 : lineWidth);

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return;
    if (penOnly && e.pointerType !== 'pen') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPt = getCanvasCoords(e);
    const pressure = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 6 : (e.pointerType === 'pen' ? 1 + pressure * 4 : lineWidth);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(currentPt.x, currentPt.y);
    ctx.stroke();

    lastPoint.current = currentPt;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    saveToHistory();
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const prevData = history[prevIndex];
    if (prevData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHistoryIndex(prevIndex);
        onChange(prevData);
      };
      img.src = prevData;
    } else {
      setHistoryIndex(-1);
      setHasContent(false);
      onChange(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const nextData = history[nextIndex];
    if (nextData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHistoryIndex(nextIndex);
        onChange(nextData);
      };
      img.src = nextData;
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasContent(false);
    setHistory([]);
    setHistoryIndex(-1);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tool === 'pen'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Lápiz</span>
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tool === 'eraser'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Goma</span>
          </button>

          {/* Stroke thickness */}
          <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-neutral-200 dark:border-neutral-800 pl-2">
            {[1.5, 3, 5].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setLineWidth(w)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  lineWidth === w
                    ? 'bg-neutral-200 dark:bg-neutral-700'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={`Grosor: ${w}px`}
              >
                <div
                  className="rounded-full bg-neutral-700 dark:bg-neutral-200"
                  style={{ width: `${w + 2}px`, height: `${w + 2}px` }}
                />
              </button>
            ))}
          </div>

          {/* Color palette */}
          {tool === 'pen' && (
            <div className="flex items-center gap-1.5 ml-2 border-l border-neutral-200 dark:border-neutral-800 pl-2">
              {INK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-offset-1 ring-neutral-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Palm rejection / Pen only */}
          <button
            type="button"
            onClick={() => setPenOnly(!penOnly)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              penOnly
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-medium'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Ignorar toques del dedo para escribir sólo con Apple Pencil o stylus"
          >
            {penOnly ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{penOnly ? 'Solo Pencil (anti-palma)' : 'Dedo + Pencil'}</span>
          </button>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-30"
            title="Deshacer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-30"
            title="Rehacer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasContent}
            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30"
            title="Borrar todo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-[#fffdf9] dark:bg-[#151722] shadow-inner">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-44 cursor-crosshair touch-none select-none block"
          style={{ touchAction: 'none' }}
        />
        {!hasContent && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-600">
            Dibuja o escribe a mano aquí con Apple Pencil, stylus o dedo…
          </div>
        )}
      </div>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
        Compatible con Apple Pencil (sensibilidad a la presión) y Scribble en iPadOS. El dibujo se guarda en la tarea.
      </p>
    </div>
  );
};
