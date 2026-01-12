"use client";

import { useState } from "react";
import Stavle, { StavlePose, StavleSize } from "@/components/Stavle";

const POSES: StavlePose[] = [
  "celebrating",
  "encouraging",
  "waving",
  "thinking",
  "reading",
  "pointing",
  "idle",
];

const SIZES: StavleSize[] = [48, 64, 96, 128, 160, 200];

const POSE_COLORS: Record<StavlePose, string> = {
  celebrating: "#22c55e",
  encouraging: "#3b82f6",
  waving: "#eab308",
  thinking: "#a855f7",
  reading: "#ec4899",
  pointing: "#f97316",
  idle: "#84cc16",
};

export default function StavleTestPage() {
  const [animate, setAnimate] = useState(false);
  const [selectedSize, setSelectedSize] = useState<StavleSize>(128);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Stavle Pose Preview</h1>

      {/* Controls */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="w-4 h-4"
          />
          Animate
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Size:</span>
          <select
            value={selectedSize}
            onChange={(e) =>
              setSelectedSize(Number(e.target.value) as StavleSize)
            }
            className="px-2 py-1 border rounded"
          >
            {SIZES.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pose Gallery */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          All Poses ({selectedSize}px)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {POSES.map((pose) => (
            <div
              key={pose}
              className="bg-white p-4 rounded-lg shadow text-center"
            >
              <div
                className="mb-3 flex justify-center items-end"
                style={{ height: selectedSize + 20 }}
              >
                <Stavle pose={pose} size={selectedSize} animate={animate} />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: POSE_COLORS[pose] }}
                />
                <p className="font-medium text-sm">{pose}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Size Comparison */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Size Comparison</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-wrap items-end gap-6">
            {SIZES.map((size) => (
              <div key={size} className="text-center">
                <Stavle pose="waving" size={size} animate={animate} />
                <p className="mt-2 text-sm font-medium">{size}px</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
        <div className="grid gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Correct Answer Feedback</h3>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
              <Stavle pose="celebrating" size={64} animate />
              <span className="text-green-800 font-medium">Helt riktig!</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Wrong Answer Feedback</h3>
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded">
              <Stavle pose="encouraging" size={48} animate />
              <span className="text-red-800 font-medium">
                Nesten... Prøv igjen!
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-2">Empty State</h3>
            <div className="flex flex-col items-center gap-3 p-6 bg-gray-50 rounded">
              <Stavle pose="pointing" size={128} animate />
              <span className="text-gray-600">
                Ingen ordsett ennå — lag det første!
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
