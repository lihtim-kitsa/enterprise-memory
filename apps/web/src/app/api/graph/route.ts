import { NextResponse } from 'next/server';
import mockGraph from '../../graph/mockgraph';

export function GET() {
  return NextResponse.json(mockGraph);
}
