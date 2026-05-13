'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import mockGraph, { GraphNode, NodeType } from './mockgraph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const NODE_COLORS: Record<GraphNode['type'], string> = {
  person: '#3b82f6',
  project: '#10b981',
  decision: '#f59e0b',
};

const NODE_RADIUS = 6;

function paintNode(node: GraphNode, ctx: CanvasRenderingContext2D, color: string) {
  const x = (node as any).x as number;
  const y = (node as any).y as number;

  ctx.beginPath();
  ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(node.name, x, y + NODE_RADIUS + 3);
}

function linkEndId(end: unknown): string {
  return typeof end === 'object' && end !== null
    ? (end as GraphNode).id
    : (end as string);
}

const NODE_INDEX = new Map(mockGraph.nodes.map((n) => [n.id, n]));

const TYPE_LABEL: Record<NodeType, string> = {
  person: 'People',
  project: 'Projects',
  decision: 'Decisions',
};

function getConnectedByType(nodeId: string): Record<NodeType, GraphNode[]> {
  const groups: Record<NodeType, GraphNode[]> = { person: [], project: [], decision: [] };
  for (const l of mockGraph.links) {
    const otherId = l.source === nodeId ? l.target : l.target === nodeId ? l.source : null;
    if (!otherId) continue;
    const other = NODE_INDEX.get(otherId as string);
    if (other) groups[other.type].push(other);
  }
  return groups;
}

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const connectedByType = useMemo(
    () => (selectedNode ? getConnectedByType(selectedNode.id) : null),
    [selectedNode],
  );

  const connectedIds = useMemo<Set<string>>(() => {
    if (!connectedByType) return new Set();
    return new Set(
      (Object.values(connectedByType) as GraphNode[][]).flat().map((n) => n.id),
    );
  }, [connectedByType]);

  function nodeColor(node: GraphNode): string {
    if (!selectedNode) return NODE_COLORS[node.type];
    if (node.id === selectedNode.id || connectedIds.has(node.id)) return NODE_COLORS[node.type];
    return '#4b5563';
  }

  function getLinkColor(link: unknown): string {
    if (!selectedNode) return '#374151';
    const l = link as { source: unknown; target: unknown };
    const src = linkEndId(l.source);
    const tgt = linkEndId(l.target);
    if (src === selectedNode.id || tgt === selectedNode.id) return '#fbbf24';
    return '#1f2937';
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111827' }}>
      <ForceGraph2D
        graphData={mockGraph}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        nodeCanvasObject={(node, ctx) => paintNode(node as GraphNode, ctx, nodeColor(node as GraphNode))}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          const x = (node as any).x as number;
          const y = (node as any).y as number;
          ctx.beginPath();
          ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={getLinkColor}
        onNodeClick={(node) => setSelectedNode(node as GraphNode)}
        onBackgroundClick={() => setSelectedNode(null)}
      />

      {selectedNode && connectedByType && (
        <div className="fixed top-4 right-4 w-60 rounded-xl bg-gray-900 p-4 text-white shadow-lg ring-1 ring-white/10">
          <p className="text-lg font-semibold leading-tight">{selectedNode.name}</p>
          <p className="mt-1 text-sm capitalize text-gray-400">{selectedNode.type}</p>
          <div className="mt-3 border-t border-white/10 pt-3 text-sm">
            <p className="mb-2 text-gray-500">Connected to:</p>
            {((['person', 'project', 'decision'] as NodeType[]).map((type) => {
              const nodes = connectedByType[type].slice(0, 10);
              if (!nodes.length) return null;
              return (
                <div key={type} className="mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {TYPE_LABEL[type]}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {nodes.map((n) => (
                      <li key={n.id} className="truncate text-gray-200">{n.name}</li>
                    ))}
                  </ul>
                </div>
              );
            }))}
          </div>
        </div>
      )}
    </div>
  );
}
