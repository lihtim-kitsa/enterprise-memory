export type NodeType = 'person' | 'project' | 'decision';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const mockGraph: GraphData = {
  nodes: [
    // People
    { id: 'p1', type: 'person', name: 'Aisha Rowe' },
    { id: 'p2', type: 'person', name: 'Marcus Chen' },
    { id: 'p3', type: 'person', name: 'Sofia Diaz' },
    { id: 'p4', type: 'person', name: 'James Okafor' },
    { id: 'p5', type: 'person', name: 'Priya Nair' },
    { id: 'p6', type: 'person', name: 'Lena Kovacs' },
    { id: 'p7', type: 'person', name: 'Tom Walsh' },
    { id: 'p8', type: 'person', name: 'Dev Patel' },

    // Projects
    { id: 'proj1', type: 'project', name: 'Auth Overhaul' },
    { id: 'proj2', type: 'project', name: 'Data Pipeline v2' },
    { id: 'proj3', type: 'project', name: 'Mobile App' },
    { id: 'proj4', type: 'project', name: 'Customer Dashboard' },

    // Decisions
    { id: 'd1', type: 'decision', name: 'Adopt SSO via OAuth2' },
    { id: 'd2', type: 'decision', name: 'Migrate to Kafka' },
    { id: 'd3', type: 'decision', name: 'Drop React Native for Expo' },
  ],

  links: [
    // Ownership — people own projects
    { source: 'p1', target: 'proj1', relation: 'owns', weight: 1.0 },
    { source: 'p2', target: 'proj2', relation: 'owns', weight: 1.0 },
    { source: 'p3', target: 'proj3', relation: 'owns', weight: 1.0 },
    { source: 'p4', target: 'proj4', relation: 'owns', weight: 1.0 },

    // Assignments — people assigned to multiple projects
    { source: 'p5', target: 'proj1', relation: 'assigned', weight: 0.8 },
    { source: 'p6', target: 'proj1', relation: 'assigned', weight: 0.6 },
    { source: 'p7', target: 'proj2', relation: 'assigned', weight: 0.9 },
    { source: 'p8', target: 'proj2', relation: 'assigned', weight: 0.7 },
    { source: 'p5', target: 'proj4', relation: 'assigned', weight: 0.5 },
    { source: 'p6', target: 'proj3', relation: 'assigned', weight: 0.8 },
    { source: 'p2', target: 'proj4', relation: 'assigned', weight: 0.4 },
    { source: 'p8', target: 'proj3', relation: 'assigned', weight: 0.6 },

    // Decisions linked to projects
    { source: 'proj1', target: 'd1', relation: 'has_decision', weight: 1.0 },
    { source: 'proj2', target: 'd2', relation: 'has_decision', weight: 1.0 },
    { source: 'proj3', target: 'd3', relation: 'has_decision', weight: 1.0 },

    // People who made or influenced decisions
    { source: 'p1', target: 'd1', relation: 'decided', weight: 1.0 },
    { source: 'p5', target: 'd1', relation: 'reviewed', weight: 0.7 },
    { source: 'p2', target: 'd2', relation: 'decided', weight: 1.0 },
    { source: 'p7', target: 'd2', relation: 'reviewed', weight: 0.8 },
    { source: 'p3', target: 'd3', relation: 'decided', weight: 1.0 },
    { source: 'p6', target: 'd3', relation: 'reviewed', weight: 0.6 },
    { source: 'p4', target: 'd1', relation: 'reviewed', weight: 0.5 },

    // Cross-team collaboration
    { source: 'p1', target: 'proj3', relation: 'consults', weight: 0.4 },
    { source: 'p3', target: 'proj4', relation: 'consults', weight: 0.3 },
    { source: 'p4', target: 'proj2', relation: 'consults', weight: 0.5 },
    { source: 'p7', target: 'proj4', relation: 'assigned', weight: 0.5 },
  ],
};

export default mockGraph;
