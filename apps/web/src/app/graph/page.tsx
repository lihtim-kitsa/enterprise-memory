'use client';

import dynamic from 'next/dynamic';
import mockGraph from './mockgraph';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function GraphPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ForceGraph2D
        graphData={mockGraph}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
      />
    </div>
  );
}
