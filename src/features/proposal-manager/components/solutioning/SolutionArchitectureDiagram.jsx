import React, { useMemo } from "react";
import { motion } from "framer-motion";

const NODE_W = 168;
const NODE_H = 52;
const LAYER_PAD = 16;
const LAYER_GAP = 72;
const NODE_GAP = 20;

function layoutDiagram(diagramSpec) {
  const layers = diagramSpec?.layers?.length ? diagramSpec.layers : ["Architecture"];
  const nodes = Array.isArray(diagramSpec?.nodes) ? diagramSpec.nodes : [];
  const edges = Array.isArray(diagramSpec?.edges) ? diagramSpec.edges : [];

  const byLayer = {};
  for (const layer of layers) byLayer[layer] = [];
  for (const node of nodes) {
    const layer = byLayer[node.layer] ? node.layer : layers[0];
    if (!byLayer[layer]) byLayer[layer] = [];
    byLayer[layer].push(node);
  }

  let y = LAYER_PAD;
  const positioned = [];
  const layerBands = [];

  for (const layer of layers) {
    const row = byLayer[layer] || [];
    const rowWidth = row.length * NODE_W + Math.max(0, row.length - 1) * NODE_GAP;
    const startX = LAYER_PAD;
    let x = startX;

    for (const node of row) {
      positioned.push({ ...node, x, y, layer });
      x += NODE_W + NODE_GAP;
    }

    layerBands.push({
      layer,
      x: LAYER_PAD - 8,
      y: y - 8,
      width: Math.max(rowWidth, NODE_W) + 16,
      height: NODE_H + 16,
    });

    y += NODE_H + LAYER_GAP;
  }

  const posById = Object.fromEntries(positioned.map((n) => [n.id, n]));
  const positionedEdges = edges
    .filter((e) => posById[e.from] && posById[e.to])
    .map((e) => {
      const from = posById[e.from];
      const to = posById[e.to];
      return {
        ...e,
        x1: from.x + NODE_W / 2,
        y1: from.y + NODE_H,
        x2: to.x + NODE_W / 2,
        y2: to.y,
        midX: (from.x + to.x + NODE_W) / 2,
        midY: (from.y + to.y + NODE_H) / 2,
      };
    });

  const width = Math.max(
    ...positioned.map((n) => n.x + NODE_W),
    ...layerBands.map((b) => b.x + b.width),
    400,
  ) + LAYER_PAD;
  const height = y + LAYER_PAD;

  return { positioned, positionedEdges, layerBands, width, height, layers };
}

export default function SolutionArchitectureDiagram({ diagramSpec, className = "" }) {
  const layout = useMemo(() => layoutDiagram(diagramSpec), [diagramSpec]);

  if (!layout.positioned.length) {
    return (
      <div className={`rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-sm text-gray-500 ${className}`}>
        No architecture diagram nodes yet.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 ${className}`}>
      <svg
        width={layout.width}
        height={layout.height}
        className="min-w-full"
        role="img"
        aria-label="Solution architecture diagram"
      >
        <defs>
          <marker id="sol-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" className="fill-blue-500 dark:fill-blue-400" />
          </marker>
          <linearGradient id="layer-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(59 130 246 / 0.06)" />
            <stop offset="100%" stopColor="rgb(99 102 241 / 0.04)" />
          </linearGradient>
        </defs>

        {layout.layerBands.map((band) => (
          <g key={band.layer}>
            <rect
              x={band.x}
              y={band.y}
              width={band.width}
              height={band.height}
              rx={10}
              fill="url(#layer-band)"
              stroke="rgb(148 163 184 / 0.35)"
              strokeWidth={1}
            />
            <text
              x={band.x + 10}
              y={band.y + 14}
              className="fill-slate-500 dark:fill-slate-400"
              fontSize={10}
              fontWeight={600}
            >
              {band.layer}
            </text>
          </g>
        ))}

        {layout.positionedEdges.map((edge, i) => (
          <g key={`e-${i}`}>
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke="rgb(59 130 246 / 0.55)"
              strokeWidth={2}
              markerEnd="url(#sol-arrow)"
            />
            {edge.label ? (
              <text
                x={edge.midX}
                y={edge.midY - 4}
                textAnchor="middle"
                fontSize={9}
                className="fill-slate-500"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        ))}

        {layout.positioned.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, y: node.y + 8 }}
            animate={{ opacity: 1, y: node.y }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
          >
            <rect
              x={node.x}
              y={node.y}
              width={NODE_W}
              height={NODE_H}
              rx={8}
              className="fill-white dark:fill-gray-800 stroke-blue-500 dark:stroke-blue-400"
              strokeWidth={1.5}
            />
            <text
              x={node.x + NODE_W / 2}
              y={node.y + 22}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              className="fill-gray-900 dark:fill-gray-100"
            >
              {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
            </text>
            {node.description ? (
              <text
                x={node.x + NODE_W / 2}
                y={node.y + 38}
                textAnchor="middle"
                fontSize={9}
                className="fill-gray-500 dark:fill-gray-400"
              >
                {node.description.length > 28 ? `${node.description.slice(0, 26)}…` : node.description}
              </text>
            ) : null}
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
