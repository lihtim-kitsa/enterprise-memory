'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import mockGraph, { GraphNode } from './mockgraph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const NODE_COLORS: Record<GraphNode['type'], string> = {
  person: '#3b82f6',
  project: '#10b981',
  decision: '#f59e0b',
};

const NODE_RADIUS = 6;

function paintNode(node: GraphNode, ctx: CanvasRenderingContext2D) {
  const x = (node as any).x as number;
  const y = (node as any).y as number;

  ctx.beginPath();
  ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = NODE_COLORS[node.type];
  ctx.fill();

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(node.name, x, y + NODE_RADIUS + 3);
}

function connectionCount(nodeId: string) {
  return mockGraph.links.filter(
    (l) => l.source === nodeId || l.target === nodeId,
  ).length;
}

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111827' }}>
      <ForceGraph2D
        graphData={mockGraph}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        nodeCanvasObject={(node, ctx) => paintNode(node as GraphNode, ctx)}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          const x = (node as any).x as number;
          const y = (node as any).y as number;
          ctx.beginPath();
          ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={(node) => setSelectedNode(node as GraphNode)}
      />

      {selectedNode && (
        <div className="fixed top-4 right-4 w-56 rounded-xl bg-gray-900 p-4 text-white shadow-lg ring-1 ring-white/10">
          <p className="text-lg font-semibold leading-tight">{selectedNode.name}</p>
          <p className="mt-1 text-sm capitalize text-gray-400">{selectedNode.type}</p>
          <div className="mt-3 border-t border-white/10 pt-3 text-sm text-gray-300">
            <span className="text-gray-500">Connections</span>{' '}
            <span className="font-medium text-white">{connectionCount(selectedNode.id)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
