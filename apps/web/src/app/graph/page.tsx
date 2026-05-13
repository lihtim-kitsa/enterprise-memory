'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { GraphData, GraphNode, NodeType } from './mockgraph';

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

function GraphPageInner() {
  const searchParams = useSearchParams();
  const deepLinkedId = searchParams.get('node');
  const pendingCenterRef = useRef<string | null>(null);

  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [query, setQuery] = useState('');
  const [showPeople,    setShowPeople]    = useState(true);
  const [showProjects,  setShowProjects]  = useState(true);
  const [showDecisions, setShowDecisions] = useState(true);
  const [graphReady, setGraphReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) requestAnimationFrame(() => setGraphReady(true));
  }, [loading]);

  useEffect(() => {
    fetch('/api/graph')
      .then((res) => {
        if (!res.ok) throw new Error('non-200');
        return res.json() as Promise<GraphData>;
      })
      .then(setGraphData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load graph data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!graphData || !deepLinkedId) return;
    const node = graphData.nodes.find((n) => n.id === deepLinkedId);
    if (!node) return;
    setSelectedNode(node);
    pendingCenterRef.current = deepLinkedId;
  }, [graphData, deepLinkedId]);

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

  const typeVisible: Record<NodeType, boolean> = {
    person:   showPeople,
    project:  showProjects,
    decision: showDecisions,
  };

  function isNodeVisible(node: unknown): boolean {
    return typeVisible[(node as GraphNode).type];
  }

  function isLinkVisible(link: unknown): boolean {
    const l = link as { source: unknown; target: unknown };
    const src = nodeIndex.get(linkEndId(l.source));
    const tgt = nodeIndex.get(linkEndId(l.target));
    return !!src && !!tgt && typeVisible[src.type] && typeVisible[tgt.type];
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
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-600 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 p-6">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl bg-red-950/60 p-8 text-center ring-1 ring-red-500/40 shadow-2xl shadow-black/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-red-300">Could not load graph</p>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 ring-1 ring-red-500/40 transition-colors hover:bg-red-500/30"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-6 text-center">
        <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
          <circle cx="20" cy="48" r="10" fill="#1d4ed8" opacity="0.5" />
          <circle cx="60" cy="16" r="10" fill="#065f46" opacity="0.5" />
          <circle cx="100" cy="48" r="10" fill="#92400e" opacity="0.5" />
          <circle cx="60" cy="80" r="10" fill="#1d4ed8" opacity="0.5" />
          <line x1="20" y1="48" x2="60" y2="16" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="60" y1="16" x2="100" y2="48" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="20" y1="48" x2="60" y2="80" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="100" y1="48" x2="60" y2="80" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
        <div className="max-w-xs">
          <p className="text-xl font-semibold text-white">Your graph is empty</p>
          <p className="mt-2 text-sm text-gray-400">
            Connect Notion or Slack to start building your enterprise knowledge graph automatically.
          </p>
        </div>
        <Link
          href="/connect"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-blue-500"
        >
          Connect a source
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`transition-opacity duration-700 ${graphReady ? 'opacity-100' : 'opacity-0'}`}
      style={{ width: '100vw', height: '100vh', background: '#111827' }}
    >
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
        nodeVisibility={isNodeVisible}
        linkVisibility={isLinkVisible}
        linkColor={getLinkColor}
        onNodeClick={(node) => setSelectedNode(node as GraphNode)}
        onBackgroundClick={() => setSelectedNode(null)}
        onEngineStop={() => {
          if (!pendingCenterRef.current || !graphData) return;
          const node = graphData.nodes.find((n) => n.id === pendingCenterRef.current);
          pendingCenterRef.current = null;
          if (!node) return;
          graphRef.current?.centerAt((node as any).x, (node as any).y, 1000);
          graphRef.current?.zoom(2.5, 1000);
        }}
      />

      <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-2">
        {([
          { label: 'People',    active: showPeople,    toggle: () => setShowPeople(v => !v),    color: NODE_COLORS.person   },
          { label: 'Projects',  active: showProjects,  toggle: () => setShowProjects(v => !v),  color: NODE_COLORS.project  },
          { label: 'Decisions', active: showDecisions, toggle: () => setShowDecisions(v => !v), color: NODE_COLORS.decision },
        ] as const).map(({ label, active, toggle, color }) => (
          <button
            key={label}
            onClick={toggle}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active ? 'text-white shadow-lg shadow-black/40' : 'bg-gray-800 text-gray-500 ring-1 ring-white/10'
            }`}
            style={active ? { background: color } : undefined}
          >
            <span className="inline-block h-2 w-2 rounded-full bg-current opacity-80" />
            {label}
          </button>
        ))}
      </div>

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

      <div className="fixed bottom-4 left-4 rounded-lg bg-white/90 p-3 text-sm shadow-lg shadow-black/20 backdrop-blur">
        {([
          { label: 'People',    color: NODE_COLORS.person   },
          { label: 'Projects',  color: NODE_COLORS.project  },
          { label: 'Decisions', color: NODE_COLORS.decision },
        ] as const).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 py-1">
            <span className="inline-block h-3 w-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {selectedNode && connectedByType && (
        <div className="fixed top-4 right-4 w-60 rounded-xl bg-gray-900 p-4 text-white shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <p className="text-lg font-semibold leading-tight">{selectedNode.name}</p>
          <p className="mt-1 text-sm capitalize text-gray-400">{selectedNode.type}</p>
          {selectedNode.sourceUrl && (
            <a
              href={selectedNode.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-blue-300 hover:bg-white/20 hover:text-blue-200 transition-colors"
            >
              View source: {selectedNode.sourceLabel ?? selectedNode.sourceUrl}
            </a>
          )}
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
                  <ul className="mt-1 space-y-1">
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

export default function GraphPage() {
  return (
    <Suspense>
      <GraphPageInner />
    </Suspense>
  );
}
