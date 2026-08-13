import React, { useMemo } from "react";

const NODE_W = 172;
const NODE_H = 58;
const LAYER_PAD = 20;
const LAYER_GAP = 78;
const NODE_GAP = 18;

const OWNER_FILL = {
  customer: { stroke: "#64748b", fill: "#ffffff", band: "#f1f5f9", text: "#0f172a" },
  juno: { stroke: "#4f46e5", fill: "#eef2ff", band: "#e0e7ff", text: "#312e81" },
  integration: { stroke: "#0f766e", fill: "#ccfbf1", band: "#ccfbf1", text: "#115e59" },
};

export function TopologyGlyph({ icon, className = "h-4 w-4", fill = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill={fill}>
      <path d={iconPath(icon)} />
    </svg>
  );
}

function iconPath(icon) {
  switch (icon) {
    case "users":
      return "M12 12a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 12 12Zm0 1.6c-2.7 0-8 1.35-8 4v1.2h16V17.6c0-2.65-5.3-4-8-4Z";
    case "portal":
      return "M4 5h16v14H4V5Zm2 2v10h12V7H6Zm3 3h6v1.5H9V10Zm0 3h4v1.5H9V13Z";
    case "app":
      return "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z";
    case "cloud":
      return "M9 18H6.5A3.5 3.5 0 1 1 8 11.2 5 5 0 0 1 17.8 13 3.2 3.2 0 0 1 18 18h-9Z";
    case "database":
      return "M12 4c-4 0-7 1.2-7 2.7v10.6C5 18.8 8 20 12 20s7-1.2 7-2.7V6.7C19 5.2 16 4 12 4Zm0 2c3.3 0 5 .9 5 1.4S15.3 9 12 9 7 8 7 7.4 8.7 6 12 6Zm5 4.2c0 .5-1.7 1.4-5 1.4s-5-.9-5-1.4V8.5C8.2 9.2 10 9.8 12 9.8s3.8-.6 5-1.3Zm0 4.3c0 .5-1.7 1.4-5 1.4s-5-.9-5-1.4v-1.8c1.2.7 3 1.3 5 1.3s3.8-.6 5-1.3Z";
    case "lock":
      return "M8 11V8a4 4 0 1 1 8 0v3h1.5v9h-11v-9H8Zm2 0h4V8a2 2 0 1 0-4 0Zm2 4.2a1.3 1.3 0 1 0 1.3 1.3A1.3 1.3 0 0 0 12 15.2Z";
    case "network":
      return "M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5ZM6 9.1v5.5l6 3.4 6-3.4V9.1L12 5.7 6 9.1Z";
    case "document":
      return "M7 3h8l4 4v14H7V3Zm8 1.8V8h3.2L15 4.8ZM9 11h8v1.5H9V11Zm0 3h8v1.5H9V14Zm0 3h5v1.5H9V17Z";
    case "spark":
      return "M12 3 9.8 9.8 3 12l6.8 2.2L12 21l2.2-6.8L21 12l-6.8-2.2L12 3Z";
    case "collab":
      return "M8.5 10a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 8.5 10Zm7 0A2.5 2.5 0 1 0 13 7.5 2.5 2.5 0 0 0 15.5 10ZM4 18v-1.2c0-1.7 2.5-2.8 4.5-2.8s4.5 1.1 4.5 2.8V18Zm7.2 0v-1.2c0-.6.2-1.2.6-1.7 1 .5 2.2.8 3.2.8 2 0 4.5-1.1 4.5-2.8V18Z";
    case "export":
      return "M6 4h9l3 3v13H6V4Zm2 4h10v2H8V8Zm0 4h7v2H8v-2Zm0 4h5v2H8v-2Z";
    default:
      return "M6 6h12v12H6V6Z";
  }
}

function layoutDiagram(spec) {
  const layers = spec?.layers?.length ? spec.layers : ["Environment"];
  const nodes = Array.isArray(spec?.nodes) ? spec.nodes : [];
  const edges = Array.isArray(spec?.edges) ? spec.edges : [];

  const byLayer = {};
  for (const layer of layers) byLayer[layer] = [];
  for (const node of nodes) {
    const layer = byLayer[node.layer] ? node.layer : layers[0];
    byLayer[layer].push(node);
  }

  let y = LAYER_PAD + 8;
  const positioned = [];
  const layerBands = [];

  for (const layer of layers) {
    const row = byLayer[layer] || [];
    const rowWidth = Math.max(row.length * NODE_W + Math.max(0, row.length - 1) * NODE_GAP, NODE_W);
    let x = LAYER_PAD;
    for (const node of row) {
      positioned.push({ ...node, x, y, layer });
      x += NODE_W + NODE_GAP;
    }
    const isJuno = layer === "JUNO overlay";
    layerBands.push({
      layer,
      x: LAYER_PAD - 10,
      y: y - 14,
      width: rowWidth + 20,
      height: NODE_H + 28,
      owner: isJuno ? "juno" : "customer",
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
      };
    });

  const width =
    Math.max(...positioned.map((n) => n.x + NODE_W), ...layerBands.map((b) => b.x + b.width), 480) + LAYER_PAD;
  const height = y + LAYER_PAD;

  return { positioned, positionedEdges, layerBands, width, height };
}

export default function TopologyEnvironmentDiagram({ diagramSpec, className = "" }) {
  const layout = useMemo(() => layoutDiagram(diagramSpec), [diagramSpec]);

  if (!layout.positioned.length) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 ${className}`}>
        No topology to display.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}>
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Customer environment topology"
      >
        <defs>
          <marker id="topo-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker id="topo-arrow-juno" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
          </marker>
          <marker id="topo-arrow-int" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f766e" />
          </marker>
        </defs>

        {layout.layerBands.map((band) => {
          const colors = OWNER_FILL[band.owner] || OWNER_FILL.customer;
          return (
            <g key={band.layer}>
              <rect x={band.x} y={band.y} width={band.width} height={band.height} rx="12" fill={colors.band} opacity="0.65" />
              <text x={band.x + 10} y={band.y + 12} fontSize="10" fontWeight="700" fill={colors.text} letterSpacing="0.06em">
                {band.layer.toUpperCase()}
              </text>
            </g>
          );
        })}

        {layout.positionedEdges.map((e, i) => {
          const owner = e.owner || "customer";
          const stroke = owner === "juno" ? "#4f46e5" : owner === "integration" ? "#0f766e" : "#94a3b8";
          const marker =
            owner === "juno" ? "url(#topo-arrow-juno)" : owner === "integration" ? "url(#topo-arrow-int)" : "url(#topo-arrow)";
          const dash = owner === "integration" ? "5 4" : undefined;
          return (
            <g key={`${e.from}-${e.to}-${i}`}>
              <line
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={stroke}
                strokeWidth={owner === "integration" ? 2 : 1.5}
                strokeDasharray={dash}
                markerEnd={marker}
              />
              {e.label ? (
                <text x={(e.x1 + e.x2) / 2 + 6} y={(e.y1 + e.y2) / 2} fontSize="9" fill={stroke}>
                  {e.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {layout.positioned.map((node) => {
          const colors = OWNER_FILL[node.owner] || OWNER_FILL.customer;
          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect width={NODE_W} height={NODE_H} rx="10" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.6" />
              <g transform="translate(10, 17)" fill={colors.stroke}>
                <path d={iconPath(node.icon)} transform="scale(0.72)" />
              </g>
              <text x="36" y="24" fontSize="11" fontWeight="700" fill={colors.text}>
                {(node.label || "").slice(0, 20)}
              </text>
              <text x="36" y="40" fontSize="9" fill="#64748b">
                {(node.description || "").slice(0, 24)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
