'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import mockGraph, { GraphData, GraphNode, NodeType } from './mockgraph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const NODE_COLORS: Record<GraphNode['type'], string> = {
  person: '#3b82f6',
  project: '#10b981',
  decision: '#f59e0b',
};

const TYPE_LABEL: Record<NodeType, string> = {
  person: 'People',
  project: 'Projects',
  decision: 'Decisions',
};

function paintNode(node: GraphNode, ctx: CanvasRenderingContext2D, color: string, radius: number) {
  const x = (node as any).x as number;
  const y = (node as any).y as number;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#e5e7eb';
  ctx.fillText(node.name, x, y + radius + 3);
}

function linkEndId(end: unknown): string {
  return typeof end === 'object' && end !== null
    ? (end as GraphNode).id
    : (end as string);
}

function getConnectedByType(
  nodeId: string,
  graph: GraphData,
  nodeIndex: Map<string, GraphNode>,
): Record<NodeType, GraphNode[]> {
  const groups: Record<NodeType, GraphNode[]> = { person: [], project: [], decision: [] };
  for (const l of graph.links) {
    const otherId = l.source === nodeId ? l.target : l.target === nodeId ? l.source : null;
    if (!otherId) continue;
    const other = nodeIndex.get(otherId as string);
    if (other) groups[other.type].push(other);
  }
  return groups;
}

export default function GraphPage() {
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/graph')
      .then((res) => {
        if (!res.ok) throw new Error('non-200');
        return res.json() as Promise<GraphData>;
      })
      .then(setGraphData)
      .catch(() => setGraphData(mockGraph))
      .finally(() => setLoading(false));
  }, []);

  const nodeIndex = useMemo(
    () => new Map((graphData?.nodes ?? []).map((n) => [n.id, n])),
    [graphData],
  );

  const connectedByType = useMemo(
    () => (selectedNode && graphData ? getConnectedByType(selectedNode.id, graphData, nodeIndex) : null),
    [selectedNode, graphData, nodeIndex],
  );

  const degreeMap = useMemo<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const l of (graphData?.links ?? [])) {
      map.set(l.source as string, (map.get(l.source as string) ?? 0) + 1);
      map.set(l.target as string, (map.get(l.target as string) ?? 0) + 1);
    }
    return map;
  }, [graphData]);

  function nodeRadius(id: string): number {
    return Math.max(4, (degreeMap.get(id) ?? 0) * 2);
  }

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

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !graphData) return;
    const match = graphData.nodes.find((n) =>
      n.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (!match) return;
    const x = (match as any).x as number;
    const y = (match as any).y as number;
    graphRef.current?.centerAt(x, y, 1000);
    graphRef.current?.zoom(2.5, 1000);
    setSelectedNode(match);
  }

  function getLinkColor(link: unknown): string {
    if (!selectedNode) return '#374151';
    const l = link as { source: unknown; target: unknown };
    const src = linkEndId(l.source);
    const tgt = linkEndId(l.target);
    if (src === selectedNode.id || tgt === selectedNode.id) return '#fbbf24';
    return '#1f2937';
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111827' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData!}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        nodeVal={(node) => Math.max(4, (degreeMap.get((node as GraphNode).id) ?? 0) * 2)}
        nodeCanvasObject={(node, ctx) => {
          const n = node as GraphNode;
          paintNode(n, ctx, nodeColor(n), nodeRadius(n.id));
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          const x = (node as any).x as number;
          const y = (node as any).y as number;
          ctx.beginPath();
          ctx.arc(x, y, nodeRadius((node as GraphNode).id), 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkColor={getLinkColor}
        onNodeClick={(node) => setSelectedNode(node as GraphNode)}
        onBackgroundClick={() => setSelectedNode(null)}
      />

      <div className="fixed top-4 left-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Search nodes… (Enter)"
          className="w-56 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-blue-500"
        />
      </div>

      <div className="fixed bottom-4 left-4 rounded-lg bg-white/90 p-3 text-sm shadow backdrop-blur">
        {([
          { label: 'People',    color: NODE_COLORS.person   },
          { label: 'Projects',  color: NODE_COLORS.project  },
          { label: 'Decisions', color: NODE_COLORS.decision },
        ] as const).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 py-0.5">
            <span className="inline-block h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {selectedNode && connectedByType && (
        <div className="fixed top-4 right-4 w-60 rounded-xl bg-gray-900 p-4 text-white shadow-lg ring-1 ring-white/10">
          <p className="text-lg font-semibold leading-tight">{selectedNode.name}</p>
          <p className="mt-1 text-sm capitalize text-gray-400">{selectedNode.type}</p>
          <div className="mt-3 border-t border-white/10 pt-3 text-sm">
            <p className="mb-2 text-gray-500">Connected to:</p>
            {(['person', 'project', 'decision'] as NodeType[]).map((type) => {
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}
