"use client";

/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, @next/next/no-img-element */

import { useState, useRef } from "react";
import { SPRITE_DATA } from "@/components/Stavle";

type SpriteFrame = { x: number; y: number; w: number; h: number };
type FramesMap = Record<string, SpriteFrame>;

const GRID_COLORS: Record<string, string> = {
  "stavle-listening": "#ef4444",
  "stavle-celebrating": "#22c55e",
  "stavle-encouraging": "#3b82f6",
  "stavle-waving": "#eab308",
  "stavle-thinking": "#a855f7",
  "stavle-reading": "#ec4899",
  "stavle-pointing": "#f97316",
  "stavle-sleeping": "#06b6d4",
  "stavle-idle": "#84cc16",
  "stavle-idle-resting": "#f59e0b",
};

export default function StavleTestPage() {
  const [frames, setFrames] = useState<FramesMap>(() => ({ ...SPRITE_DATA.frames }));
  const [showGrid, setShowGrid] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [dragMode, setDragMode] = useState<"move" | "resize">("move");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startFrame: SpriteFrame;
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    frameName: string,
    mode: "move" | "resize",
  ) => {
    e.preventDefault();
    setSelectedFrame(frameName);
    setDragMode(mode);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startFrame: { ...frames[frameName] },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !selectedFrame) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    setFrames((prev) => ({
      ...prev,
      [selectedFrame]: {
        ...prev[selectedFrame],
        ...(dragMode === "move"
          ? {
            x: Math.max(0, Math.round(dragRef.current!.startFrame.x + dx)),
            y: Math.max(0, Math.round(dragRef.current!.startFrame.y + dy)),
          }
          : {
            w: Math.max(50, Math.round(dragRef.current!.startFrame.w + dx)),
            h: Math.max(50, Math.round(dragRef.current!.startFrame.h + dy)),
          }),
      },
    }));
  };

  const handleMouseUp = () => {
    dragRef.current = null;
  };

  const updateFrame = (
    name: string,
    key: "x" | "y" | "w" | "h",
    value: number,
  ) => {
    setFrames((prev) => ({
      ...prev,
      [name]: { ...prev[name], [key]: value },
    }));
  };

  const exportFrames = () => {
    const output = {
      frames,
      meta: { size: { w: 1024, h: 1536 } },
    };
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    alert("Copied to clipboard!");
  };

  const renderPreview = (frameName: string, size: number = 128) => {
    const frame = frames[frameName];
    const aspectRatio = frame.h / frame.w;
    const displayHeight = Math.round(size * aspectRatio);
    const scaleX = size / frame.w;
    const scaleY = displayHeight / frame.h;

    return (
      <div
        style={{
          width: size,
          height: displayHeight,
          backgroundImage: "url(/stavle-sprite.png)",
          backgroundSize: `${1024 * scaleX}px ${1536 * scaleY}px`,
          backgroundPosition: `${-frame.x * scaleX}px ${-frame.y * scaleY}px`,
          backgroundRepeat: "no-repeat",
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Stavle Sprite Test Page</h1>

      {/* Controls */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
            className="w-4 h-4"
          />
          Show Grid Overlay
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="w-4 h-4"
          />
          Animate
        </label>
        <button
          onClick={exportFrames}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Copy Frame Data to Clipboard
        </button>
        <span className="text-sm text-gray-500">
          Selected: {selectedFrame?.replace("stavle-", "") || "none"} | Drag
          boxes to move, drag corners to resize
        </span>
      </div>

      {/* Frame Editor Panel */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Frame Editor</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(frames).map(([name, frame]) => (
            <div
              key={name}
              className={`p-3 rounded-lg border-2 ${selectedFrame === name ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
              onClick={() => setSelectedFrame(name)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: GRID_COLORS[name] }}
                />
                <span className="text-sm font-medium">
                  {name.replace("stavle-", "")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <label>
                  X:
                  <input
                    type="number"
                    value={frame.x}
                    onChange={(e) =>
                      updateFrame(name, "x", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-1 border rounded"
                  />
                </label>
                <label>
                  Y:
                  <input
                    type="number"
                    value={frame.y}
                    onChange={(e) =>
                      updateFrame(name, "y", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-1 border rounded"
                  />
                </label>
                <label>
                  W:
                  <input
                    type="number"
                    value={frame.w}
                    onChange={(e) =>
                      updateFrame(name, "w", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-1 border rounded"
                  />
                </label>
                <label>
                  H:
                  <input
                    type="number"
                    value={frame.h}
                    onChange={(e) =>
                      updateFrame(name, "h", parseInt(e.target.value) || 0)
                    }
                    className="w-full px-1 border rounded"
                  />
                </label>
              </div>
              <div className="mt-2 flex justify-center border border-dashed border-gray-300 p-1">
                {renderPreview(name, 80)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sprite Sheet with Draggable Overlay */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Sprite Sheet (1024×1536) - Drag to Adjust
        </h2>
        <div
          ref={containerRef}
          className="relative inline-block bg-white p-2 rounded-lg shadow select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src="/stavle-sprite.png"
            alt="Stavle sprite sheet"
            className="block"
            style={{ width: 1024, height: 1536 }}
            draggable={false}
          />
          {showGrid && (
            <div className="absolute inset-2 pointer-events-none">
              {Object.entries(frames).map(([name, frame]) => (
                <div
                  key={name}
                  className={`absolute border-2 cursor-move pointer-events-auto ${selectedFrame === name ? "z-10" : ""}`}
                  style={{
                    left: frame.x,
                    top: frame.y,
                    width: frame.w,
                    height: frame.h,
                    borderColor: GRID_COLORS[name],
                    backgroundColor:
                      selectedFrame === name
                        ? `${GRID_COLORS[name]}30`
                        : `${GRID_COLORS[name]}15`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, name, "move")}
                >
                  <span
                    className="absolute top-1 left-1 text-xs font-bold px-1 rounded text-white"
                    style={{ backgroundColor: GRID_COLORS[name] }}
                  >
                    {name.replace("stavle-", "")}
                  </span>
                  <span className="absolute bottom-1 right-1 text-xs font-mono bg-black/70 text-white px-1 rounded">
                    {frame.x},{frame.y} ({frame.w}×{frame.h})
                  </span>
                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    style={{ backgroundColor: GRID_COLORS[name] }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleMouseDown(e, name, "resize");
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Live Preview Gallery */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Live Preview (128px)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {Object.entries(frames).map(([name]) => (
            <div
              key={name}
              className="bg-white p-4 rounded-lg shadow text-center"
            >
              <div className="mb-2 flex justify-center">
                <div className="border-2 border-dashed border-gray-300 p-2">
                  {renderPreview(name, 128)}
                </div>
              </div>
              <p className="font-medium text-sm">
                {name.replace("stavle-", "")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Export Data */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Current Frame Data (for Stavle.tsx)
        </h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(
            { frames, meta: { size: { w: 1024, h: 1536 } } },
            null,
            2,
          )}
        </pre>
      </section>
    </div>
  );
}
